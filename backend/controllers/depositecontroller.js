const axios = require("axios");
const mongoose = require("mongoose");

const Deposit = require("../models/Deposit.js");
const User = require("../models/userModel");
const TransactionHistory = require("../models/TransactionHistory");
const AdminGateway = require("../models/AdminGateway");
const LotteryConfig = require("../models/LotteryConfig");
const { addUserLotteryEntry } = require("./lotteryConfigController.js");

// =====================================================
// HELPER: GATEWAY HEADERS
// =====================================================

const getGatewayHeaders = (gateway) => {
  if (!gateway.apiKey || !gateway.secretKey) {
    throw new Error("Gateway credentials are not configured");
  }

  return {
    "Content-Type": "application/json",
    "X-API-Key": gateway.apiKey,
    "X-API-Secret": gateway.secretKey,
  };
};

// =====================================================
// HELPER: FRONTEND PAYMENT REDIRECT
// =====================================================

const getFrontendUrl = () => {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "https://lotterry.marinclub.site"
  ).replace(/\/$/, "");
};

const redirectPaymentPage = (
  res,
  page,
  { orderId = "", amount = "", number = "", status = "" } = {}
) => {
  const params = new URLSearchParams();

  if (orderId !== "") params.set("order_id", String(orderId));
  if (amount !== "") params.set("amount", String(amount));
  if (number !== "") params.set("number", String(number));
  if (status !== "") params.set("status", String(status));

  return res.redirect(
    `${getFrontendUrl()}/${page}?${params.toString()}`
  );
};

// =====================================================
// CREATE DEPOSIT REQUEST
// =====================================================

