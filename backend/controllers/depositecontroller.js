const axios = require("axios");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Deposit = require("../models/Deposit.js");
const User = require("../models/userModel");
const TransactionHistory = require("../models/TransactionHistory");
const LotteryConfig = require("../models/LotteryConfig");
const { addUserLotteryEntry } = require("./lotteryConfigController.js");

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
// Screenshot ke rules ke hisaab se:
// 1. sign exclude
// 2. null/empty values hatao
// 3. ASCII ascending sort (ksort)
// 4. key1=value1&key2=value2
// 5. &key=API_KEY append
// 6. MD5 + uppercase
// =====================================================

const generateQwackPaySign = (params, apiKey) => {
  // sign exclude karo
  const clean = { ...params };
  delete clean.sign;

  // null / undefined / empty string hatao
  const filtered = {};
  Object.keys(clean).forEach((key) => {
    const val = clean[key];
    if (val !== null && val !== undefined && val !== "") {
      filtered[key] = val;
    }
  });

  // ASCII ascending order mein sort (ksort jaisa)
  const sortedKeys = Object.keys(filtered).sort();

  // key1=value1&key2=value2 banao
  const queryString = sortedKeys
    .map((key) => `${key}=${filtered[key]}`)
    .join("&");

  // API Key append karo
  const signString = `${queryString}&key=${apiKey}`;

  // MD5 + uppercase
  return crypto
    .createHash("md5")
    .update(signString)
    .digest("hex")
    .toUpperCase();
};

// =====================================================
// HELPER: QWACKPAY HEADERS
// =====================================================

const getQwackPayHeaders = () => ({
  "Content-Type": "application/json",
  "X-API-Key": QWACKPAY_API_KEY,
});

// =====================================================
// HELPER: FRONTEND URL
// =====================================================

const getFrontendUrl = () => {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
};

