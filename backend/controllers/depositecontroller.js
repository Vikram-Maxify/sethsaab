const axios = require("axios");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Deposit = require("../models/Deposit.js");
const User = require("../models/userModel");
const TransactionHistory = require("../models/TransactionHistory");

// =====================================================
// STATUS CONSTANTS
// =====================================================
// 0 = PENDING
// 1 = SUCCESS
// 2 = FAILED
// 3 = CANCELLED
// =====================================================

const STATUS = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
  CANCELLED: 3,
};

// =====================================================
// QWACKPAY CONFIG
// =====================================================

const QWACKPAY_BASE_URL =
  process.env.QWACKPAY_BASE_URL || "https://qwackpay.com/api/v1";

const QWACKPAY_MERCHANT_ID =
  process.env.QWACKPAY_MERCHANT_ID || "636055076";

const QWACKPAY_API_KEY =
  process.env.QWACKPAY_API_KEY || "DASHBOARD_SE_COPY_KARO";

// =====================================================
// HELPER: QWACKPAY SIGN GENERATION
// =====================================================

const generateQwackPaySign = (params, apiKey) => {
  const clean = { ...params };

  delete clean.sign;

  const filtered = {};

  Object.keys(clean).forEach((key) => {
    const val = clean[key];

    if (val !== null && val !== undefined && val !== "") {
      filtered[key] = val;
    }
  });

  const sortedKeys = Object.keys(filtered).sort();

  const queryString = sortedKeys
    .map((key) => `${key}=${filtered[key]}`)
    .join("&");

  const signString = `${queryString}&key=${apiKey}`;

  return crypto
    .createHash("md5")
    .update(signString)
    .digest("hex")
    .toUpperCase();
};

// =====================================================
// HELPER: HEADERS
// =====================================================

const getQwackPayHeaders = () => ({
  "Content-Type": "application/json",
  "X-API-Key": QWACKPAY_API_KEY,
});

// =====================================================
// FRONTEND URL
// =====================================================

const getFrontendUrl = () => {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
};

// =====================================================
// QWACKPAY RETURN URL
// =====================================================

const getQwackPayReturnUrl = () => {
  return (
    process.env.QWACKPAY_RETURN_URL ||
    `${getFrontendUrl()}/payment-success`
  ).replace(/\/$/, "");
};

// =====================================================
// CREATE DEPOSIT
// =====================================================