const createDeposit = async (req, res) => {
  try {
    const {
      gatewayId,
      paymentMethod,
      channel,
      amount,
      utr,
      configId,
      entryId,
      number,
    } = req.body;

    // =====================================================
    // VALIDATE AMOUNT
    // =====================================================

    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // =====================================================
    // USER
    // =====================================================

    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.uuid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // VARIABLES
    // =====================================================

    let finalPaymentMethod = paymentMethod;
    let finalChannel = channel;
    let resolvedGatewayId = null;

    const usdRet = 92;
    let money = 0;

    // =====================================================
    // GATEWAY SELECTED
    // =====================================================

    if (gatewayId) {
      const gateway = await AdminGateway.findById(gatewayId);

      if (!gateway) {
        return res.status(404).json({
          success: false,
          message: "Payment gateway not found",
        });
      }

      if (gateway.status !== 1) {
        return res.status(400).json({
          success: false,
          message:
            "Selected payment gateway is currently disabled/inactive",
        });
      }

      const minLimit = Number(gateway.minLimit || 0);
      const maxLimit = Number(gateway.maxLimit || Number.MAX_SAFE_INTEGER);

      if (numericAmount < minLimit || numericAmount > maxLimit) {
        return res.status(400).json({
          success: false,
          message: `Deposit amount must be between ${minLimit} and ${maxLimit} for this gateway.`,
        });
      }

      resolvedGatewayId = gateway._id;
      finalChannel = gateway.name;

      // =====================================================
      // AUTOMATIC GATEWAY
      // =====================================================

      if (gateway.mode === "automatic") {
        finalPaymentMethod = "INR";
        money = numericAmount;

        const orderId = `DEP${Date.now()}`;

        const deposit = await Deposit.create({
          userId: user._id,
          gatewayId: resolvedGatewayId,

          uid: user.uuid,
          phone: user.mobile,
          username: user.username,

          orderId,

          paymentMethod: finalPaymentMethod,
          type: paymentMethod || "INR",
          channel: finalChannel,

          amount: money,
          exchangeRate: 0,

          transactionId: orderId,

          utr: "",

          status: 0,

          configId: configId || null,
          entryId: entryId || null,
          number: number || null,
        });

        const callbackUrl =
          process.env.GATEWAY_CALLBACK_URL ||
          `${req.protocol}://${req.get("host")}/api/deposit/callback`;

        const gatewayBaseUrl =
          gateway.gatewayUrl || "https://mch.voterx.xyz";

        const payload = {
          amount: Math.round(numericAmount),
          order_id: orderId,
          customer_name:
            user.username ||
            user.name ||
            user.mobile ||
            "Customer",

          description: `Automatic deposit via ${gateway.name}`,

          callback_url: callbackUrl,

          // Browser return URL (used only if the gateway supports it).
          return_url: `${getFrontendUrl()}/payment-success`,
        };

        console.log("====================================");
        console.log("GATEWAY CREATE ORDER");
        console.log("URL:", `${gatewayBaseUrl}/api/create-order`);
        console.log("PAYLOAD:", payload);
        console.log("====================================");

        try {
          const { data: gatewayResponse } =
            await axios.post(
              `${gatewayBaseUrl}/api/create-order`,
              payload,
              {
                headers: getGatewayHeaders(gateway),
                timeout: 30000,
              }
            );

          console.log(
            "GATEWAY CREATE ORDER RESPONSE:",
            gatewayResponse
          );

          // =====================================================
          // SUCCESS
          // =====================================================

          if (
            gatewayResponse?.status === "success" &&
            gatewayResponse?.data?.payment_url
          ) {
            deposit.paymentUrl = gatewayResponse.data.payment_url;

            if (gatewayResponse.data.order_id) {
              deposit.orderId = String(gatewayResponse.data.order_id);
            }

            await deposit.save();

            // =====================================================
            // TRANSACTION HISTORY
            // =====================================================

            await TransactionHistory.create({
              orderId: deposit.orderId,

              userId: user._id,
              uid: user.uuid,
              phone: user.mobile,

              type: "Deposit",

              amount: money,

              status: 0,

              remark: `Pending automatic deposit initiated via ${finalChannel}`,
            });

            return res.status(201).json({
              success: true,

              message:
                "Automatic payment order created successfully.",

              paymentUrl: gatewayResponse.data.payment_url,

              orderId: deposit.orderId,

              deposit,

              gatewayResponse,
            });
          }

          // =====================================================
          // CREATE ORDER FAILED
          // =====================================================

          deposit.status = 2;
          await deposit.save();

          return res.status(400).json({
            success: false,

            message:
              gatewayResponse?.error ||
              gatewayResponse?.message ||
              "Failed to create payment order on gateway",

            gatewayResponse,
          });
        } catch (gatewayErr) {
          deposit.status = 2;
          await deposit.save();

          console.error(
            "Gateway Create-Order Error:",
            gatewayErr.response?.data || gatewayErr.message
          );

          return res.status(502).json({
            success: false,

            message:
              "Payment gateway request failed. Please try again.",

            error:
              gatewayErr.response?.data || gatewayErr.message,
          });
        }
      }

      // =====================================================
      // MANUAL GATEWAY
      // =====================================================

      if (gateway.type === "Crypto") {
        finalPaymentMethod = "USDT";
        money = numericAmount * usdRet;
      } else {
        finalPaymentMethod = "INR";
        money = numericAmount;
      }
    } else {
      // =====================================================
      // OLD FRONTEND FALLBACK
      // =====================================================

      if (!paymentMethod || !channel) {
        return res.status(400).json({
          success: false,
          message:
            "gatewayId (or paymentMethod and channel) is required",
        });
      }

      finalPaymentMethod = paymentMethod;
      finalChannel = channel;

      money =
        finalPaymentMethod === "INR"
          ? numericAmount
          : numericAmount * usdRet;
    }

    // =====================================================
    // CREATE MANUAL DEPOSIT
    // =====================================================

    const orderId = `DEP${Date.now()}`;

    let imageUrl = "";

    if (req.files && req.files.image && req.files.image[0]) {
      imageUrl = req.files.image[0].path;
    }

    const deposit = await Deposit.create({
      userId: user._id,

      gatewayId: resolvedGatewayId,

      uid: user.uuid,
      phone: user.mobile,
      username: user.username,

      orderId,

      paymentMethod: finalPaymentMethod,

      type: paymentMethod || finalPaymentMethod,

      channel: finalChannel,

      amount: money,

      exchangeRate:
        finalPaymentMethod === "USDT" ? usdRet : 0,

      transactionId: orderId,

      utr: utr || "",

      paymentProof: imageUrl,

      status: 0,

      configId: configId || null,
      entryId: entryId || null,
      number: number || null,
    });

    // =====================================================
    // TRANSACTION HISTORY
    // =====================================================

    await TransactionHistory.create({
      orderId,

      userId: user._id,
      uid: user.uuid,
      phone: user.mobile,

      type: "Deposit",

      amount: money,

      status: 0,

      remark: `Deposit request submitted via ${finalChannel}`,
    });

    return res.status(201).json({
      success: true,

      message: "Deposit request submitted successfully.",

      deposit,
    });
  } catch (error) {
    console.error("CREATE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Server Error",

      error: error.message,
    });
  }
};

