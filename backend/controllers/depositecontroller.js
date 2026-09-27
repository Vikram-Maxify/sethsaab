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

        // IMPORTANT: our local merchant order ID is the source of truth.
        // Never replace Deposit.orderId with a gateway-generated order ID.
        const returnedOrderId =
          gatewayResponse?.data?.merchant_order_id ||
          gatewayResponse?.merchant_order_id ||
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

const getCallbackValue = (body = {}, query = {}, keys = []) => {
  const sources = [
    body,
    body?.data,
    body?.result,
    body?.payment,
    query,
  ];

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    for (const key of keys) {
      if (
        source[key] !== undefined &&
        source[key] !== null &&
        source[key] !== ""
      ) {
        return source[key];
      }
    }
  }

  return "";
};

const sanitizeCallbackHeaders = (headers = {}) => {
  const safeHeaders = {};

  Object.entries(headers || {}).forEach(([key, value]) => {
    const lowerKey = String(key).toLowerCase();

    if (
      lowerKey === "authorization" ||
      lowerKey === "cookie" ||
      lowerKey === "set-cookie" ||
      lowerKey === "x-api-key"
    ) {
      safeHeaders[key] = "***MASKED***";
      return;
    }

    safeHeaders[key] = value;
  });

  return safeHeaders;
};

const getCallbackIp = (req) => {
  const forwarded = req.headers?.["x-forwarded-for"];

  return (
    req.headers?.["cf-connecting-ip"] ||
    (forwarded
      ? String(forwarded).split(",")[0].trim()
      : "") ||
    req.headers?.["x-real-ip"] ||
    req.ip ||
    req.socket?.remoteAddress ||
    ""
  );
};

// =====================================================
// QWACKPAY WEBHOOK / CALLBACK
// =====================================================