// Browser return URL after QwackPay payment
const getQwackPayReturnUrl = () => {
  return (
    process.env.QWACKPAY_RETURN_URL ||
    `${getFrontendUrl()}/payment-success`
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
  return res.redirect(`${getFrontendUrl()}/${page}?${params.toString()}`);
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
    const userId = req.user?.id || req.user?._id || req.user?.uuid;

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
    // CHANNEL NORMALIZATION
    // =====================================================
    const normalizedChannel = String(channel || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, "");

    // =====================================================
    // QWACKPAY DIRECT FLOW
    //
    // IMPORTANT:
    // - No gatewayId
    // - No AdminGateway
    // - No gateway configuration from admin
    // - Everything comes from process.env
    // =====================================================
    if (normalizedChannel === "qwackpay") {
      const finalPaymentMethod = "INR";
      const finalChannel = "qwackpay";
      const money = numericAmount;

      const orderId = `DEP${Date.now()}`;

      // ---------------------------------------------------
      // CREATE PENDING DEPOSIT FIRST
      // ---------------------------------------------------
      const deposit = await Deposit.create({
        userId: user._id,

        // QwackPay is env based, so gatewayId stays null
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

        status: 0,

        configId: configId || null,
        entryId: entryId || null,
        number: number || null,
      });

      // ---------------------------------------------------
      // QWACKPAY CREATE ORDER PAYLOAD
      // ---------------------------------------------------
      // ---------------------------------------------------
      // CUSTOMER EMAIL
      //
      // QwackPay requires a valid customer email.
      // If user has an email, use the real email.
      // If email is missing, generate a valid fallback
      // email using setthelife.com.
      // ---------------------------------------------------
      const existingEmail = String(user.email || "").trim();

      const customerEmail =
        existingEmail ||
        `customer${String(user._id)}@setthelife.com`;

      const orderPayload = {
        merchant_id: QWACKPAY_MERCHANT_ID,
        amount: Math.round(numericAmount),
        order_id: orderId,
        customer_phone: String(user.mobile || "").trim(),
        customer_email: customerEmail,
        // After successful payment, QwackPay should return the browser
        // to our frontend success page.
        return_url: getQwackPayReturnUrl(),
      };

      // ---------------------------------------------------
      // GENERATE SIGN
      // ---------------------------------------------------
      orderPayload.sign = generateQwackPaySign(
        orderPayload,
        QWACKPAY_API_KEY
      );

      console.log("====================================");
      console.log("QWACKPAY CREATE ORDER");
      console.log("URL:", `${QWACKPAY_BASE_URL}/order/create`);
      console.log("MERCHANT ID:", QWACKPAY_MERCHANT_ID);
      console.log("ORDER ID:", orderId);
      console.log("AMOUNT:", Math.round(numericAmount));
      console.log("PHONE:", user.mobile || "");
      console.log("EMAIL:", customerEmail);
      console.log("RETURN URL:", getQwackPayReturnUrl());
      console.log("====================================");

      try {
        const { data: gatewayResponse } = await axios.post(
          `${QWACKPAY_BASE_URL}/order/create`,
          orderPayload,
          {
            headers: getQwackPayHeaders(),
            timeout: 30000,
          }
        );

        console.log(
          "QWACKPAY CREATE ORDER RESPONSE:",
          JSON.stringify(gatewayResponse, null, 2)
        );
        console.log(
          "QWACKPAY PAYMENT URL:",
          gatewayResponse?.data?.payment_url ||
            gatewayResponse?.data?.paymentUrl ||
            gatewayResponse?.payment_url ||
            gatewayResponse?.paymentUrl ||
            ""
        );

        // -------------------------------------------------
        // EXTRACT PAYMENT URL
        // -------------------------------------------------
        const paymentUrl =
          gatewayResponse?.data?.payment_url ||
          gatewayResponse?.data?.paymentUrl ||
          gatewayResponse?.payment_url ||
          gatewayResponse?.paymentUrl ||
          "";

        // -------------------------------------------------
        // EXTRACT RETURNED ORDER ID
        // -------------------------------------------------
        const returnedOrderId =
          gatewayResponse?.data?.merchant_order_id ||
          gatewayResponse?.data?.order_id ||
          gatewayResponse?.merchant_order_id ||
          gatewayResponse?.order_id ||
          orderId;

        const qwackOrderId =
          gatewayResponse?.data?.qwack_order_id ||
          gatewayResponse?.qwack_order_id ||
          "";

        // -------------------------------------------------
        // QWACKPAY SUCCESS
        //
        // QwackPay returns:
        // {
        //   code: 200,
        //   message: "success",
        //   data: {
        //     qwack_order_id: "...",
        //     merchant_order_id: "...",
        //     payment_url: "..."
        //   }
        // }
        //
        // Do NOT check gatewayResponse.status here.
        // -------------------------------------------------
        if (Number(gatewayResponse?.code) === 200 && paymentUrl) {
          deposit.paymentUrl = String(paymentUrl);
          deposit.orderId = String(returnedOrderId);
          deposit.transactionId =
            String(qwackOrderId || returnedOrderId);
          deposit.status = 0;

          await deposit.save();

          await TransactionHistory.create({
            orderId: deposit.orderId,
            userId: user._id,
            uid: user.uuid,
            phone: user.mobile,
            type: "Deposit",
            amount: money,
            status: 0,
            remark: "Pending QwackPay payment",
          });

          console.log("====================================");
          console.log("QWACKPAY PAYMENT URL CREATED");
          console.log("PAYMENT URL:", paymentUrl);
          console.log("ORDER ID:", deposit.orderId);
          console.log("====================================");

          return res.status(201).json({
            success: true,
            message: "QwackPay payment order created successfully.",
            paymentUrl: String(paymentUrl),
            successUrl: getQwackPayReturnUrl(),
            orderId: deposit.orderId,
            amount: money,
            number: deposit.number || "",
            status: "pending",
            deposit,
            gatewayResponse,
          });
        }

        // -------------------------------------------------
        // QWACKPAY RESPONSE DID NOT CONTAIN PAYMENT URL
        // -------------------------------------------------
        deposit.status = 2;
        await deposit.save();

        console.error(
          "QWACKPAY PAYMENT URL NOT RECEIVED:",
          JSON.stringify(gatewayResponse, null, 2)
        );

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
        deposit.status = 2;
        await deposit.save();

        console.error(
          "===================================="
        );
        console.error(
          "QWACKPAY CREATE ORDER ERROR:",
          gatewayErr.response?.data || gatewayErr.message
        );
        console.error(
          "===================================="
        );

        return res.status(502).json({
          success: false,
          message: "QwackPay payment request failed.",
          paymentUrl: "",
          orderId: deposit.orderId,
          error:
            gatewayErr.response?.data ||
            gatewayErr.message,
        });
      }
    }

    // =====================================================
    // OLD / MANUAL DEPOSIT FLOW
    //
    // QwackPay never comes here.
    // This is only for non-QwackPay/manual deposits.
    // =====================================================
    if (!paymentMethod || !channel) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod and channel are required",
      });
    }

    const usdRet = 92;

    const finalPaymentMethod = paymentMethod;
    const finalChannel = channel;

    let money =
      String(finalPaymentMethod).toUpperCase() === "INR"
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
      type: paymentMethod || finalPaymentMethod,
      channel: finalChannel,

      amount: money,
      exchangeRate:
        String(finalPaymentMethod).toUpperCase() === "USDT"
          ? usdRet
          : 0,

      transactionId: orderId,

      utr: utr || "",
      paymentProof: imageUrl,
      paymentUrl: "",

      status: 0,

      configId: configId || null,
      entryId: entryId || null,
      number: number || null,
    });

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
      paymentUrl: "",
      orderId,
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
// WEBHOOK / CALLBACK
// QwackPay webhook bhejta hai:
// { merchant_order_id, qwack_order_id, amount, status, utr, sign }
// Aur hamein PLAIN TEXT "success" return karna hai
// =====================================================