// =====================================================
// ONLINE PAYMENT CALLBACK
// =====================================================

const onlinePayCallback = async (req, res) => {
  console.log("====================================");
  console.log("GATEWAY CALLBACK RECEIVED");
  console.log("QUERY:", req.query);
  console.log("BODY:", req.body);
  console.log("====================================");

  try {
    // =====================================================
    // GET ORDER ID
    // =====================================================

    const resolvedOrderId =
      req.query?.order_id ||
      req.body?.order_id;

    if (!resolvedOrderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID missing",
      });
    }

    // =====================================================
    // FIND DEPOSIT
    // =====================================================

    const deposit = await Deposit.findOne({
      orderId: String(resolvedOrderId),
    });

    if (!deposit) {
      console.log(
        "Deposit not found:",
        resolvedOrderId
      );

      return res.status(404).json({
        success: false,
        message: "Deposit record not found",
      });
    }

    // =====================================================
    // ALREADY PROCESSED
    // =====================================================

    if (Number(deposit.status) === 1) {
      return redirectPaymentPage(res, "payment-success", {
        orderId: deposit.orderId,
        amount: deposit.amount,
        number: deposit.number || "",
        status: "success",
      });
    }

    // =====================================================
    // FIND GATEWAY
    // =====================================================

    const gateway = await AdminGateway.findById(
      deposit.gatewayId
    );

    if (!gateway) {
      return res.status(404).json({
        success: false,
        message:
          "Associated payment gateway not found",
      });
    }

    // =====================================================
    // GATEWAY BASE URL
    // =====================================================

    const gatewayBaseUrl =
      gateway.gatewayUrl ||
      "https://mch.voterx.xyz";

    // =====================================================
    // VERIFY PAYMENT
    // =====================================================

    console.log("====================================");
    console.log("CHECK PAYMENT STATUS");
    console.log("ORDER ID:", resolvedOrderId);
    console.log(
      "URL:",
      `${gatewayBaseUrl}/api/check-status`
    );
    console.log("====================================");

    let verificationData;

    try {
      const verificationResponse =
        await axios.post(
          `${gatewayBaseUrl}/api/check-status`,
          {
            order_id: String(resolvedOrderId),
          },
          {
            headers: getGatewayHeaders(gateway),
            timeout: 30000,
          }
        );

      verificationData =
        verificationResponse.data;

      console.log(
        "PAYMENT VERIFICATION RESPONSE:",
        verificationData
      );
    } catch (verifyError) {
      console.error(
        "PAYMENT VERIFY API ERROR:",
        verifyError.response?.data ||
        verifyError.message
      );

      return redirectPaymentPage(res, "payment-failed", {
        orderId: resolvedOrderId,
        amount: deposit.amount,
        number: deposit.number || "",
        status: "failed",
      });
    }

    // =====================================================
    // VERIFY GATEWAY RESPONSE
    //
    // YOUR GATEWAY RESPONSE:
    //
    // {
    //   status: "success",
    //   order_id: "DEP1789830110564",
    //   utr: "662883325905"
    // }
    // =====================================================

    const gatewayStatus =
      String(
        verificationData?.status || ""
      ).toLowerCase();

    // =====================================================
    // VERIFY ORDER ID
    // =====================================================

    const gatewayOrderId =
      verificationData?.order_id ||
      verificationData?.data?.order_id ||
      null;

    if (
      gatewayOrderId &&
      String(gatewayOrderId) !==
      String(resolvedOrderId)
    ) {
      console.error(
        "ORDER ID MISMATCH",
        {
          expected: resolvedOrderId,
          received: gatewayOrderId,
        }
      );

      deposit.status = 2;
      await deposit.save();

      await TransactionHistory.create({
        orderId: resolvedOrderId,

        userId: deposit.userId,
        uid: deposit.uid,
        phone: deposit.phone,

        type: "Deposit",

        amount: deposit.amount,

        status: 2,

        remark:
          `Payment verification failed: Order ID mismatch. Expected ${resolvedOrderId}, received ${gatewayOrderId}`,
      });

      return redirectPaymentPage(res, "payment-failed", {
        orderId: resolvedOrderId,
        amount: deposit.amount,
        number: deposit.number || "",
        status: "failed",
      });
    }

    // =====================================================
    // PAYMENT FAILED
    //
    // IMPORTANT:
    // payment_status is NOT required.
    //
    // Your gateway only returns:
    //
    // status: "success"
    // =====================================================

    if (gatewayStatus !== "success") {
      deposit.status = 2;

      await deposit.save();

      await TransactionHistory.create({
        orderId: resolvedOrderId,

        userId: deposit.userId,
        uid: deposit.uid,
        phone: deposit.phone,

        type: "Deposit",

        amount: deposit.amount,

        status: 2,

        remark:
          "Automatic payment verification failed",
      });

      return redirectPaymentPage(res, "payment-failed", {
        orderId: resolvedOrderId,
        amount: deposit.amount,
        number: deposit.number || "",
        status: "failed",
      });
    }

    // =====================================================
    // GET UTR
    // =====================================================

    const gatewayUtr =
      verificationData?.utr ||
      verificationData?.data?.utr ||
      "";

    // =====================================================
    // GET AMOUNT
    // =====================================================

    const gatewayAmount =
      verificationData?.amount ||
      verificationData?.data?.amount ||
      deposit.amount;

    const creditAmount = Number(
      gatewayAmount
    );

    if (
      !Number.isFinite(creditAmount) ||
      creditAmount <= 0
    ) {
      return redirectPaymentPage(res, "payment-failed", {
        orderId: resolvedOrderId,
        amount: deposit.amount,
        number: deposit.number || "",
        status: "failed",
      });
    }

    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findById(
      deposit.userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,

        message:
          "User associated with deposit not found",
      });
    }

    // =====================================================
    // ATOMIC PAYMENT CLAIM
    //
    // This prevents duplicate callbacks from
    // creating duplicate lottery entries.
    // =====================================================

    const claimed =
      await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,

          status: {
            $ne: 1,
          },
        },

        {
          $set: {
            status: 1,

            utr:
              gatewayUtr ||
              deposit.utr ||
              "",

            transactionId:
              verificationData?.gateway_txn_id ||
              verificationData?.data?.gateway_txn_id ||
              gatewayUtr ||
              deposit.transactionId,
          },
        },

        {
          new: true,
        }
      );

    // =====================================================
    // CALLBACK ALREADY CLAIMED
    // =====================================================

    if (!claimed) {
      return res.status(200).json({
        success: true,

        message:
          "Payment already processed.",

        order_id: resolvedOrderId,
      });
    }

    // =====================================================
    // IMPORTANT
    //
    // NO WALLET CREDIT
    // =====================================================

    /*
      user.wallet = Number(
        (
          Number(user.wallet || 0) +
          creditAmount
        ).toFixed(2)
      );

      await user.save();
    */

    // =====================================================
    // UPDATE LOTTERY CONFIG
    // =====================================================

    if (
      deposit.configId &&
      deposit.entryId
    ) {
      try {
        // Validate ObjectIds
        if (
          !mongoose.Types.ObjectId.isValid(
            deposit.configId
          )
        ) {
          console.warn(
            "Invalid configId:",
            deposit.configId
          );
        } else {
          const config =
            await LotteryConfig.findById(
              deposit.configId
            );

          if (!config) {
            console.warn(
              "LotteryConfig not found:",
              deposit.configId
            );
          } else {
            // =====================================================
            // FIND USER ENTRY
            // =====================================================

            let entry = null;

            if (
              config.users &&
              typeof config.users.id === "function"
            ) {
              entry = config.users.id(
                deposit.entryId
              );
            }

            // =====================================================
            // FALLBACK
            // =====================================================

            if (!entry && Array.isArray(config.users)) {
              entry =
                config.users.find(
                  (item) =>
                    String(item._id) ===
                    String(deposit.entryId)
                ) || null;
            }

            if (!entry) {
              console.warn(
                "Lottery entry not found:",
                deposit.entryId
              );
            } else {
              // =====================================================
              // MARK PURCHASED
              // =====================================================

              entry.isBuy = true;

              // =====================================================
              // OPTIONAL WIN CHECK
              // =====================================================

              if (
                config.winningNumber !== undefined &&
                config.winningNumber !== null &&
                entry.number !== undefined &&
                entry.number !== null
              ) {
                if (
                  String(entry.number) ===
                  String(config.winningNumber)
                ) {
                  entry.status = "win";

                  entry.prizeType = "1st";

                  if (!entry.prize) {
                    entry.prize = {};
                  }

                  entry.prize.first =
                    config.prizes?.first || 0;
                } else {
                  entry.status = "lost";
                }
              }

              await config.save();

              console.log(
                "===================================="
              );

              console.log(
                "LOTTERY ENTRY UPDATED"
              );

              console.log(
                "Config:",
                deposit.configId
              );

              console.log(
                "Entry:",
                deposit.entryId
              );

              console.log(
                "isBuy:",
                entry.isBuy
              );

              console.log(
                "===================================="
              );
            }
          }
        }
      } catch (lotteryError) {
        console.error(
          "LOTTERY isBuy UPDATE ERROR:",
          lotteryError
        );

        // Payment already successful.
        // Don't mark payment as failed.
      }
    } else {
      console.warn(
        "Deposit has no configId/entryId. Cannot update lottery entry.",
        {
          depositId: deposit._id,
          configId: deposit.configId,
          entryId: deposit.entryId,
        }
      );
    }

    // =====================================================
    // ADD USER LOTTERY ENTRY
    //
    // ONLY AFTER PAYMENT SUCCESS
    // =====================================================

    if (
      deposit.number !== undefined &&
      deposit.number !== null &&
      String(deposit.number).trim() !== ""
    ) {
      try {

        await addUserLotteryEntry(
          deposit.number,
          creditAmount,
          user._id
        );

        console.log(
          "addUserLotteryEntry SUCCESS:",
          {
            number: deposit.number,
            amount: creditAmount,
          }
        );
      } catch (entryError) {
        console.error(
          "addUserLotteryEntry ERROR:",
          entryError.message
        );

        // Payment already successful.
        // Do not reverse payment.
      }
    }

    // =====================================================
    // UPDATE DEPOSIT AGAIN
    // =====================================================

    claimed.utr =
      gatewayUtr ||
      claimed.utr ||
      "";

    claimed.transactionId =
      verificationData?.gateway_txn_id ||
      verificationData?.data?.gateway_txn_id ||
      gatewayUtr ||
      claimed.transactionId;

    claimed.status = 1;

    await claimed.save();

    // =====================================================
    // SUCCESS TRANSACTION HISTORY
    // =====================================================

    await TransactionHistory.create({
      orderId: resolvedOrderId,

      userId: user._id,
      uid: user.uuid,
      phone: user.mobile,

      type: "Lottery Ticket Purchase",

      amount: creditAmount,

      status: 1,

      remark:
        `Lottery ticket purchase successful via ${gateway.name}. UTR: ${gatewayUtr || "N/A"
        }. isBuy set to true. No wallet credit.`,
    });

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return redirectPaymentPage(res, "payment-success", {
      orderId: resolvedOrderId,
      amount: creditAmount,
      number: deposit.number || "",
      status: "success",
    });
  } catch (error) {
    console.error(
      "===================================="
    );

    console.error(
      "GATEWAY CALLBACK ERROR:",
      error
    );

    console.error(
      "===================================="
    );

    const failedOrderId =
      req.query?.order_id ||
      req.body?.order_id ||
      "";

    if (failedOrderId) {
      return redirectPaymentPage(res, "payment-failed", {
        orderId: failedOrderId,
        status: "failed",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Callback failed",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY DEPOSIT HISTORY
// =====================================================

const getMyDeposits = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      channel,
      phone,
      username,
      orderId,
      transactionId,
      utr,

      fromDate,
      toDate,

      minAmount,
      maxAmount,

      page = 1,
      limit = 10,

      sort = "desc",
    } = req.query;

    const userId =
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const query = {
      userId,
    };

    // =====================================================
    // STATUS
    // =====================================================

    if (status !== undefined && status !== "") {
      query.status = status;
    }

    // =====================================================
    // PAYMENT METHOD
    // =====================================================

    if (
      paymentMethod &&
      paymentMethod.trim()
    ) {
      query.paymentMethod = paymentMethod;
    }

    // =====================================================
    // CHANNEL
    // =====================================================

    if (
      channel &&
      channel.trim()
    ) {
      query.channel = channel;
    }

    // =====================================================
    // PHONE
    // =====================================================

    if (phone) {
      query.phone = {
        $regex: phone,
        $options: "i",
      };
    }

    // =====================================================
    // USERNAME
    // =====================================================

    if (username) {
      query.username = {
        $regex: username,
        $options: "i",
      };
    }

    // =====================================================
    // ORDER ID
    // =====================================================

    if (orderId) {
      query.orderId = {
        $regex: orderId,
        $options: "i",
      };
    }

    // =====================================================
    // TRANSACTION ID
    // =====================================================

    if (transactionId) {
      query.transactionId = {
        $regex: transactionId,
        $options: "i",
      };
    }

    // =====================================================
    // UTR
    // =====================================================

    if (utr) {
      query.utr = {
        $regex: utr,
        $options: "i",
      };
    }

    // =====================================================
    // AMOUNT
    // =====================================================

    if (
      minAmount !== undefined ||
      maxAmount !== undefined
    ) {
      query.amount = {};

      if (
        minAmount !== undefined &&
        minAmount !== ""
      ) {
        query.amount.$gte =
          Number(minAmount);
      }

      if (
        maxAmount !== undefined &&
        maxAmount !== ""
      ) {
        query.amount.$lte =
          Number(maxAmount);
      }
    }

    // =====================================================
    // DATE
    // =====================================================

    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) {
        const startDate =
          new Date(fromDate);

        if (!isNaN(startDate.getTime())) {
          query.createdAt.$gte =
            startDate;
        }
      }

      if (toDate) {
        const endDate =
          new Date(toDate);

        if (!isNaN(endDate.getTime())) {
          endDate.setHours(
            23,
            59,
            59,
            999
          );

          query.createdAt.$lte =
            endDate;
        }
      }
    }

    // =====================================================
    // PAGINATION
    // =====================================================

    const currentPage =
      Math.max(Number(page) || 1, 1);

    const perPage =
      Math.min(
        Math.max(Number(limit) || 10, 1),
        100
      );

    const total =
      await Deposit.countDocuments(
        query
      );

    // =====================================================
    // SORT
    // =====================================================

    const sortDirection =
      String(sort).toLowerCase() ===
        "asc"
        ? 1
        : -1;

    const deposits =
      await Deposit.find(query)
        .sort({
          createdAt: sortDirection,
        })
        .skip(
          (currentPage - 1) *
          perPage
        )
        .limit(perPage);

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      total,

      currentPage,

      totalPages:
        Math.ceil(
          total / perPage
        ),

      deposits,
    });
  } catch (error) {
    console.error(
      "GET MY DEPOSITS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message: "Server Error",

      error: error.message,
    });
  }
};