const onlinePayCallback = async (req, res) => {
  let callbackLog = null;

  try {
    const body =
      req.body && typeof req.body === "object"
        ? req.body
        : {};

    const query =
      req.query && typeof req.query === "object"
        ? req.query
        : {};

    // Some gateways send JSON, some form-data/x-www-form-urlencoded,
    // and some providers may append values in the query string.
    const callbackData = {
      ...query,
      ...body,
    };

    console.log("=================================================");
    console.log("QWACKPAY CALLBACK RECEIVED");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl || req.url || "");
    console.log("IP:", getCallbackIp(req));
    console.log("BODY:", JSON.stringify(body, null, 2));
    console.log("QUERY:", JSON.stringify(query, null, 2));
    console.log("=================================================");

    const merchantOrderId = String(
      getCallbackValue(body, query, [
        "merchant_order_id",
        "merchantOrderId",
        "merchant_order",
        "merchantOrder",
        "order_id",
        "orderId",
      ]) || ""
    ).trim();

    const qwackOrderId = String(
      getCallbackValue(body, query, [
        "qwack_order_id",
        "qwackOrderId",
        "transaction_id",
        "transactionId",
        "payment_id",
        "paymentId",
      ]) || ""
    ).trim();

    const amountRaw = getCallbackValue(body, query, [
      "amount",
      "paid_amount",
      "paidAmount",
      "total_amount",
      "totalAmount",
    ]);

    const gatewayStatus = String(
      getCallbackValue(body, query, [
        "status",
        "payment_status",
        "paymentStatus",
        "transaction_status",
        "transactionStatus",
      ]) || ""
    ).trim();

    const utr = String(
      getCallbackValue(body, query, [
        "utr",
        "utr_number",
        "utrNumber",
        "rrn",
        "reference",
        "reference_number",
      ]) || ""
    ).trim();

    const receivedSign = String(
      getCallbackValue(body, query, [
        "sign",
        "signature",
      ]) || ""
    ).trim();

    const callbackAmount = Number(amountRaw);

    // ===================================================
    // SAVE CALLBACK IMMEDIATELY
    // ===================================================

    callbackLog = await QwackPayCallbackLog.create({
      merchantOrderId,
      qwackOrderId,
      amount: Number.isFinite(callbackAmount)
        ? callbackAmount
        : 0,
      gatewayStatus,
      utr,
      sign: receivedSign,
      signValid: false,
      method: req.method || "",
      url: req.originalUrl || req.url || "",
      ip: getCallbackIp(req),
      headers: sanitizeCallbackHeaders(req.headers),
      body,
      query,
      event: "RECEIVED",
      processingStatus: "RECEIVED",
      message: "QwackPay callback received",
    });

    console.log(
      "QWACKPAY CALLBACK LOG SAVED:",
      callbackLog._id.toString()
    );

    // A browser/crawler GET to the callback URL is not a payment webhook.
    // Keep it logged, but do not process a wallet credit.
    if (req.method === "GET" && !merchantOrderId) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "INVALID",
            processingStatus: "FAILED",
            message:
              "GET callback received without order ID",
            processedAt: new Date(),
          },
        }
      );

      return res.status(200).json({
        success: false,
        received: true,
        message: "Callback endpoint is working",
      });
    }

    // ===================================================
    // ORDER ID VALIDATION
    // ===================================================

    if (!merchantOrderId && !qwackOrderId) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "INVALID",
            processingStatus: "FAILED",
            message: "Order ID missing",
            processedAt: new Date(),
          },
        }
      );

      // Acknowledge the webhook so the gateway does not keep retrying.
      // No wallet credit is ever performed without a matching local order.
      return res.status(200).send("success");
    }

    // ===================================================
    // SIGNATURE VALIDATION
    // ===================================================
    // Keep the existing QwackPay signing convention used by
    // this controller: merchant_order_id, qwack_order_id,
    // amount, status and utr, sorted alphabetically, then key.
    // ===================================================

    const webhookPayload = {
      merchant_order_id: merchantOrderId,
      qwack_order_id: qwackOrderId,
      amount: amountRaw,
      status: gatewayStatus,
      utr,
    };

    const expectedSign = generateQwackPaySign(
      webhookPayload,
      QWACKPAY_API_KEY
    );

    const receivedSignUpper = receivedSign.toUpperCase();

    const signValid =
      Boolean(receivedSignUpper) &&
      expectedSign.toUpperCase() === receivedSignUpper;

    console.log("QWACKPAY SIGN CHECK:", {
      expectedSign,
      receivedSign: receivedSignUpper,
      signValid,
    });

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

    if (!signValid) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            processingStatus: "FAILED",
            message: receivedSign
              ? "Invalid callback signature"
              : "Callback signature missing",
            error: receivedSign
              ? `Expected ${expectedSign}, received ${receivedSignUpper}`
              : "sign/signature was not supplied",
            processedAt: new Date(),
          },
        }
      );

      return res.status(200).send("success");
    }

    // ===================================================
    // FIND DEPOSIT
    // ===================================================

    const orderConditions = [];

    if (merchantOrderId) {
      orderConditions.push({
        orderId: merchantOrderId,
      });
    }

    if (qwackOrderId) {
      orderConditions.push({
        transactionId: qwackOrderId,
      });
    }

    let deposit = null;

    if (orderConditions.length > 0) {
      deposit = await Deposit.findOne({
        $or: orderConditions,
      });
    }

    if (!deposit && merchantOrderId) {
      deposit = await Deposit.findOne({
        orderId: merchantOrderId,
      });
    }

    if (!deposit && qwackOrderId) {
      deposit = await Deposit.findOne({
        transactionId: qwackOrderId,
      });
    }

    if (!deposit) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "DEPOSIT_NOT_FOUND",
            processingStatus: "FAILED",
            message:
              `Deposit not found for merchantOrderId=${merchantOrderId}, qwackOrderId=${qwackOrderId}`,
            processedAt: new Date(),
          },
        }
      );

      // Gateway callbacks are normally acknowledged even when the
      // corresponding local order cannot be found, so the gateway does
      // not keep retrying an unknown order forever.
      return res.send("success");
    }

    await QwackPayCallbackLog.findByIdAndUpdate(
      callbackLog._id,
      {
        $set: {
          depositId: deposit._id,
        },
      }
    );

    // ===================================================
    // ALREADY SUCCESS
    // ===================================================

    if (Number(deposit.status) === STATUS.SUCCESS) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "ALREADY_PROCESSED",
            processingStatus: "IGNORED",
            message: "Payment already processed",
            processedAt: new Date(),
          },
        }
      );

      return res.send("success");
    }

    // ===================================================
    // ALREADY CANCELLED
    // ===================================================

    if (Number(deposit.status) === STATUS.CANCELLED) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "CANCELLED_DEPOSIT",
            processingStatus: "IGNORED",
            message: "Deposit was already cancelled",
            processedAt: new Date(),
          },
        }
      );

      return res.send("success");
    }

    // ===================================================
    // AMOUNT VALIDATION
    // ===================================================

    if (
      !Number.isFinite(callbackAmount) ||
      callbackAmount <= 0
    ) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "INVALID_AMOUNT",
            processingStatus: "FAILED",
            message: `Invalid callback amount: ${amountRaw}`,
            processedAt: new Date(),
          },
        }
      );

      return res.status(200).send("success");
    }

    const depositAmount = Number(deposit.amount);

    if (
      Number.isFinite(depositAmount) &&
      Math.abs(callbackAmount - depositAmount) > 0.01
    ) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "AMOUNT_MISMATCH",
            processingStatus: "FAILED",
            message:
              `Amount mismatch. Deposit=${depositAmount}, Callback=${callbackAmount}`,
            processedAt: new Date(),
          },
        }
      );

      return res.status(200).send("success");
    }

    // ===================================================
    // STATUS
    // ===================================================

    const normalizedStatus = gatewayStatus
      .trim()
      .toLowerCase();

    const isSuccess = [
      "success",
      "successful",
      "paid",
      "completed",
      "complete",
      "approved",
      "1",
    ].includes(normalizedStatus);

    const isFailed = [
      "failed",
      "failure",
      "declined",
      "rejected",
      "cancelled",
      "canceled",
      "2",
      "3",
    ].includes(normalizedStatus);

    if (!isSuccess && !isFailed) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "UNKNOWN_STATUS",
            processingStatus: "FAILED",
            message:
              `Unknown QwackPay status: ${gatewayStatus}`,
            processedAt: new Date(),
          },
        }
      );

      return res.status(200).send("success");
    }

    // ===================================================
    // FAILED PAYMENT
    // ===================================================

    if (isFailed) {
      await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,
          status: STATUS.PENDING,
        },
        {
          $set: {
            status: STATUS.FAILED,
            utr: utr || deposit.utr || "",
            transactionId:
              qwackOrderId ||
              utr ||
              deposit.transactionId,
          },
        }
      );

      await TransactionHistory.findOneAndUpdate(
        {
          orderId: String(deposit.orderId),
          userId: deposit.userId,
          type: "Deposit",
          status: STATUS.PENDING,
        },
        {
          $set: {
            status: STATUS.FAILED,
            amount: depositAmount,
            remark:
              `QwackPay recharge failed. Status: ${gatewayStatus}`,
            updatedAt: new Date(),
          },
        },
        {
          sort: { createdAt: -1 },
        }
      );

      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "PAYMENT_FAILED",
            processingStatus: "SUCCESS",
            message:
              `Payment failed with status ${gatewayStatus}`,
            processedAt: new Date(),
          },
        }
      );

      return res.send("success");
    }

    // ===================================================
    // SUCCESS - FIND USER
    // ===================================================

    const user = await User.findById(deposit.userId);

    if (!user) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "USER_NOT_FOUND",
            processingStatus: "FAILED",
            message: "User not found",
            processedAt: new Date(),
          },
        }
      );

      return res.send("success");
    }

    // ===================================================
    // ATOMIC CLAIM
    // ===================================================
    // This is the most important duplicate-payment protection.
    // If QwackPay sends the same callback twice, only the first
    // request can change PENDING -> SUCCESS.
    // ===================================================

    const claimed =
      await Deposit.findOneAndUpdate(
        {
          _id: deposit._id,
          status: STATUS.PENDING,
        },
        {
          $set: {
            status: STATUS.SUCCESS,
            utr: utr || deposit.utr || "",
            transactionId:
              qwackOrderId ||
              utr ||
              deposit.transactionId,
          },
        },
        {
          new: true,
        }
      );

    // ===================================================
    // DUPLICATE CALLBACK
    // ===================================================

    if (!claimed) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "ALREADY_CLAIMED",
            processingStatus: "IGNORED",
            message:
              "Webhook was already processed by another request",
            processedAt: new Date(),
          },
        }
      );

      return res.send("success");
    }

    // ===================================================
    // WALLET CREDIT
    // ===================================================

    const updatedUser =
      await User.findByIdAndUpdate(
        user._id,
        {
          $inc: {
            wallet: callbackAmount,
          },
        },
        {
          new: true,
        }
      );

    if (!updatedUser) {
      await QwackPayCallbackLog.findByIdAndUpdate(
        callbackLog._id,
        {
          $set: {
            event: "WALLET_UPDATE_FAILED",
            processingStatus: "FAILED",
            message:
              "Deposit was claimed but wallet update failed",
            error:
              "User.findByIdAndUpdate returned null",
            processedAt: new Date(),
          },
        }
      );

      console.error(
        "CRITICAL: DEPOSIT CLAIMED BUT WALLET UPDATE FAILED",
        deposit._id.toString()
      );

      return res.status(500).send("wallet update failed");
    }

    // ===================================================
    // TRANSACTION HISTORY
    // ===================================================

    const successRemark =
      `Wallet recharge successful via QwackPay. UTR: ${
        utr || "N/A"
      }. ₹${callbackAmount} credited to wallet.`;

    const transactionUpdate =
      await TransactionHistory.findOneAndUpdate(
        {
          orderId: String(deposit.orderId),
          userId: user._id,
          type: "Deposit",
          status: STATUS.PENDING,
        },
        {
          $set: {
            status: STATUS.SUCCESS,
            amount: callbackAmount,
            uid: user.uuid,
            phone: user.mobile,
            remark: successRemark,
            updatedAt: new Date(),
          },
        },
        {
          new: true,
          sort: { createdAt: -1 },
        }
      );

    // Fallback in case the pending history was not created.
    if (!transactionUpdate) {
      await TransactionHistory.create({
        orderId: String(deposit.orderId),
        userId: user._id,
        uid: user.uuid,
        phone: user.mobile,
        type: "Deposit",
        amount: callbackAmount,
        status: STATUS.SUCCESS,
        remark: successRemark,
      });
    }

    // ===================================================
    // FINAL CALLBACK LOG
    // ===================================================

    await QwackPayCallbackLog.findByIdAndUpdate(
      callbackLog._id,
      {
        $set: {
          event: "PAYMENT_SUCCESS",
          processingStatus: "SUCCESS",
          signValid: true,
          message:
            `₹${callbackAmount} credited successfully`,
          processedAt: new Date(),
        },
      }
    );

    console.log("=================================================");
    console.log("QWACKPAY CALLBACK SUCCESS");
    console.log("ORDER:", merchantOrderId);
    console.log("QWACK ORDER:", qwackOrderId);
    console.log("AMOUNT:", callbackAmount);
    console.log("UTR:", utr);
    console.log("USER:", user._id.toString());
    console.log("NEW WALLET:", updatedUser.wallet);
    console.log("=================================================");

    return res.send("success");
  } catch (error) {
    console.error(
      "QWACKPAY CALLBACK ERROR:",
      error.response?.data || error.message
    );

    // IMPORTANT: use FAILED, not ERROR, because the callback log
    // schema uses FAILED as the error state.
    if (callbackLog?._id) {
      try {
        await QwackPayCallbackLog.findByIdAndUpdate(
          callbackLog._id,
          {
            $set: {
              event: "EXCEPTION",
              processingStatus: "FAILED",
              message:
                "Callback processing exception",
              error: error.message,
              processedAt: new Date(),
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

    // Always acknowledge gateway callbacks after logging the exception.
    return res.status(200).send("success");
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