const createDeposit = async (req, res) => {
  try {
    const {
      paymentMethod,
      channel,
      amount,
      utr,
    } = req.body;

    // =================================================
    // AMOUNT VALIDATION
    // =================================================

    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // =================================================
    // USER
    // =================================================

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

    // =================================================
    // NORMALIZE CHANNEL
    // =================================================

    const normalizedChannel = String(channel || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, "");

    // =====================================================
    // QWACKPAY FLOW
    // =====================================================

    if (normalizedChannel === "qwackpay") {
      const finalPaymentMethod = "INR";
      const finalChannel = "qwackpay";
      const money = numericAmount;

      const orderId = `DEP${Date.now()}`;

      // =================================================
      // CREATE PENDING DEPOSIT
      // =================================================

      const deposit = await Deposit.create({
        userId: user._id,
        gatewayId: null,
        uid: user.uuid,
        phone: user.mobile,
        username: user.username,

        orderId,

        paymentMethod: finalPaymentMethod,
        type: finalPaymentMethod,
        channel: finalChannel,

        amount: money,
        exchangeRate: 0,

        transactionId: orderId,

        utr: "",
        paymentProof: "",
        paymentUrl: "",

        status: STATUS.PENDING,
      });

      // =================================================
      // CUSTOMER EMAIL
      // =================================================

      const existingEmail = String(user.email || "").trim();

      const customerEmail =
        existingEmail ||
        `customer${String(user._id)}@setthelife.com`;

      // =================================================
      // QWACKPAY ORDER
      // =================================================

      const orderPayload = {
        merchant_id: QWACKPAY_MERCHANT_ID,

        amount: Math.round(numericAmount),

        order_id: orderId,

        customer_phone: String(
          user.mobile || ""
        ).trim(),

        customer_email: customerEmail,

        return_url: getQwackPayReturnUrl(),
      };

      // =================================================
      // SIGN
      // =================================================

      orderPayload.sign = generateQwackPaySign(
        orderPayload,
        QWACKPAY_API_KEY
      );

      try {
        const { data: gatewayResponse } =
          await axios.post(
            `${QWACKPAY_BASE_URL}/order/create`,
            orderPayload,
            {
              headers: getQwackPayHeaders(),
              timeout: 30000,
            }
          );

        console.log(
          "QWACKPAY CREATE RESPONSE:",
          gatewayResponse
        );

        // =================================================
        // PAYMENT URL
        // =================================================

        const paymentUrl =
          gatewayResponse?.data?.payment_url ||
          gatewayResponse?.data?.paymentUrl ||
          gatewayResponse?.payment_url ||
          gatewayResponse?.paymentUrl ||
          "";

        // =================================================
        // RETURNED ORDER ID
        // =================================================

        const returnedOrderId =
          gatewayResponse?.data?.merchant_order_id ||
          gatewayResponse?.data?.order_id ||
          gatewayResponse?.merchant_order_id ||
          gatewayResponse?.order_id ||
          orderId;

        // =================================================
        // QWACK ORDER ID
        // =================================================

        const qwackOrderId =
          gatewayResponse?.data?.qwack_order_id ||
          gatewayResponse?.qwack_order_id ||
          "";

        // =================================================
        // SUCCESSFUL ORDER CREATION
        // =================================================

        if (
          Number(gatewayResponse?.code) === 200 &&
          paymentUrl
        ) {
          deposit.paymentUrl = String(paymentUrl);

          deposit.orderId = String(
            returnedOrderId
          );

          deposit.transactionId = String(
            qwackOrderId || returnedOrderId
          );

          // IMPORTANT:
          // Payment abhi gateway par pending hai.
          deposit.status = STATUS.PENDING;

          await deposit.save();

          // =================================================
          // CREATE TRANSACTION HISTORY
          // =================================================

          await TransactionHistory.create({
            orderId: deposit.orderId,

            userId: user._id,

            uid: user.uuid,

            phone: user.mobile,

            type: "Deposit",

            amount: money,

            status: STATUS.PENDING,

            remark: "Pending QwackPay recharge",
          });

          return res.status(201).json({
            success: true,

            message:
              "QwackPay recharge order created successfully.",

            paymentUrl: String(paymentUrl),

            successUrl: getQwackPayReturnUrl(),

            orderId: deposit.orderId,

            depositId: deposit._id,

            amount: money,

            status: "pending",

            deposit,

            gatewayResponse,
          });
        }

        // =================================================
        // GATEWAY FAILED
        // =================================================

        deposit.status = STATUS.FAILED;

        await deposit.save();

        return res.status(400).json({
          success: false,

          message:
            gatewayResponse?.error ||
            gatewayResponse?.message ||
            gatewayResponse?.data?.message ||
            "QwackPay payment URL not received",

          paymentUrl: "",

          orderId: deposit.orderId,

          gatewayResponse,
        });
      } catch (gatewayErr) {
        console.error(
          "QWACKPAY CREATE ERROR:",
          gatewayErr.response?.data ||
            gatewayErr.message
        );

        deposit.status = STATUS.FAILED;

        await deposit.save();

        return res.status(502).json({
          success: false,

          message:
            "QwackPay payment request failed.",

          paymentUrl: "",

          orderId: deposit.orderId,

          error:
            gatewayErr.response?.data ||
            gatewayErr.message,
        });
      }
    }

    // =====================================================
    // MANUAL FLOW
    // =====================================================

    if (!paymentMethod || !channel) {
      return res.status(400).json({
        success: false,
        message:
          "paymentMethod and channel are required",
      });
    }

    const usdRet = 92;

    const finalPaymentMethod = paymentMethod;
    const finalChannel = channel;

    let money =
      String(finalPaymentMethod).toUpperCase() ===
      "INR"
        ? numericAmount
        : numericAmount * usdRet;

    const orderId = `DEP${Date.now()}`;

    let imageUrl = "";

    if (
      req.files &&
      req.files.image &&
      req.files.image[0]
    ) {
      imageUrl = req.files.image[0].path;
    }

    const deposit = await Deposit.create({
      userId: user._id,

      gatewayId: null,

      uid: user.uuid,

      phone: user.mobile,

      username: user.username,

      orderId,

      paymentMethod: finalPaymentMethod,

      type:
        paymentMethod ||
        finalPaymentMethod,

      channel: finalChannel,

      amount: money,

      exchangeRate:
        String(finalPaymentMethod).toUpperCase() ===
        "USDT"
          ? usdRet
          : 0,

      transactionId: orderId,

      utr: utr || "",

      paymentProof: imageUrl,

      paymentUrl: "",

      status: STATUS.PENDING,
    });

    await TransactionHistory.create({
      orderId,

      userId: user._id,

      uid: user.uuid,

      phone: user.mobile,

      type: "Deposit",

      amount: money,

      status: STATUS.PENDING,

      remark:
        `Recharge request submitted via ${finalChannel}`,
    });

    return res.status(201).json({
      success: true,

      message:
        "Recharge request submitted successfully.",

      paymentUrl: "",

      orderId,

      depositId: deposit._id,

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
// CANCEL DEPOSIT
// =====================================================

const cancelDeposit = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id;

    const { depositId } = req.params;

    const {
      reason = "User cancelled at gateway",
    } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const query =
      mongoose.Types.ObjectId.isValid(
        depositId
      )
        ? {
            _id: depositId,
            userId,
          }
        : {
            orderId: String(depositId),
            userId,
          };

    const deposit =
      await Deposit.findOne(query);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    // Already success
    if (
      Number(deposit.status) ===
      STATUS.SUCCESS
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Deposit already successful, cannot cancel",

        status: deposit.status,
      });
    }

    // Already cancelled
    if (
      Number(deposit.status) ===
      STATUS.CANCELLED
    ) {
      return res.status(200).json({
        success: true,

        message:
          "Deposit already cancelled",

        depositId: deposit._id,

        orderId: deposit.orderId,

        status: STATUS.CANCELLED,

        cancelledAt:
          deposit.cancelledAt,
      });
    }

    // =================================================
    // CANCEL
    // =================================================

    deposit.status =
      STATUS.CANCELLED;

    deposit.cancelReason =
      String(reason);

    deposit.cancelledAt =
      new Date();

    deposit.cancelledBy = "USER";

    await deposit.save();

    // =================================================
    // UPDATE TRANSACTION HISTORY
    // =================================================

    try {
      await TransactionHistory.updateOne(
        {
          orderId: deposit.orderId,

          userId: deposit.userId,

          type: "Deposit",

          status: STATUS.PENDING,
        },
        {
          $set: {
            status: STATUS.CANCELLED,

            remark:
              `User cancelled payment. Reason: ${reason}`,

            updatedAt: new Date(),
          },
        }
      );
    } catch (thErr) {
      console.warn(
        "TransactionHistory update failed:",
        thErr.message
      );
    }

    return res.status(200).json({
      success: true,

      message: "Deposit cancelled",

      depositId: deposit._id,

      orderId: deposit.orderId,

      status: STATUS.CANCELLED,

      cancelledAt:
        deposit.cancelledAt,
    });
  } catch (error) {
    console.error(
      "CANCEL DEPOSIT ERROR:",
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
// GET DEPOSIT STATUS
// =====================================================

const getDepositStatusByIdentifier =
  async (req, res) => {
    try {
      const { identifier } =
        req.params;

      const userId =
        req.user?.id ||
        req.user?._id;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message:
            "Deposit identifier is required",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const query =
        mongoose.Types.ObjectId.isValid(
          identifier
        )
          ? {
              _id: identifier,
              userId,
            }
          : {
              orderId: String(identifier),
              userId,
            };

      const deposit =
        await Deposit.findOne(
          query
        ).lean();

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message:
            "Deposit not found",
        });
      }

      return res.status(200).json({
        success: true,

        deposit: {
          _id: deposit._id,

          orderId: deposit.orderId,

          amount: deposit.amount,

          status: deposit.status,

          paymentMethod:
            deposit.paymentMethod,

          channel:
            deposit.channel,

          utr: deposit.utr || "",

          cancelReason:
            deposit.cancelReason || "",

          cancelledAt:
            deposit.cancelledAt || null,

          createdAt:
            deposit.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "GET DEPOSIT STATUS ERROR:",
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
// QWACKPAY WEBHOOK / CALLBACK
// =====================================================

const onlinePayCallback = async (
  req,
  res
) => {
  console.log(
    "================================================="
  );

  console.log(
    "QWACKPAY WEBHOOK RECEIVED:"
  );

  console.log(req.body);

  console.log(
    "================================================="
  );

  try {
    const {
      merchant_order_id,
      qwack_order_id,
      amount,
      status,
      utr,
      sign,
    } = req.body;

    // =================================================
    // ORDER ID
    // =================================================

    if (!merchant_order_id) {
      console.error(
        "QWACKPAY WEBHOOK: ORDER ID MISSING"
      );

      return res
        .status(400)
        .send("order id missing");
    }

    // =================================================
    // VERIFY SIGN
    // =================================================

    const webhookPayload = {
      merchant_order_id,
      qwack_order_id,
      amount,
      status,
      utr,
    };

    const expectedSign =
      generateQwackPaySign(
        webhookPayload,
        QWACKPAY_API_KEY
      );

    if (
      String(expectedSign).toUpperCase() !==
      String(sign || "").toUpperCase()
    ) {
      console.error(
        "QWACKPAY WEBHOOK SIGN MISMATCH"
      );

      console.error(
        "Expected:",
        expectedSign
      );

      console.error(
        "Received:",
        sign
      );

      return res
        .status(400)
        .send("invalid sign");
    }

    // =================================================
    // FIND DEPOSIT
    // =================================================

    const deposit =
      await Deposit.findOne({
        orderId: String(
          merchant_order_id
        ),
      });

    if (!deposit) {
      console.warn(
        `Deposit not found: ${merchant_order_id}`
      );

      // Gateway ko success response dena
      // so that it doesn't retry forever.
      return res.send("success");
    }

    // =================================================
    // ALREADY SUCCESS
    // =================================================

    if (
      Number(deposit.status) ===
      STATUS.SUCCESS
    ) {
      console.log(
        `Webhook already processed: ${merchant_order_id}`
      );

      return res.send("success");
    }

    // =================================================
    // CANCELLED
    // =================================================

    if (
      Number(deposit.status) ===
      STATUS.CANCELLED
    ) {
      console.log(
        `Ignoring webhook for cancelled deposit: ${merchant_order_id}`
      );

      return res.send("success");
    }

    // =================================================
    // NORMALIZE GATEWAY STATUS
    // =================================================

    const webhookStatus =
      String(status || "")
        .trim()
        .toLowerCase();

    const isSuccess =
      webhookStatus === "success" ||
      webhookStatus === "1" ||
      webhookStatus === "paid";

    // =================================================
    // FAILED PAYMENT
    // =================================================

    if (!isSuccess) {
      console.log(
        `QwackPay payment failed: ${merchant_order_id}, status=${status}`
      );

      deposit.status =
        STATUS.FAILED;

      deposit.utr =
        utr || deposit.utr || "";

      deposit.transactionId =
        qwack_order_id ||
        utr ||
        deposit.transactionId;

      await deposit.save();

      // IMPORTANT:
      // Existing pending history ko FAILED karo.
      // New duplicate record mat banao.
      await TransactionHistory.findOneAndUpdate(
        {
          orderId: String(
            deposit.orderId
          ),

          userId: deposit.userId,

          type: "Deposit",

          status: STATUS.PENDING,
        },
        {
          $set: {
            status: STATUS.FAILED,

            amount:
              Number(amount) ||
              Number(deposit.amount) ||
              0,

            remark:
              `QwackPay recharge failed. Status: ${status}`,

            updatedAt: new Date(),
          },
        },
        {
          new: true,
          sort: {
            createdAt: -1,
          },
        }
      );

      return res.send("success");
    }

    // =================================================
    // SUCCESS PAYMENT
    // =================================================

    console.log(
      `QWACKPAY PAYMENT SUCCESS: ${merchant_order_id}`
    );

    // =================================================
    // FIND USER
    // =================================================

    const user =
      await User.findById(
        deposit.userId
      );

    if (!user) {
      console.error(
        `User not found for deposit: ${merchant_order_id}`
      );

      return res.send("success");
    }

    // =================================================
    // ATOMIC CLAIM
    // =================================================
    //
    // VERY IMPORTANT:
    // Only one webhook can claim this payment.
    //
    // If QwackPay sends webhook twice,
    // wallet will be credited only once.
    // =================================================

    const claimed =
      await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,

          status: {
            $ne: STATUS.SUCCESS,
          },
        },
        {
          $set: {
            status: STATUS.SUCCESS,

            utr:
              utr ||
              deposit.utr ||
              "",

            transactionId:
              qwack_order_id ||
              utr ||
              deposit.transactionId,
          },
        },
        {
          new: true,
        }
      );

    // =================================================
    // ALREADY CLAIMED
    // =================================================

    if (!claimed) {
      console.log(
        `Webhook already claimed: ${merchant_order_id}`
      );

      return res.send("success");
    }

    // =================================================
    // CREDIT AMOUNT
    // =================================================

    const creditAmount =
      Number(amount) ||
      Number(deposit.amount) ||
      0;

    // =================================================
    // WALLET CREDIT
    // =================================================

    if (creditAmount > 0) {
      await User.findByIdAndUpdate(
        user._id,

        {
          $inc: {
            wallet: creditAmount,
          },
        },

        {
          new: true,
        }
      );

      console.log(
        `WALLET CREDITED: ₹${creditAmount} to user ${user._id} (${user.mobile})`
      );
    }

    // =================================================
    // UPDATE EXISTING TRANSACTION HISTORY
    // =================================================
    //
    // IMPORTANT FIX:
    //
    // createDeposit me transaction PENDING
    // banayi gayi thi.
    //
    // Ab webhook success par usi PENDING
    // transaction ko SUCCESS karenge.
    //
    // Isse history me PENDING nahi rahegi.
    // =================================================

    const successRemark =
      `Wallet recharge successful via QwackPay. UTR: ${
        utr || "N/A"
      }. ₹${creditAmount} credited to wallet.`;

    const transactionUpdate =
      await TransactionHistory.findOneAndUpdate(
        {
          orderId: String(
            deposit.orderId
          ),

          userId: user._id,

          type: "Deposit",

          status: STATUS.PENDING,
        },
        {
          $set: {
            status: STATUS.SUCCESS,

            amount: creditAmount,

            uid: user.uuid,

            phone: user.mobile,

            remark: successRemark,

            updatedAt: new Date(),
          },
        },
        {
          new: true,

          sort: {
            createdAt: -1,
          },
        }
      );

    // =================================================
    // FALLBACK
    // =================================================
    //
    // Agar kisi reason se PENDING history
    // nahi mili, tab SUCCESS history create karo.
    // =================================================

    if (!transactionUpdate) {
      console.log(
        `Pending transaction history not found. Creating SUCCESS history: ${merchant_order_id}`
      );

      await TransactionHistory.create({
        orderId: String(
          deposit.orderId
        ),

        userId: user._id,

        uid: user.uuid,

        phone: user.mobile,

        type: "Deposit",

        amount: creditAmount,

        status: STATUS.SUCCESS,

        remark: successRemark,
      });
    } else {
      console.log(
        `TransactionHistory updated PENDING -> SUCCESS: ${merchant_order_id}`
      );
    }

    // =================================================
    // FINAL LOG
    // =================================================

    console.log(
      "================================================="
    );

    console.log(
      `PAYMENT SUCCESS COMPLETED`
    );

    console.log(
      `Order ID: ${merchant_order_id}`
    );

    console.log(
      `Amount: ₹${creditAmount}`
    );

    console.log(
      `Deposit Status: ${STATUS.SUCCESS}`
    );

    console.log(
      `Transaction Status: ${STATUS.SUCCESS}`
    );

    console.log(
      "================================================="
    );

    // =================================================
    // QWACKPAY ACK
    // =================================================

    return res.send("success");
  } catch (error) {
    console.error(
      "================================================="
    );

    console.error(
      "QWACKPAY WEBHOOK ERROR:"
    );

    console.error(error);

    console.error(
      "================================================="
    );

    // Gateway ko success response dena,
    // warna same webhook repeatedly aa sakta hai.
    return res.send("success");
  }
};

// =====================================================
// CHECK QWACKPAY ORDER STATUS
// =====================================================

const checkQwackPayOrderStatus =
  async (orderId) => {
    try {
      const payload = {
        merchant_id:
          QWACKPAY_MERCHANT_ID,

        order_id: orderId,
      };

      payload.sign =
        generateQwackPaySign(
          payload,
          QWACKPAY_API_KEY
        );

      const { data } =
        await axios.post(
          `${QWACKPAY_BASE_URL}/order/query`,
          payload,
          {
            headers:
              getQwackPayHeaders(),

            timeout: 30000,
          }
        );

      console.log(
        "QWACKPAY QUERY RESPONSE:",
        data
      );

      return data;
    } catch (error) {
      console.error(
        "QwackPay Query Error:",
        error.response?.data ||
          error.message
      );

      return null;
    }
  };

// =====================================================
// GET MY DEPOSITS
// =====================================================

const getMyDeposits = async (
  req,
  res
) => {
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
        message:
          "Authentication required",
      });
    }

    const query = {
      userId,
    };

    if (
      status !== undefined &&
      status !== ""
    ) {
      query.status =
        Number(status);
    }

    if (
      paymentMethod &&
      paymentMethod.trim()
    ) {
      query.paymentMethod = {
        $regex:
          paymentMethod.trim(),
        $options: "i",
      };
    }

    if (
      channel &&
      channel.trim()
    ) {
      query.channel = {
        $regex: channel.trim(),
        $options: "i",
      };
    }

    if (
      phone &&
      phone.trim()
    ) {
      query.phone = {
        $regex: phone.trim(),
        $options: "i",
      };
    }

    if (
      username &&
      username.trim()
    ) {
      query.username = {
        $regex:
          username.trim(),
        $options: "i",
      };
    }

    if (
      orderId &&
      orderId.trim()
    ) {
      query.orderId = {
        $regex:
          orderId.trim(),
        $options: "i",
      };
    }

    if (
      transactionId &&
      transactionId.trim()
    ) {
      query.transactionId = {
        $regex:
          transactionId.trim(),
        $options: "i",
      };
    }

    if (
      utr &&
      utr.trim()
    ) {
      query.utr = {
        $regex: utr.trim(),
        $options: "i",
      };
    }

    // =================================================
    // AMOUNT FILTER
    // =================================================

    if (
      minAmount !== undefined ||
      maxAmount !== undefined
    ) {
      query.amount = {};

      if (
        minAmount !== undefined &&
        minAmount !== ""
      ) {
        const min =
          Number(minAmount);

        if (
          Number.isFinite(min)
        ) {
          query.amount.$gte =
            min;
        }
      }

      if (
        maxAmount !== undefined &&
        maxAmount !== ""
      ) {
        const max =
          Number(maxAmount);

        if (
          Number.isFinite(max)
        ) {
          query.amount.$lte =
            max;
        }
      }

      if (
        Object.keys(
          query.amount
        ).length === 0
      ) {
        delete query.amount;
      }
    }

    // =================================================
    // DATE FILTER
    // =================================================

    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) {
        const startDate =
          new Date(fromDate);

        if (
          !isNaN(
            startDate.getTime()
          )
        ) {
          query.createdAt.$gte =
            startDate;
        }
      }

      if (toDate) {
        const endDate =
          new Date(toDate);

        if (
          !isNaN(
            endDate.getTime()
          )
        ) {
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

      if (
        Object.keys(
          query.createdAt
        ).length === 0
      ) {
        delete query.createdAt;
      }
    }

    // =================================================
    // PAGINATION
    // =================================================

    const currentPage =
      Math.max(
        Number(page) || 1,
        1
      );

    const perPage =
      Math.min(
        Math.max(
          Number(limit) || 10,
          1
        ),
        100
      );

    const total =
      await Deposit.countDocuments(
        query
      );

    const sortDirection =
      String(sort).toLowerCase() ===
      "asc"
        ? 1
        : -1;

    const deposits =
      await Deposit.find(query)
        .sort({
          createdAt:
            sortDirection,
        })
        .skip(
          (currentPage - 1) *
            perPage
        )
        .limit(perPage)
        .lean();

    return res.status(200).json({
      success: true,

      total,

      currentPage,

      totalPages:
        Math.ceil(
          total / perPage
        ),

      limit: perPage,

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

const getMyTurnoverHistory =
  async (req, res) => {
    try {
      const userId =
        req.user?.id ||
        req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      const downlineCount =
        await User.countDocuments({
          referral:
            user.refCode,
        });

      const commissions =
        await TransactionHistory.find(
          {
            userId:
              userId.toString(),

            type:
              "Referral Bonus",

            status:
              STATUS.SUCCESS,
          }
        ).sort({
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
              (
                Number(
                  c.amount || 0
                ) * 10
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
            Number(
              c.amount || 0
            );

          totalCommission +=
            amount;

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

      totalCommission =
        Number(
          totalCommission.toFixed(
            2
          )
        );

      weeklyCommission =
        Number(
          weeklyCommission.toFixed(
            2
          )
        );

      monthlyCommission =
        Number(
          monthlyCommission.toFixed(
            2
          )
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

        error: error.message,
      });
    }
  };

// =====================================================
// ADMIN: GET ALL DEPOSITS
// =====================================================

const getAllDepositsForAdmin =
  async (req, res) => {
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

      const query = {};

      if (
        status !== undefined &&
        status !== ""
      ) {
        query.status =
          Number(status);
      }

      if (
        paymentMethod &&
        paymentMethod.trim()
      ) {
        query.paymentMethod = {
          $regex:
            paymentMethod.trim(),
          $options: "i",
        };
      }

      if (
        channel &&
        channel.trim()
      ) {
        query.channel = {
          $regex:
            channel.trim(),
          $options: "i",
        };
      }

      if (
        phone &&
        phone.trim()
      ) {
        query.phone = {
          $regex:
            phone.trim(),
          $options: "i",
        };
      }

      if (
        username &&
        username.trim()
      ) {
        query.username = {
          $regex:
            username.trim(),
          $options: "i",
        };
      }

      if (
        uid &&
        uid.trim()
      ) {
        query.uid = {
          $regex:
            uid.trim(),
          $options: "i",
        };
      }

      if (
        orderId &&
        orderId.trim()
      ) {
        query.orderId = {
          $regex:
            orderId.trim(),
          $options: "i",
        };
      }

      if (
        transactionId &&
        transactionId.trim()
      ) {
        query.transactionId = {
          $regex:
            transactionId.trim(),
          $options: "i",
        };
      }

      if (
        utr &&
        utr.trim()
      ) {
        query.utr = {
          $regex:
            utr.trim(),
          $options: "i",
        };
      }

      // =================================================
      // AMOUNT FILTER
      // =================================================

      if (
        minAmount !== undefined ||
        maxAmount !== undefined
      ) {
        query.amount = {};

        if (
          minAmount !== undefined &&
          minAmount !== ""
        ) {
          const min =
            Number(minAmount);

          if (
            Number.isFinite(min)
          ) {
            query.amount.$gte =
              min;
          }
        }

        if (
          maxAmount !== undefined &&
          maxAmount !== ""
        ) {
          const max =
            Number(maxAmount);

          if (
            Number.isFinite(max)
          ) {
            query.amount.$lte =
              max;
          }
        }

        if (
          Object.keys(
            query.amount
          ).length === 0
        ) {
          delete query.amount;
        }
      }

      // =================================================
      // DATE FILTER
      // =================================================

      if (fromDate || toDate) {
        query.createdAt = {};

        if (fromDate) {
          const startDate =
            new Date(fromDate);

          if (
            !isNaN(
              startDate.getTime()
            )
          ) {
            startDate.setHours(
              0,
              0,
              0,
              0
            );

            query.createdAt.$gte =
              startDate;
          }
        }

        if (toDate) {
          const endDate =
            new Date(toDate);

          if (
            !isNaN(
              endDate.getTime()
            )
          ) {
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

        if (
          Object.keys(
            query.createdAt
          ).length === 0
        ) {
          delete query.createdAt;
        }
      }

      // =================================================
      // PAGINATION
      // =================================================

      const currentPage =
        Math.max(
          Number(page) || 1,
          1
        );

      const perPage =
        Math.min(
          Math.max(
            Number(limit) || 20,
            1
          ),
          100
        );

      const skip =
        (currentPage - 1) *
        perPage;

      const sortDirection =
        String(sort).toLowerCase() ===
        "asc"
          ? 1
          : -1;

      const total =
        await Deposit.countDocuments(
          query
        );

      const deposits =
        await Deposit.find(query)
          .sort({
            createdAt:
              sortDirection,
          })
          .skip(skip)
          .limit(perPage)
          .lean();

      return res.status(200).json({
        success: true,

        message:
          "All deposits fetched successfully",

        total,

        currentPage,

        perPage,

        totalPages:
          Math.ceil(
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

  cancelDeposit,

  onlinePayCallback,

  getDepositStatusByIdentifier,

  getMyDeposits,

  getMyTurnoverHistory,

  getAllDepositsForAdmin,

  checkQwackPayOrderStatus,

  generateQwackPaySign,

  STATUS,
};