// =====================================================
// GET MY TURNOVER HISTORY
// =====================================================

const getMyTurnoverHistory = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // DOWNLINE COUNT
    // =====================================================

    const downlineCount =
      await User.countDocuments({
        referral: user.refCode,
      });

    // =====================================================
    // COMMISSIONS
    // =====================================================

    const commissions =
      await TransactionHistory.find({
        userId: userId.toString(),

        type: "Referral Bonus",

        status: 1,
      }).sort({
        createdAt: -1,
      });

    // =====================================================
    // FORMAT
    // =====================================================

    const formattedCommissions =
      commissions.map((c) => {
        const match = c.remark
          ? c.remark.match(
            /from deposit of (.+)/
          )
          : null;

        const referredUsername =
          match
            ? match[1]
            : "Referred User";

        const rechargeAmount =
          Number(
            (
              Number(c.amount || 0) *
              10
            ).toFixed(2)
          );

        return {
          id: c._id,

          amount: c.amount,

          rechargeAmount,

          referredUsername,

          date: c.createdAt
            ? new Date(
              c.createdAt
            ).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )
            : "-",

          createdAt: c.createdAt,
        };
      });

    // =====================================================
    // DATE RANGE
    // =====================================================

    const now = new Date();

    const oneWeekAgo =
      new Date();

    oneWeekAgo.setDate(
      now.getDate() - 7
    );

    const oneMonthAgo =
      new Date();

    oneMonthAgo.setDate(
      now.getDate() - 30
    );

    // =====================================================
    // COMMISSION CALCULATION
    // =====================================================

    let weeklyCommission = 0;
    let monthlyCommission = 0;
    let totalCommission = 0;

    formattedCommissions.forEach(
      (c) => {
        const amount =
          Number(c.amount || 0);

        totalCommission += amount;

        const cDate =
          new Date(
            c.createdAt
          );

        if (
          cDate >= oneWeekAgo
        ) {
          weeklyCommission +=
            amount;
        }

        if (
          cDate >= oneMonthAgo
        ) {
          monthlyCommission +=
            amount;
        }
      }
    );

    // =====================================================
    // ROUND
    // =====================================================

    totalCommission =
      Number(
        totalCommission.toFixed(2)
      );

    weeklyCommission =
      Number(
        weeklyCommission.toFixed(2)
      );

    monthlyCommission =
      Number(
        monthlyCommission.toFixed(2)
      );

    // =====================================================
    // TURNOVER
    // =====================================================

    const totalTurnover =
      Number(
        (
          totalCommission * 10
        ).toFixed(2)
      );

    const weeklyTurnover =
      Number(
        (
          weeklyCommission * 10
        ).toFixed(2)
      );

    const monthlyTurnover =
      Number(
        (
          monthlyCommission * 10
        ).toFixed(2)
      );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      downlineCount,

      stats: {
        totalCommission,

        weeklyCommission,

        monthlyCommission,

        totalTurnover,

        weeklyTurnover,

        monthlyTurnover,
      },

      commissions:
        formattedCommissions,
    });
  } catch (error) {
    console.error(
      "GET TURNOVER HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message: "Server Error",

      error: error.message,
    });
  }
};


