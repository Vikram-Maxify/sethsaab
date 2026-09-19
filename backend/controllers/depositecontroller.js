const axios = require("axios");

const Deposit = require("../models/Deposit.js");
const User = require("../models/userModel");
const TransactionHistory = require("../models/TransactionHistory");
const AdminGateway = require("../models/AdminGateway");
const LotteryConfig = require("../models/LotteryConfig");

// =====================================================
// CREATE / FIND LOTTERY ENTRY
// =====================================================

const createOrGetLotteryEntry = async ({
  user,
  configId,
  number,
  amount,
  entryId,
}) => {
  if (!configId || !number) {
    return {
      config: null,
      entry: null,
    };
  }

  if (!/^\d{6}$/.test(String(number))) {
    throw new Error("Lottery number must be exactly 6 digits");
  }

  const config = await LotteryConfig.findById(configId);

  if (!config) {
    throw new Error("Lottery configuration not found");
  }

  if (!config.isActive) {
    throw new Error("Lottery is not active");
  }

  // ===================================================
  // IF ENTRY ID WAS ALREADY PROVIDED
  // ===================================================

  if (entryId) {
    const existingEntry = config.users.id(entryId);

    if (existingEntry) {
      // Security check
      if (String(existingEntry.userId) !== String(user._id)) {
        throw new Error("This lottery entry does not belong to you");
      }

      // Make sure number is same
      if (existingEntry.number !== String(number)) {
        throw new Error("Lottery entry number mismatch");
      }

      return {
        config,
        entry: existingEntry,
      };
    }
  }

  // ===================================================
  // FIND EXISTING PENDING ENTRY
  // ===================================================

  const today = new Date();

  const entryDate = today.toISOString().slice(0, 10);

  let existingEntry = config.users.find(
    (item) =>
      String(item.userId) === String(user._id) &&
      item.number === String(number) &&
      item.isBuy === false &&
      item.status === "pending"
  );

  if (existingEntry) {
    existingEntry.amount = Number(amount);

    return {
      config,
      entry: existingEntry,
    };
  }

  // ===================================================
  // CREATE NEW PENDING ENTRY
  // ===================================================

  config.users.push({
    userId: String(user._id),
    entryDate,
    number: String(number),
    amount: Number(amount),
    isBuy: false,
    prize: {
      first: 0,
      second: 0,
      third: 0,
    },
    prizeType: null,
    status: "pending",
  });

  existingEntry = config.users[config.users.length - 1];

  await config.save();

  return {
    config,
    entry: existingEntry,
  };
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

    // ===================================================
    // VALIDATE AMOUNT
    // ===================================================

    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // ===================================================
    // FIND USER
    // ===================================================

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let finalPaymentMethod = paymentMethod;
    let finalChannel = channel;
    let resolvedGatewayId = null;

    const usdRet = 92;
    let money = 0;

    // ===================================================
    // LOTTERY ENTRY
    // ===================================================

    let lotteryConfig = null;
    let lotteryEntry = null;

    if (configId) {
      try {
        const lotteryResult = await createOrGetLotteryEntry({
          user,
          configId,
          number,
          amount: numericAmount,
          entryId,
        });

        lotteryConfig = lotteryResult.config;
        lotteryEntry = lotteryResult.entry;
      } catch (lotteryError) {
        return res.status(400).json({
          success: false,
          message: lotteryError.message,
        });
      }
    }

    // ===================================================
    // GATEWAY SELECTED
    // ===================================================

    if (gatewayId) {
      const gateway = await AdminGateway.findById(gatewayId);

      if (!gateway) {
        return res.status(404).json({
          success: false,
          message: "Payment gateway not found",
        });
      }

      if (Number(gateway.status) !== 1) {
        return res.status(400).json({
          success: false,
          message:
            "Selected payment gateway is currently disabled/inactive",
        });
      }

      const gatewayMin = Number(gateway.minLimit || 0);

      const gatewayMax = Number(
        gateway.maxLimit || Number.MAX_SAFE_INTEGER
      );

      if (
        numericAmount < gatewayMin ||
        numericAmount > gatewayMax
      ) {
        return res.status(400).json({
          success: false,
          message: `Deposit amount must be between ${gatewayMin} and ${gatewayMax} for this gateway.`,
        });
      }

      resolvedGatewayId = gateway._id;

      finalChannel = gateway.name;

      // =================================================
      // AUTOMATIC GATEWAY
      // =================================================

      if (
        String(gateway.mode || "").toLowerCase() ===
        "automatic"
      ) {
        finalPaymentMethod = "INR";
        money = numericAmount;

        const orderId = `DEP${Date.now()}${Math.floor(
          Math.random() * 1000
        )}`;

        const deposit = await Deposit.create({
          userId: user._id,

          gatewayId: resolvedGatewayId,

          // =============================================
          // LOTTERY LINK
          // =============================================

          configId: lotteryConfig?._id || null,

          entryId: lotteryEntry?._id || null,

          number:
            lotteryEntry?.number ||
            number ||
            null,

          uid: user.uuid || "",

          phone: user.mobile,

          orderId,

          paymentMethod: finalPaymentMethod,

          type: paymentMethod || "Lottery Ticket",

          channel: finalChannel,

          amount: money,

          exchangeRate: 0,

          transactionId: orderId,

          utr: utr || "",

          status: 0,
        });

        // =================================================
        // CALLBACK URL
        // =================================================

        const callbackUrl =
          process.env.GATEWAY_CALLBACK_URL ||
          `${req.protocol}://${req.get(
            "host"
          )}/api/deposit/callback`;

        // =================================================
        // GATEWAY URL
        // =================================================

        const gatewayBaseUrl =
          gateway.gatewayUrl ||
          "https://mch.voterx.xyz";

        // =================================================
        // GATEWAY PAYLOAD
        // =================================================

        const payload = {
          amount: Math.round(numericAmount),

          order_id: orderId,

          customer_name:
            user.username ||
            user.name ||
            user.mobile,

          description: lotteryEntry
            ? `Lottery Ticket - ${lotteryEntry.number}`
            : `Automatic deposit via ${gateway.name}`,

          callback_url: callbackUrl,
        };

        try {
          const { data: gatewayResponse } =
            await axios.post(
              `${gatewayBaseUrl}/api/create-order`,
              payload,
              {
                headers: {
                  "Content-Type":
                    "application/json",

                  "X-API-Key":
                    gateway.apiKey ||
                    process.env.VOTERX_API_KEY ||
                    "",

                  "X-API-Secret":
                    gateway.secretKey ||
                    process.env.VOTERX_API_SECRET ||
                    "",
                },

                timeout: 30000,
              }
            );

          // =================================================
          // PAYMENT URL SUCCESS
          // =================================================

          if (
            gatewayResponse?.status ===
              "success" &&
            gatewayResponse?.data?.payment_url
          ) {
            deposit.paymentUrl =
              gatewayResponse.data.payment_url;

            if (
              gatewayResponse.data.order_id
            ) {
              deposit.orderId = String(
                gatewayResponse.data.order_id
              );
            }

            await deposit.save();

            // ===============================================
            // TRANSACTION HISTORY
            // ===============================================

            await TransactionHistory.create({
              orderId: deposit.orderId,

              userId: String(user._id),

              uid: user.uuid || "",

              phone: user.mobile,

              type: "Lottery Ticket",

              amount: money,

              status: 0,

              remark: lotteryEntry
                ? `Lottery ticket payment initiated for number ${lotteryEntry.number}`
                : `Pending automatic deposit initiated via ${finalChannel}`,
            });

            return res.status(201).json({
              success: true,

              message:
                "Automatic payment order created successfully.",

              paymentUrl:
                gatewayResponse.data.payment_url,

              depositId: deposit._id,

              orderId: deposit.orderId,

              configId:
                deposit.configId,

              entryId:
                deposit.entryId,

              number:
                deposit.number,

              gatewayResponse,
            });
          }

          // =================================================
          // GATEWAY RESPONSE FAILED
          // =================================================

          deposit.status = 2;

          await deposit.save();

          return res.status(400).json({
            success: false,

            message:
              gatewayResponse?.error ||
              gatewayResponse?.message ||
              "Failed to create payment order on gateway",
          });
        } catch (gatewayErr) {
          deposit.status = 2;

          await deposit.save();

          console.error(
            "Gateway Create-Order Error:",
            gatewayErr.response?.data ||
              gatewayErr.message
          );

          return res.status(502).json({
            success: false,

            message:
              "Payment gateway request failed. Please try again.",
          });
        }
      }

      // =================================================
      // MANUAL GATEWAY
      // =================================================

      if (
        String(gateway.type || "").toLowerCase() ===
        "crypto"
      ) {
        finalPaymentMethod = "USDT";

        money =
          numericAmount * usdRet;
      } else {
        finalPaymentMethod = "INR";

        money = numericAmount;
      }
    } else {
      // =================================================
      // OLD FRONTEND FALLBACK
      // =================================================

      if (!paymentMethod || !channel) {
        return res.status(400).json({
          success: false,

          message:
            "gatewayId (or paymentMethod and channel) is required",
        });
      }

      finalPaymentMethod =
        paymentMethod;

      finalChannel = channel;

      money =
        finalPaymentMethod === "INR"
          ? numericAmount
          : numericAmount * usdRet;
    }

    // ===================================================
    // MANUAL DEPOSIT
    // ===================================================

    const orderId = `DEP${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;

    let imageUrl = "";

    if (
      req.files &&
      req.files.image &&
      req.files.image[0]
    ) {
      imageUrl =
        req.files.image[0].path || "";
    }

    const deposit = await Deposit.create({
      userId: user._id,

      gatewayId: resolvedGatewayId,

      // =============================================
      // LOTTERY LINK
      // =============================================

      configId:
        lotteryConfig?._id || null,

      entryId:
        lotteryEntry?._id || null,

      number:
        lotteryEntry?.number ||
        number ||
        null,

      uid: user.uuid || "",

      phone: user.mobile,

      username:
        user.username ||
        user.name ||
        "",

      orderId,

      paymentMethod:
        finalPaymentMethod,

      type:
        paymentMethod ||
        "Lottery Ticket",

      channel:
        finalChannel,

      amount: money,

      exchangeRate:
        finalPaymentMethod === "USDT"
          ? usdRet
          : 0,

      transactionId: orderId,

      utr: utr || "",

      paymentProof: imageUrl,

      status: 0,
    });

    await TransactionHistory.create({
      orderId,

      userId: String(user._id),

      uid: user.uuid || "",

      phone: user.mobile,

      type: "Lottery Ticket",

      amount: money,

      status: 0,

      remark: lotteryEntry
        ? `Lottery ticket payment submitted for number ${lotteryEntry.number}`
        : `Deposit request submitted via ${finalChannel}`,
    });

    return res.status(201).json({
      success: true,

      message:
        "Deposit request submitted successfully.",

      deposit,
    });
  } catch (error) {
    console.error(
      "CREATE DEPOSIT ERROR:",
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
// ONLINE PAYMENT CALLBACK
// =====================================================
// PAYMENT SUCCESS => isBuy = true
// PAYMENT FAILED  => isBuy remains false
// =====================================================

const onlinePayCallback = async (req, res) => {
  console.log(
    "=========================================="
  );

  console.log(
    "VOTERX CALLBACK RECEIVED"
  );

  console.log(
    "QUERY:",
    req.query
  );

  console.log(
    "BODY:",
    req.body
  );

  console.log(
    "=========================================="
  );

  try {
    // ===================================================
    // GET ORDER ID
    // ===================================================

    const resolvedOrderId =
      req.query?.order_id ||
      req.body?.order_id ||
      req.body?.data?.order_id;

    if (!resolvedOrderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID missing",
      });
    }

    // ===================================================
    // FIND DEPOSIT
    // ===================================================

    const deposit =
      await Deposit.findOne({
        orderId: String(resolvedOrderId),
      });

    if (!deposit) {
      console.error(
        "Deposit not found:",
        resolvedOrderId
      );

      return res.status(404).json({
        success: false,
        message: "Deposit record not found",
      });
    }

    // ===================================================
    // ALREADY SUCCESS
    // ===================================================

    if (Number(deposit.status) === 1) {
      return res.status(200).json({
        success: true,
        message:
          "Payment already processed",
        isBuy: true,
      });
    }

    // ===================================================
    // FIND GATEWAY
    // ===================================================

    const gateway =
      await AdminGateway.findById(
        deposit.gatewayId
      );

    if (!gateway) {
      return res.status(404).json({
        success: false,
        message:
          "Associated payment gateway not found",
      });
    }

    // ===================================================
    // GATEWAY URL
    // ===================================================

    const gatewayBaseUrl =
      gateway.gatewayUrl ||
      "https://mch.voterx.xyz";

    // ===================================================
    // CHECK PAYMENT STATUS
    // ===================================================

    let verificationData;

    try {
      const response =
        await axios.post(
          `${gatewayBaseUrl}/api/check-status`,
          {
            order_id:
              String(resolvedOrderId),
          },
          {
            headers: {
              "Content-Type":
                "application/json",

              "X-API-Key":
                gateway.apiKey ||
                process.env.VOTERX_API_KEY ||
                "",

              "X-API-Secret":
                gateway.secretKey ||
                process.env.VOTERX_API_SECRET ||
                "",
            },

            timeout: 30000,
          }
        );

      verificationData =
        response.data;
    } catch (verifyError) {
      console.error(
        "VOTERX STATUS API ERROR:",
        verifyError.response?.data ||
          verifyError.message
      );

      return res.status(502).json({
        success: false,

        message:
          "Unable to verify payment with gateway",
      });
    }

    console.log(
      "VOTERX VERIFICATION:",
      verificationData
    );

    // ===================================================
    // CHECK PAYMENT SUCCESS
    // ===================================================

    const paymentIsSuccessful =
      verificationData?.status ===
        "success" &&
      verificationData?.payment_status ===
        "success";

    // ===================================================
    // PAYMENT FAILED
    // ===================================================

    if (!paymentIsSuccessful) {
      deposit.status = 2;

      await deposit.save();

      // -----------------------------------------------
      // DO NOT SET isBuy TRUE
      // -----------------------------------------------

      await TransactionHistory.create({
        orderId:
          String(resolvedOrderId),

        userId:
          String(deposit.userId),

        uid:
          deposit.uid || "",

        phone:
          deposit.phone,

        type: "Lottery Ticket",

        amount:
          Number(deposit.amount || 0),

        status: 2,

        remark:
          "Lottery payment verification failed. Lottery ticket is not purchased.",
      });

      return res.status(400).json({
        success: false,

        message:
          "Payment verification failed",

        isBuy: false,
      });
    }

    // ===================================================
    // FIND USER
    // ===================================================

    const user =
      await User.findById(
        deposit.userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,

        message:
          "User associated with deposit not found",
      });
    }

    // ===================================================
    // PAYMENT AMOUNT
    // ===================================================

    const creditAmount = Number(
      verificationData?.data?.amount ||
        deposit.amount ||
        0
    );

    // ===================================================
    // LOTTERY CONFIG
    // ===================================================

    let lotteryUpdated = false;

    if (
      deposit.configId &&
      deposit.entryId
    ) {
      try {
        const config =
          await LotteryConfig.findById(
            deposit.configId
          );

        if (!config) {
          console.error(
            "LotteryConfig not found:",
            deposit.configId
          );
        } else {
          const entry =
            config.users.id(
              deposit.entryId
            );

          if (!entry) {
            console.error(
              "Lottery entry not found:",
              deposit.entryId
            );
          } else {
            // =========================================
            // SECURITY CHECK
            // =========================================

            if (
              String(entry.userId) !==
              String(user._id)
            ) {
              console.error(
                "Lottery entry user mismatch"
              );
            } else {
              // =======================================
              // PAYMENT SUCCESS
              // isBuy = TRUE
              // =======================================

              entry.isBuy = true;

              // Keep status pending until result declaration
              entry.status = "pending";

              await config.save();

              lotteryUpdated = true;

              console.log(
                "=========================================="
              );

              console.log(
                "LOTTERY PURCHASE SUCCESS"
              );

              console.log(
                "User:",
                user._id
              );

              console.log(
                "Config:",
                config._id
              );

              console.log(
                "Entry:",
                entry._id
              );

              console.log(
                "Number:",
                entry.number
              );

              console.log(
                "isBuy:",
                entry.isBuy
              );

              console.log(
                "=========================================="
              );
            }
          }
        }
      } catch (lotteryError) {
        console.error(
          "LOTTERY isBuy UPDATE ERROR:",
          lotteryError
        );

        // Payment is already successful.
        // Do not change deposit to failed.
      }
    } else {
      console.error(
        "Lottery information missing in deposit:",
        {
          depositId: deposit._id,
          configId: deposit.configId,
          entryId: deposit.entryId,
          number: deposit.number,
        }
      );
    }

    // ===================================================
    // UPDATE DEPOSIT
    // ===================================================

    deposit.status = 1;

    deposit.utr =
      verificationData?.data?.utr ||
      deposit.utr ||
      "";

    deposit.transactionId =
      verificationData?.data
        ?.gateway_txn_id ||
      deposit.transactionId ||
      "";

    await deposit.save();

    // ===================================================
    // SUCCESS TRANSACTION HISTORY
    // ===================================================

    await TransactionHistory.create({
      orderId:
        String(resolvedOrderId),

      userId:
        String(user._id),

      uid:
        user.uuid || "",

      phone:
        user.mobile,

      type: "Lottery Ticket",

      amount: creditAmount,

      status: 1,

      remark: lotteryUpdated
        ? `Lottery ticket purchase successful via ${gateway.name}. isBuy=true`
        : `Payment successful via ${gateway.name}, but lottery entry could not be updated.`,
    });

    // ===================================================
    // FINAL SUCCESS RESPONSE
    // ===================================================

    return res.status(200).json({
      success: true,

      message:
        lotteryUpdated
          ? "Payment successful. Lottery ticket purchased successfully."
          : "Payment successful, but lottery entry update failed.",

      isBuy: lotteryUpdated,

      depositId:
        deposit._id,

      configId:
        deposit.configId,

      entryId:
        deposit.entryId,

      number:
        deposit.number,
    });
  } catch (error) {
    console.error(
      "GATEWAY CALLBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Callback failed",

      error:
        error.message,
    });
  }
};

// =====================================================
// GET MY DEPOSITS
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

    const query = {
      userId: req.user.id,
    };

    if (status !== undefined) {
      query.status = Number(status);
    }

    if (paymentMethod) {
      query.paymentMethod =
        paymentMethod;
    }

    if (channel) {
      query.channel = channel;
    }

    if (phone) {
      query.phone = {
        $regex: phone,
        $options: "i",
      };
    }

    if (username) {
      query.username = {
        $regex: username,
        $options: "i",
      };
    }

    if (orderId) {
      query.orderId = {
        $regex: orderId,
        $options: "i",
      };
    }

    if (transactionId) {
      query.transactionId = {
        $regex: transactionId,
        $options: "i",
      };
    }

    if (utr) {
      query.utr = {
        $regex: utr,
        $options: "i",
      };
    }

    if (minAmount || maxAmount) {
      query.amount = {};

      if (minAmount) {
        query.amount.$gte =
          Number(minAmount);
      }

      if (maxAmount) {
        query.amount.$lte =
          Number(maxAmount);
      }
    }

    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) {
        query.createdAt.$gte =
          new Date(fromDate);
      }

      if (toDate) {
        const endDate =
          new Date(toDate);

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

    const pageNumber =
      Math.max(Number(page) || 1, 1);

    const limitNumber =
      Math.max(Number(limit) || 10, 1);

    const total =
      await Deposit.countDocuments(
        query
      );

    const deposits =
      await Deposit.find(query)
        .sort({
          createdAt:
            sort === "asc" ? 1 : -1,
        })
        .skip(
          (pageNumber - 1) *
            limitNumber
        )
        .limit(limitNumber);

    return res.status(200).json({
      success: true,

      total,

      currentPage:
        pageNumber,

      totalPages:
        Math.ceil(
          total / limitNumber
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

      error:
        error.message,
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
    const userId = req.user.id;

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const downlineCount =
      await User.countDocuments({
        referral: user.refCode,
      });

    const commissions =
      await TransactionHistory.find({
        userId: String(userId),
        type: "Referral Bonus",
        status: 1,
      }).sort({
        createdAt: -1,
      });

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
            (Number(c.amount || 0) * 10).toFixed(
              2
            )
          );

        return {
          id: c._id,

          amount:
            Number(c.amount || 0),

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

          createdAt:
            c.createdAt,
        };
      });

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

    let weeklyCommission = 0;
    let monthlyCommission = 0;
    let totalCommission = 0;

    formattedCommissions.forEach(
      (c) => {
        const amount =
          Number(c.amount || 0);

        totalCommission += amount;

        const cDate =
          new Date(c.createdAt);

        if (cDate >= oneWeekAgo) {
          weeklyCommission +=
            amount;
        }

        if (cDate >= oneMonthAgo) {
          monthlyCommission +=
            amount;
        }
      }
    );

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

      error:
        error.message,
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
};