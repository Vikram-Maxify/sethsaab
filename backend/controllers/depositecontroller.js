const axios = require("axios");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Deposit = require("../models/Deposit.js");
const User = require("../models/userModel");
const TransactionHistory = require("../models/TransactionHistory");
const QwackPayCallbackLog = require(
  "../models/QwackPayCallbackLog"
);

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

const QWACKPAY_BASE_URL = (
  process.env.QWACKPAY_BASE_URL ||
  "https://qwackpay.com/api/v1"
).replace(/\/+$/, "");

const QWACKPAY_MERCHANT_ID =
  process.env.QWACKPAY_MERCHANT_ID || "636055076";

const QWACKPAY_API_KEY =
  process.env.QWACKPAY_API_KEY || "";

// =====================================================
// FRONTEND URL
// =====================================================

const getFrontendUrl = () => {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");
};

// =====================================================
// BACKEND URL
// =====================================================

const getBackendUrl = () => {
  return (
    process.env.BACKEND_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");
};

// =====================================================
// QWACKPAY RETURN URL
// =====================================================

const getQwackPayReturnUrl = () => {
  return (
    process.env.QWACKPAY_RETURN_URL ||
    `${getFrontendUrl()}/payment-success`
  ).replace(/\/+$/, "");
};

// =====================================================
// QWACKPAY CALLBACK URL
// =====================================================
//
// IMPORTANT:
// Route:
// router.post("/deposit/callback", onlinePayCallback)
//
// If main router is mounted:
// app.use("/api", depositRoutes)
//
// Final URL:
// https://setthelife.com/api/deposit/callback
// =====================================================

const getQwackPayCallbackUrl = () => {
  return (
    process.env.QWACKPAY_CALLBACK_URL ||
    `${getBackendUrl()}/api/deposit/callback`
  ).replace(/\/+$/, "");
};

// =====================================================
// HELPER: QWACKPAY SIGN
// =====================================================

const generateQwackPaySign = (params, apiKey) => {
  const clean = { ...(params || {}) };

  delete clean.sign;

  const filtered = {};

  Object.keys(clean).forEach((key) => {
    const value = clean[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      filtered[key] = value;
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
// HELPER: USER ID
// =====================================================

const getUserIdFromRequest = (req) => {
  return (
    req.user?.id ||
    req.user?._id ||
    req.user?.uuid ||
    null
  );
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
    } = req.body || {};

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

    const userId = getUserIdFromRequest(req);

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

      const orderId = `DEP${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;

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

      const existingEmail = String(
        user.email || ""
      ).trim();

      const customerEmail =
        existingEmail ||
        `customer${String(user._id)}@setthelife.com`;

      // =================================================
      // QWACKPAY ORDER PAYLOAD
      // =================================================

      const orderPayload = {
        merchant_id: QWACKPAY_MERCHANT_ID,

        amount: Math.round(numericAmount),

        order_id: orderId,

        customer_phone: String(
          user.mobile || ""
        ).trim(),

        customer_email: customerEmail,

        // Browser redirect
        return_url: getQwackPayReturnUrl(),

        // Backend webhook
        callback_url: getQwackPayCallbackUrl(),
      };

      // =================================================
      // SIGN
      // =================================================

      orderPayload.sign = generateQwackPaySign(
        orderPayload,
        QWACKPAY_API_KEY
      );

      console.log(
        "================================================="
      );

      console.log("QWACKPAY CREATE REQUEST");

      console.log({
        merchant_id: QWACKPAY_MERCHANT_ID,
        amount: orderPayload.amount,
        order_id: orderPayload.order_id,
        customer_phone:
          orderPayload.customer_phone,
        customer_email:
          orderPayload.customer_email,
        return_url:
          orderPayload.return_url,
        callback_url:
          orderPayload.callback_url,
      });

      console.log(
        "================================================="
      );

      try {
        const response = await axios.post(
          `${QWACKPAY_BASE_URL}/order/create`,
          orderPayload,
          {
            headers: getQwackPayHeaders(),
            timeout: 30000,
          }
        );

        const gatewayResponse = response.data;

        console.log(
          "================================================="
        );

        console.log(
          "QWACKPAY CREATE RESPONSE:"
        );

        console.log(
          JSON.stringify(
            gatewayResponse,
            null,
            2
          )
        );

        console.log(
          "================================================="
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
        // RETURNED MERCHANT ORDER ID
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
          gatewayResponse?.data?.qwackOrderId ||
          gatewayResponse?.qwack_order_id ||
          gatewayResponse?.qwackOrderId ||
          "";

        // =================================================
        // GATEWAY CODE
        // =================================================

        const gatewayCode = Number(
          gatewayResponse?.code ??
            gatewayResponse?.status_code ??
            gatewayResponse?.statusCode ??
            0
        );

        // =================================================
        // SUCCESSFUL ORDER CREATION
        // =================================================

        if (paymentUrl) {
          deposit.paymentUrl = String(
            paymentUrl
          );

          deposit.orderId = String(
            returnedOrderId
          );

          deposit.transactionId = String(
            qwackOrderId ||
              returnedOrderId ||
              orderId
          );

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

            remark:
              "Pending QwackPay recharge",
          });

          return res.status(201).json({
            success: true,

            message:
              "QwackPay recharge order created successfully.",

            paymentUrl: String(paymentUrl),

            successUrl:
              getQwackPayReturnUrl(),

            callbackUrl:
              getQwackPayCallbackUrl(),

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
            `QwackPay payment URL not received. Gateway code: ${gatewayCode}`,

          paymentUrl: "",

          orderId: deposit.orderId,

          gatewayResponse,
        });
      } catch (gatewayErr) {
        console.error(
          "================================================="
        );

        console.error(
          "QWACKPAY CREATE ERROR:"
        );

        console.error(
          gatewayErr.response?.data ||
            gatewayErr.message
        );

        console.error(
          "================================================="
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

    const finalPaymentMethod =
      paymentMethod;

    const finalChannel = channel;

    const money =
      String(
        finalPaymentMethod
      ).toUpperCase() === "INR"
        ? numericAmount
        : numericAmount * usdRet;

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

      gatewayId: null,

      uid: user.uuid,

      phone: user.mobile,

      username: user.username,

      orderId,

      paymentMethod:
        finalPaymentMethod,

      type:
        finalPaymentMethod,

      channel: finalChannel,

      amount: money,

      exchangeRate:
        String(
          finalPaymentMethod
        ).toUpperCase() === "USDT"
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

      remark: `Recharge request submitted via ${finalChannel}`,
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
    const userId = getUserIdFromRequest(req);

    const { depositId } =
      req.params;

    const {
      reason = "User cancelled at gateway",
    } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    if (!depositId) {
      return res.status(400).json({
        success: false,
        message:
          "Deposit ID is required",
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

    // =================================================
    // ALREADY SUCCESS
    // =================================================

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

    // =================================================
    // ALREADY CANCELLED
    // =================================================

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

    deposit.cancelledBy =
      "USER";

    await deposit.save();

    // =================================================
    // TRANSACTION HISTORY
    // =================================================

    try {
      await TransactionHistory.updateOne(
        {
          orderId:
            deposit.orderId,

          userId:
            deposit.userId,

          type: "Deposit",

          status:
            STATUS.PENDING,
        },
        {
          $set: {
            status:
              STATUS.CANCELLED,

            remark:
              `User cancelled payment. Reason: ${reason}`,

            updatedAt:
              new Date(),
          },
        }
      );
    } catch (historyError) {
      console.warn(
        "TransactionHistory update failed:",
        historyError.message
      );
    }

    return res.status(200).json({
      success: true,

      message:
        "Deposit cancelled",

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
        getUserIdFromRequest(req);

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
              orderId:
                String(identifier),
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

          orderId:
            deposit.orderId,

          amount:
            deposit.amount,

          status:
            deposit.status,

          paymentMethod:
            deposit.paymentMethod,

          channel:
            deposit.channel,

          utr:
            deposit.utr || "",

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

const onlinePayCallback = async (req, res) => {
  let callbackLog = null;

  try {
    console.log(
      "================================================="
    );

    console.log(
      "QWACKPAY CALLBACK RECEIVED"
    );

    console.log(
      "METHOD:",
      req.method
    );

    console.log(
      "BODY:",
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    console.log(
      "================================================="
    );

    const {
      merchant_order_id,
      qwack_order_id,
      amount,
      status,
      utr,
      sign,
    } = req.body || {};

    // =================================================
    // SAVE RAW CALLBACK LOG
    // =================================================

    callbackLog =
      await QwackPayCallbackLog.create({
        merchantOrderId:
          merchant_order_id || "",

        qwackOrderId:
          qwack_order_id || "",

        amount:
          Number(amount) || 0,

        gatewayStatus:
          String(status || ""),

        utr:
          String(utr || ""),

        sign:
          String(sign || ""),

        signValid: false,

        method:
          req.method || "",

        url:
          req.originalUrl ||
          req.url ||
          "",

        ip:
          req.headers["cf-connecting-ip"] ||
          req.headers["x-forwarded-for"] ||
          req.ip ||
          "",

        body:
          req.body || {},

        headers:
          req.headers || {},

        event:
          "RECEIVED",

        processingStatus:
          "RECEIVED",

        message:
          "QwackPay callback received",
      });

    console.log(
      "QWACKPAY CALLBACK LOG SAVED:",
      callbackLog._id
    );

    // =================================================
    // ORDER ID CHECK
    // =================================================

    if (!merchant_order_id) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "INVALID",
            processingStatus: "FAILED",
            message:
              "Order ID missing",
            processedAt: new Date(),
          },
        }
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

    const receivedSign =
      String(sign || "")
        .trim()
        .toUpperCase();

    const signValid =
      expectedSign.toUpperCase() ===
      receivedSign;

    // =================================================
    // UPDATE SIGN RESULT
    // =================================================

    await QwackPayCallbackLog.findByIdAndUpdate(
      callbackLog._id,
      {
        $set: {
          signValid,
          event: signValid
            ? "SIGN_VALID"
            : "SIGN_INVALID",
        },
      }
    );

    // =================================================
    // INVALID SIGN
    // =================================================

    if (!signValid) {
      console.error(
        "QWACKPAY SIGN MISMATCH"
      );

      console.error(
        "Expected:",
        expectedSign
      );

      console.error(
        "Received:",
        receivedSign
      );

      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            processingStatus:
              "FAILED",

            message:
              "Invalid callback signature",

            error:
              `Expected ${expectedSign}, received ${receivedSign}`,

            processedAt:
              new Date(),
          },
        }
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
        orderId:
          String(
            merchant_order_id
          ),
      });

    if (!deposit) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "DEPOSIT_NOT_FOUND",

            processingStatus:
              "FAILED",

            message:
              `Deposit not found for ${merchant_order_id}`,

            processedAt:
              new Date(),
          },
        }
      );

      return res.send("success");
    }

    // =================================================
    // SAVE DEPOSIT ID
    // =================================================

    await QwackPayCallbackLog.findByIdAndUpdate(
      callbackLog._id,
      {
        $set: {
          depositId:
            deposit._id,
        },
      }
    );

    // =================================================
    // ALREADY SUCCESS
    // =================================================

    if (
      Number(deposit.status) ===
      STATUS.SUCCESS
    ) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event:
              "ALREADY_PROCESSED",

            processingStatus:
              "SUCCESS",

            message:
              "Payment already processed",

            processedAt:
              new Date(),
          },
        }
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
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event:
              "CANCELLED_DEPOSIT",

            processingStatus:
              "SUCCESS",

            message:
              "Deposit was already cancelled",

            processedAt:
              new Date(),
          },
        }
      );

      return res.send("success");
    }

    // =================================================
    // STATUS
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
    // FAILED
    // =================================================

    if (!isSuccess) {
      await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,

          status: {
            $ne: STATUS.SUCCESS,
          },
        },
        {
          $set: {
            status:
              STATUS.FAILED,

            utr:
              utr ||
              deposit.utr ||
              "",

            transactionId:
              qwack_order_id ||
              utr ||
              deposit.transactionId,
          },
        }
      );

      await TransactionHistory.findOneAndUpdate(
        {
          orderId:
            String(
              deposit.orderId
            ),

          userId:
            deposit.userId,

          type: "Deposit",

          status:
            STATUS.PENDING,
        },
        {
          $set: {
            status:
              STATUS.FAILED,

            amount:
              Number(amount) ||
              Number(
                deposit.amount
              ) ||
              0,

            remark:
              `QwackPay recharge failed. Status: ${status}`,

            updatedAt:
              new Date(),
          },
        },
        {
          new: true,

          sort: {
            createdAt: -1,
          },
        }
      );

      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event:
              "PAYMENT_FAILED",

            processingStatus:
              "SUCCESS",

            message:
              `Payment failed with status ${status}`,

            processedAt:
              new Date(),
          },
        }
      );

      return res.send("success");
    }

    // =================================================
    // SUCCESS
    // =================================================

    const user =
      await User.findById(
        deposit.userId
      );

    if (!user) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event:
              "USER_NOT_FOUND",

            processingStatus:
              "FAILED",

            message:
              "User not found",

            processedAt:
              new Date(),
          },
        }
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

    if (
      !Number.isFinite(
        creditAmount
      ) ||
      creditAmount <= 0
    ) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event:
              "INVALID_AMOUNT",

            processingStatus:
              "FAILED",

            message:
              `Invalid amount: ${amount}`,

            processedAt:
              new Date(),
          },
        }
      );

      return res.send("success");
    }

    // =================================================
    // ATOMIC CLAIM
    // =================================================

    const claimed =
      await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,

          status:
            STATUS.PENDING,
        },
        {
          $set: {
            status:
              STATUS.SUCCESS,

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
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event:
              "ALREADY_CLAIMED",

            processingStatus:
              "SUCCESS",

            message:
              "Webhook was already processed",

            processedAt:
              new Date(),
          },
        }
      );

      return res.send("success");
    }

    // =================================================
    // WALLET CREDIT
    // =================================================

    await User.findByIdAndUpdate(
      user._id,
      {
        $inc: {
          wallet:
            creditAmount,
        },
      }
    );

    // =================================================
    // TRANSACTION HISTORY
    // =================================================

    const successRemark =
      `Wallet recharge successful via QwackPay. UTR: ${
        utr || "N/A"
      }. ₹${creditAmount} credited to wallet.`;

    const transactionUpdate =
      await TransactionHistory.findOneAndUpdate(
        {
          orderId:
            String(
              deposit.orderId
            ),

          userId:
            user._id,

          type: "Deposit",

          status:
            STATUS.PENDING,
        },
        {
          $set: {
            status:
              STATUS.SUCCESS,

            amount:
              creditAmount,

            uid:
              user.uuid,

            phone:
              user.mobile,

            remark:
              successRemark,

            updatedAt:
              new Date(),
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
    // FALLBACK HISTORY
    // =================================================

    if (!transactionUpdate) {
      await TransactionHistory.create({
        orderId:
          String(
            deposit.orderId
          ),

        userId:
          user._id,

        uid:
          user.uuid,

        phone:
          user.mobile,

        type: "Deposit",

        amount:
          creditAmount,

        status:
          STATUS.SUCCESS,

        remark:
          successRemark,
      });
    }

    // =================================================
    // FINAL CALLBACK LOG
    // =================================================

    await QwackPayCallbackLog.findByIdAndUpdate(
      callbackLog._id,
      {
        $set: {
          event:
            "PAYMENT_SUCCESS",

          processingStatus:
            "SUCCESS",

          message:
            `₹${creditAmount} credited successfully`,

          processedAt:
            new Date(),
        },
      }
    );

    console.log(
      "QWACKPAY CALLBACK SUCCESS"
    );

    return res.send("success");
  } catch (error) {
    console.error(
      "QWACKPAY CALLBACK ERROR:",
      error
    );

    // =================================================
    // SAVE ERROR IN CALLBACK LOG
    // =================================================

    if (callbackLog?._id) {
      try {
        await QwackPayCallbackLog.findByIdAndUpdate(
          callbackLog._id,
          {
            $set: {
              event:
                "EXCEPTION",

              processingStatus:
                "ERROR",

              message:
                "Callback processing exception",

              error:
                error.message,

              processedAt:
                new Date(),
            },
          }
        );
      } catch (logError) {
        console.error(
          "CALLBACK ERROR LOG FAILED:",
          logError.message
        );
      }
    }

    return res.send("success");
  }
};

// =====================================================
// CHECK QWACKPAY ORDER STATUS
// =====================================================

const checkQwackPayOrderStatus =
  async (orderId) => {
    try {
      if (!orderId) {
        return null;
      }

      const payload = {
        merchant_id:
          QWACKPAY_MERCHANT_ID,

        order_id:
          orderId,
      };

      payload.sign =
        generateQwackPaySign(
          payload,
          QWACKPAY_API_KEY
        );

      const response =
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
        response.data
      );

      return response.data;
    } catch (error) {
      console.error(
        "QWACKPAY QUERY ERROR:",
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
      getUserIdFromRequest(req);

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

    // =================================================
    // STATUS
    // =================================================

    if (
      status !== undefined &&
      status !== ""
    ) {
      const statusNumber =
        Number(status);

      if (
        Number.isInteger(
          statusNumber
        )
      ) {
        query.status =
          statusNumber;
      }
    }

    // =================================================
    // PAYMENT METHOD
    // =================================================

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

    // =================================================
    // CHANNEL
    // =================================================

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

    // =================================================
    // PHONE
    // =================================================

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

    // =================================================
    // USERNAME
    // =================================================

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

    // =================================================
    // ORDER ID
    // =================================================

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

    // =================================================
    // TRANSACTION ID
    // =================================================

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

    // =================================================
    // UTR
    // =================================================

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
      const amountQuery = {};

      if (
        minAmount !== undefined &&
        minAmount !== ""
      ) {
        const min =
          Number(minAmount);

        if (
          Number.isFinite(min)
        ) {
          amountQuery.$gte =
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
          amountQuery.$lte =
            max;
        }
      }

      if (
        Object.keys(
          amountQuery
        ).length > 0
      ) {
        query.amount =
          amountQuery;
      }
    }

    // =================================================
    // DATE FILTER
    // =================================================

    if (fromDate || toDate) {
      const dateQuery = {};

      if (fromDate) {
        const startDate =
          new Date(fromDate);

        if (
          !Number.isNaN(
            startDate.getTime()
          )
        ) {
          startDate.setHours(
            0,
            0,
            0,
            0
          );

          dateQuery.$gte =
            startDate;
        }
      }

      if (toDate) {
        const endDate =
          new Date(toDate);

        if (
          !Number.isNaN(
            endDate.getTime()
          )
        ) {
          endDate.setHours(
            23,
            59,
            59,
            999
          );

          dateQuery.$lte =
            endDate;
        }
      }

      if (
        Object.keys(
          dateQuery
        ).length > 0
      ) {
        query.createdAt =
          dateQuery;
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
      String(sort)
        .toLowerCase() ===
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
        getUserIdFromRequest(req);

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
        commissions.map(
          (commission) => {
            const match =
              commission.remark
                ? commission.remark.match(
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
                    commission.amount ||
                      0
                  ) * 10
                ).toFixed(2)
              );

            return {
              id:
                commission._id,

              amount:
                commission.amount,

              rechargeAmount,

              referredUsername,

              date:
                commission.createdAt
                  ? new Date(
                      commission.createdAt
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
                commission.createdAt,
            };
          }
        );

      const now =
        new Date();

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
        (commission) => {
          const amount =
            Number(
              commission.amount ||
                0
            );

          totalCommission +=
            amount;

          const commissionDate =
            new Date(
              commission.createdAt
            );

          if (
            commissionDate >=
            oneWeekAgo
          ) {
            weeklyCommission +=
              amount;
          }

          if (
            commissionDate >=
            oneMonthAgo
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

      // =================================================
      // STATUS
      // =================================================

      if (
        status !== undefined &&
        status !== ""
      ) {
        const statusNumber =
          Number(status);

        if (
          Number.isInteger(
            statusNumber
          )
        ) {
          query.status =
            statusNumber;
        }
      }

      // =================================================
      // PAYMENT METHOD
      // =================================================

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

      // =================================================
      // CHANNEL
      // =================================================

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

      // =================================================
      // PHONE
      // =================================================

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

      // =================================================
      // USERNAME
      // =================================================

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

      // =================================================
      // UID
      // =================================================

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

      // =================================================
      // ORDER ID
      // =================================================

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

      // =================================================
      // TRANSACTION ID
      // =================================================

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

      // =================================================
      // UTR
      // =================================================

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
        const amountQuery = {};

        if (
          minAmount !== undefined &&
          minAmount !== ""
        ) {
          const min =
            Number(minAmount);

          if (
            Number.isFinite(min)
          ) {
            amountQuery.$gte =
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
            amountQuery.$lte =
              max;
          }
        }

        if (
          Object.keys(
            amountQuery
          ).length > 0
        ) {
          query.amount =
            amountQuery;
        }
      }

      // =================================================
      // DATE FILTER
      // =================================================

      if (fromDate || toDate) {
        const dateQuery = {};

        if (fromDate) {
          const startDate =
            new Date(fromDate);

          if (
            !Number.isNaN(
              startDate.getTime()
            )
          ) {
            startDate.setHours(
              0,
              0,
              0,
              0
            );

            dateQuery.$gte =
              startDate;
          }
        }

        if (toDate) {
          const endDate =
            new Date(toDate);

          if (
            !Number.isNaN(
              endDate.getTime()
            )
          ) {
            endDate.setHours(
              23,
              59,
              59,
              999
            );

            dateQuery.$lte =
              endDate;
          }
        }

        if (
          Object.keys(
            dateQuery
          ).length > 0
        ) {
          query.createdAt =
            dateQuery;
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
        String(sort)
          .toLowerCase() ===
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