// =====================================================
// ADMIN: GET ALL DEPOSITS
// =====================================================

const getAllDepositsForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      channel,
      phone,
      username,
      uid,
      orderId,
      transactionId,
      utr,

      fromDate,
      toDate,

      minAmount,
      maxAmount,

      page = 1,
      limit = 20,

      sort = "desc",
    } = req.query;

    // =====================================================
    // BUILD QUERY
    // =====================================================

    const query = {};

    // =====================================================
    // STATUS
    // 0 = Pending
    // 1 = Success
    // 2 = Failed
    // =====================================================

    if (status !== undefined && status !== "") {
      query.status = Number(status);
    }

    // =====================================================
    // PAYMENT METHOD
    // =====================================================

    if (paymentMethod && paymentMethod.trim()) {
      query.paymentMethod = {
        $regex: paymentMethod.trim(),
        $options: "i",
      };
    }

    // =====================================================
    // CHANNEL
    // =====================================================

    if (channel && channel.trim()) {
      query.channel = {
        $regex: channel.trim(),
        $options: "i",
      };
    }

    // =====================================================
    // PHONE
    // =====================================================

    if (phone && phone.trim()) {
      query.phone = {
        $regex: phone.trim(),
        $options: "i",
      };
    }

    // =====================================================
    // USERNAME
    // =====================================================

    if (username && username.trim()) {
      query.username = {
        $regex: username.trim(),
        $options: "i",
      };
    }

    // =====================================================
    // UID
    // =====================================================

    if (uid && uid.trim()) {
      query.uid = {
        $regex: uid.trim(),
        $options: "i",
      };
    }

    // =====================================================
    // ORDER ID
    // =====================================================

    if (orderId && orderId.trim()) {
      query.orderId = {
        $regex: orderId.trim(),
        $options: "i",
      };
    }

    // =====================================================
    // TRANSACTION ID
    // =====================================================

    if (transactionId && transactionId.trim()) {
      query.transactionId = {
        $regex: transactionId.trim(),
        $options: "i",
      };
    }

    // =====================================================
    // UTR
    // =====================================================

    if (utr && utr.trim()) {
      query.utr = {
        $regex: utr.trim(),
        $options: "i",
      };
    }

    // =====================================================
    // AMOUNT FILTER
    // =====================================================

    if (
      minAmount !== undefined ||
      maxAmount !== undefined
    ) {
      query.amount = {};

      if (
        minAmount !== undefined &&
        minAmount !== ""
      ) {
        const min = Number(minAmount);

        if (Number.isFinite(min)) {
          query.amount.$gte = min;
        }
      }

      if (
        maxAmount !== undefined &&
        maxAmount !== ""
      ) {
        const max = Number(maxAmount);

        if (Number.isFinite(max)) {
          query.amount.$lte = max;
        }
      }

      // Agar amount object empty hai to remove kar do
      if (Object.keys(query.amount).length === 0) {
        delete query.amount;
      }
    }

    // =====================================================
    // DATE FILTER
    // =====================================================

    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) {
        const startDate = new Date(fromDate);

        if (!isNaN(startDate.getTime())) {
          startDate.setHours(0, 0, 0, 0);
          query.createdAt.$gte = startDate;
        }
      }

      if (toDate) {
        const endDate = new Date(toDate);

        if (!isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endDate;
        }
      }

      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }

    // =====================================================
    // PAGINATION
    // =====================================================

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const perPage = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip = (currentPage - 1) * perPage;

    // =====================================================
    // SORT
    // =====================================================

    const sortDirection =
      String(sort).toLowerCase() === "asc"
        ? 1
        : -1;

    // =====================================================
    // TOTAL COUNT
    // =====================================================

    const total = await Deposit.countDocuments(query);

    // =====================================================
    // GET DEPOSITS
    // =====================================================

    const deposits = await Deposit.find(query)
      .sort({
        createdAt: sortDirection,
      })
      .skip(skip)
      .limit(perPage)
      .lean();

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message: "All deposits fetched successfully",

      total,

      currentPage,

      perPage,

      totalPages: Math.ceil(
        total / perPage
      ),

      deposits,
    });

  } catch (error) {
    console.error(
      "GET ALL DEPOSITS FOR ADMIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createDeposit,
  onlinePayCallback,
  getMyDeposits,
  getMyTurnoverHistory,
  getAllDepositsForAdmin
};