const onlinePayCallback = async (req, res) => {
  console.log("====================================");
  console.log("QWACKPAY WEBHOOK RECEIVED");
  console.log("BODY:", req.body);
  console.log("====================================");

  try {
    const {
      merchant_order_id,
      qwack_order_id,
      amount,
      status,
      utr,
      sign,
    } = req.body;

    if (!merchant_order_id) {
      return res.status(400).send("order id missing");
    }

    // ============ VERIFY SIGN ============
    const webhookPayload = {
      merchant_order_id,
      qwack_order_id,
      amount,
      status,
      utr,
    };

    const expectedSign = generateQwackPaySign(webhookPayload, QWACKPAY_API_KEY);

    if (expectedSign !== sign) {
      console.error("WEBHOOK SIGN MISMATCH", { expectedSign, received: sign });
      return res.status(400).send("invalid sign");
    }

    // ============ FIND DEPOSIT ============
    const deposit = await Deposit.findOne({
      orderId: String(merchant_order_id),
    });

    if (!deposit) {
      console.log("Deposit not found:", merchant_order_id);
      return res.send("success"); // plain text
    }

    // ============ ALREADY PROCESSED ============
    if (Number(deposit.status) === 1) {
      return res.send("success"); // plain text
    }

    // ============ PAYMENT FAILED ============
    if (String(status).toLowerCase() !== "success") {
      deposit.status = 2;
      await deposit.save();

      await TransactionHistory.create({
        orderId: deposit.orderId,
        userId: deposit.userId,
        uid: deposit.uid,
        phone: deposit.phone,
        type: "Deposit",
        amount: deposit.amount,
        status: 2,
        remark: `QwackPay payment failed. Status: ${status}`,
      });

      return res.send("success"); // plain text
    }

    // ============ FIND USER ============
    const user = await User.findById(deposit.userId);
    if (!user) {
      return res.send("success");
    }

    // ============ ATOMIC CLAIM (prevent duplicate) ============
    const claimed = await Deposit.findOneAndUpdate(
      { _id: deposit._id, status: { $ne: 1 } },
      {
        $set: {
          status: 1,
          utr: utr || deposit.utr || "",
          transactionId: qwack_order_id || utr || deposit.transactionId,
        },
      },
      { new: true }
    );

    if (!claimed) {
      return res.send("success"); // already processed
    }

    // ============ LOTTERY CONFIG UPDATE ============
    if (deposit.configId && deposit.entryId) {
      try {
        if (!mongoose.Types.ObjectId.isValid(deposit.configId)) {
          console.warn("Invalid configId:", deposit.configId);
        } else {
          const config = await LotteryConfig.findById(deposit.configId);

          if (!config) {
            console.warn("LotteryConfig not found:", deposit.configId);
          } else {
            let entry = null;
            if (config.users && typeof config.users.id === "function") {
              entry = config.users.id(deposit.entryId);
            }
            if (!entry && Array.isArray(config.users)) {
              entry =
                config.users.find(
                  (item) => String(item._id) === String(deposit.entryId)
                ) || null;
            }

            if (!entry) {
              console.warn("Lottery entry not found:", deposit.entryId);
            } else {
              entry.isBuy = true;

              if (
                config.winningNumber !== undefined &&
                config.winningNumber !== null &&
                entry.number !== undefined &&
                entry.number !== null
              ) {
                if (String(entry.number) === String(config.winningNumber)) {
                  entry.status = "win";
                  entry.prizeType = "1st";
                  if (!entry.prize) entry.prize = {};
                  entry.prize.first = config.prizes?.first || 0;
                } else {
                  entry.status = "lost";
                }
              }

              await config.save();
              console.log("LOTTERY ENTRY UPDATED:", deposit.entryId);
            }
          }
        }
      } catch (lotteryError) {
        console.error("LOTTERY isBuy UPDATE ERROR:", lotteryError);
      }
    }

    // ============ ADD USER LOTTERY ENTRY ============
    if (
      deposit.number !== undefined &&
      deposit.number !== null &&
      String(deposit.number).trim() !== ""
    ) {
      try {
        await addUserLotteryEntry(
          deposit.number,
          Number(amount),
          user._id
        );
        console.log("addUserLotteryEntry SUCCESS");
      } catch (entryError) {
        console.error("addUserLotteryEntry ERROR:", entryError.message);
      }
    }

    // ============ FINAL SAVE ============
    claimed.utr = utr || claimed.utr || "";
    claimed.transactionId = qwack_order_id || utr || claimed.transactionId;
    claimed.status = 1;
    await claimed.save();

    // ============ TRANSACTION HISTORY ============
    await TransactionHistory.create({
      orderId: merchant_order_id,
      userId: user._id,
      uid: user.uuid,
      phone: user.mobile,
      type: "Lottery Ticket Purchase",
      amount: Number(amount),
      status: 1,
      remark: `Lottery ticket purchase successful via QwackPay. UTR: ${utr || "N/A"}. isBuy set to true. No wallet credit.`,
    });

    // ============ PLAIN TEXT SUCCESS RESPONSE ============
    return res.send("success");
  } catch (error) {
    console.error("QWACKPAY WEBHOOK ERROR:", error);
    // Error pe bhi plain text success return karo, warna QwackPay retry karega
    return res.send("success");
  }
};

// =====================================================
// CHECK ORDER STATUS (QwackPay /order/query)
// =====================================================

const checkQwackPayOrderStatus = async (orderId) => {
  try {
    const payload = {
      merchant_id: QWACKPAY_MERCHANT_ID,
      order_id: orderId,
    };
    payload.sign = generateQwackPaySign(payload, QWACKPAY_API_KEY);

    const { data } = await axios.post(
      `${QWACKPAY_BASE_URL}/order/query`,
      payload,
      { headers: getQwackPayHeaders(), timeout: 30000 }
    );

    console.log("QWACKPAY QUERY RESPONSE:", data);
    return data;
  } catch (error) {
    console.error("QwackPay Query Error:", error.response?.data || error.message);
    return null;
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

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const query = { userId };

    if (status !== undefined && status !== "") query.status = status;
    if (paymentMethod && paymentMethod.trim()) query.paymentMethod = paymentMethod;
    if (channel && channel.trim()) query.channel = channel;
    if (phone) query.phone = { $regex: phone, $options: "i" };
    if (username) query.username = { $regex: username, $options: "i" };
    if (orderId) query.orderId = { $regex: orderId, $options: "i" };
    if (transactionId) query.transactionId = { $regex: transactionId, $options: "i" };
    if (utr) query.utr = { $regex: utr, $options: "i" };

    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined && minAmount !== "") query.amount.$gte = Number(minAmount);
      if (maxAmount !== undefined && maxAmount !== "") query.amount.$lte = Number(maxAmount);
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        const startDate = new Date(fromDate);
        if (!isNaN(startDate.getTime())) query.createdAt.$gte = startDate;
      }
      if (toDate) {
        const endDate = new Date(toDate);
        if (!isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endDate;
        }
      }
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const total = await Deposit.countDocuments(query);
    const sortDirection = String(sort).toLowerCase() === "asc" ? 1 : -1;

    const deposits = await Deposit.find(query)
      .sort({ createdAt: sortDirection })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return res.status(200).json({
      success: true,
      total,
      currentPage,
      totalPages: Math.ceil(total / perPage),
      deposits,
    });
  } catch (error) {
    console.error("GET MY DEPOSITS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// =====================================================
// GET MY TURNOVER HISTORY
// =====================================================

const getMyTurnoverHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const downlineCount = await User.countDocuments({ referral: user.refCode });

    const commissions = await TransactionHistory.find({
      userId: userId.toString(),
      type: "Referral Bonus",
      status: 1,
    }).sort({ createdAt: -1 });

    const formattedCommissions = commissions.map((c) => {
      const match = c.remark ? c.remark.match(/from deposit of (.+)/) : null;
      const referredUsername = match ? match[1] : "Referred User";
      const rechargeAmount = Number((Number(c.amount || 0) * 10).toFixed(2));

      return {
        id: c._id,
        amount: c.amount,
        rechargeAmount,
        referredUsername,
        date: c.createdAt
          ? new Date(c.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
        createdAt: c.createdAt,
      };
    });

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);

    let weeklyCommission = 0;
    let monthlyCommission = 0;
    let totalCommission = 0;

    formattedCommissions.forEach((c) => {
      const amount = Number(c.amount || 0);
      totalCommission += amount;
      const cDate = new Date(c.createdAt);
      if (cDate >= oneWeekAgo) weeklyCommission += amount;
      if (cDate >= oneMonthAgo) monthlyCommission += amount;
    });

    totalCommission = Number(totalCommission.toFixed(2));
    weeklyCommission = Number(weeklyCommission.toFixed(2));
    monthlyCommission = Number(monthlyCommission.toFixed(2));

    const totalTurnover = Number((totalCommission * 10).toFixed(2));
    const weeklyTurnover = Number((weeklyCommission * 10).toFixed(2));
    const monthlyTurnover = Number((monthlyCommission * 10).toFixed(2));

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
      commissions: formattedCommissions,
    });
  } catch (error) {
    console.error("GET TURNOVER HISTORY ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
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

    const query = {};

    if (status !== undefined && status !== "") query.status = Number(status);
    if (paymentMethod && paymentMethod.trim())
      query.paymentMethod = { $regex: paymentMethod.trim(), $options: "i" };
    if (channel && channel.trim())
      query.channel = { $regex: channel.trim(), $options: "i" };
    if (phone && phone.trim())
      query.phone = { $regex: phone.trim(), $options: "i" };
    if (username && username.trim())
      query.username = { $regex: username.trim(), $options: "i" };
    if (uid && uid.trim()) query.uid = { $regex: uid.trim(), $options: "i" };
    if (orderId && orderId.trim())
      query.orderId = { $regex: orderId.trim(), $options: "i" };
    if (transactionId && transactionId.trim())
      query.transactionId = { $regex: transactionId.trim(), $options: "i" };
    if (utr && utr.trim()) query.utr = { $regex: utr.trim(), $options: "i" };

    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined && minAmount !== "") {
        const min = Number(minAmount);
        if (Number.isFinite(min)) query.amount.$gte = min;
      }
      if (maxAmount !== undefined && maxAmount !== "") {
        const max = Number(maxAmount);
        if (Number.isFinite(max)) query.amount.$lte = max;
      }
      if (Object.keys(query.amount).length === 0) delete query.amount;
    }

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
      if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (currentPage - 1) * perPage;
    const sortDirection = String(sort).toLowerCase() === "asc" ? 1 : -1;

    const total = await Deposit.countDocuments(query);
    const deposits = await Deposit.find(query)
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(perPage)
      .lean();

    return res.status(200).json({
      success: true,
      message: "All deposits fetched successfully",
      total,
      currentPage,
      perPage,
      totalPages: Math.ceil(total / perPage),
      deposits,
    });
  } catch (error) {
    console.error("GET ALL DEPOSITS FOR ADMIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
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
  getAllDepositsForAdmin,
  checkQwackPayOrderStatus,
  generateQwackPaySign,
};