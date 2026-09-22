const mongoose = require("mongoose");
const LotteryConfig = require("../models/LotteryConfig");
const User = require("../models/userModel");
const TransactionHistory = require("../models/TransactionHistory");

// =====================================================
// GET USER ID FROM JWT
// =====================================================

const getUserId = (req) => {
  return req.user?.uuid || req.user?.id || req.user?._id;
};

// =====================================================
// GET TODAY DATE STRING
// =====================================================

const getTodayDateString = () => {
  const now = new Date();

  return (
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`
  );
};

// =====================================================
// FORMAT DATE AS YYYY-MM-DD
// =====================================================

const formatDateString = (date) => {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
};

// =====================================================
// VALIDATE DRAW DATE
// =====================================================

const validateDrawDate = (drawDate) => {
  if (!drawDate) {
    return {
      valid: false,
      message: "Draw date is required",
    };
  }

  const value = String(drawDate).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return {
      valid: false,
      message: "Draw date must be in YYYY-MM-DD format",
    };
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return {
      valid: false,
      message: "Invalid draw date",
    };
  }

  // Only today or future date allowed.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  date.setHours(0, 0, 0, 0);

  if (date < today) {
    return {
      valid: false,
      message: "Past draw date cannot be created",
    };
  }

  return {
    valid: true,
    date,
    dateString: value,
  };
};

// =====================================================
// VALIDATE DRAW TIME
// =====================================================

const validateDrawTime = (drawTime) => {
  if (!drawTime) {
    return {
      valid: false,
      message: "Draw time is required",
    };
  }

  const value = String(drawTime).trim();

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    return {
      valid: false,
      message: "Draw time must be in HH:mm format",
    };
  }

  return {
    valid: true,
    drawTime: value,
  };
};

// =====================================================
// VALIDATE MONTH
// =====================================================

const validateMonth = (month) => {
  if (
    month === undefined ||
    month === null ||
    month === ""
  ) {
    return {
      valid: false,
      message: "Month is required",
    };
  }

  const value = Number(month);

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > 12
  ) {
    return {
      valid: false,
      message: "Month must be between 1 and 12",
    };
  }

  return {
    valid: true,
    month: value,
  };
};

// =====================================================
// VALIDATE YEAR
// =====================================================

const validateYear = (year) => {
  if (
    year === undefined ||
    year === null ||
    year === ""
  ) {
    return {
      valid: false,
      message: "Year is required",
    };
  }

  const value = Number(year);

  if (
    !Number.isInteger(value) ||
    value < 2000 ||
    value > 2100
  ) {
    return {
      valid: false,
      message: "Year must be a valid year (2000-2100)",
    };
  }

  return {
    valid: true,
    year: value,
  };
};

// =====================================================
// VALIDATE 6 DIGIT NUMBER
// =====================================================

const validateNumber = (number) => {
  if (
    number === undefined ||
    number === null ||
    number === ""
  ) {
    return {
      valid: false,
      message: "6 digit lottery number is required",
    };
  }

  const value = String(number).trim();

  if (!/^\d{6}$/.test(value)) {
    return {
      valid: false,
      message: "Lottery number must be exactly 6 digits",
    };
  }

  return {
    valid: true,
    number: value,
  };
};

// =====================================================
// VALIDATE AMOUNT
// =====================================================

const validateAmount = (amount) => {
  if (
    amount === undefined ||
    amount === null ||
    amount === ""
  ) {
    return {
      valid: false,
      message: "Valid amount is required",
    };
  }

  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return {
      valid: false,
      message: "Amount must be a valid number",
    };
  }

  if (value < 0) {
    return {
      valid: false,
      message: "Amount cannot be negative",
    };
  }

  return {
    valid: true,
    amount: value,
  };
};

// =====================================================
// VALIDATE STATUS
// =====================================================

const validateStatus = (status) => {
  const allowedStatuses = [
    "pending",
    "win",
    "lost",
  ];

  if (!allowedStatuses.includes(status)) {
    return {
      valid: false,
      message: "Status must be pending, win or lost",
    };
  }

  return {
    valid: true,
    status,
  };
};

// =====================================================
// CREATE LOTTERY CONFIG
// ADMIN
//
// POST /api/lottery
//
// BODY:
//
// {
//   "marketName": "Delhi Lottery",
//   "month": 9,
//   "year": 2026,
//   "drawDate": "2026-09-20",
//   "drawTime": "18:30",
//   "prizes": {
//      "first": 500000,
//      "second": 100000,
//      "third": 50000
//   }
// }
// =====================================================

const createLotteryConfig = async (req, res) => {
  try {
    const {
      marketName,
      month,
      year,
      drawDate,
      drawTime,
      prizes,
    } = req.body;

    // ================================================
    // MARKET VALIDATION
    // ================================================

    if (
      !marketName ||
      typeof marketName !== "string" ||
      !marketName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Market name is required",
      });
    }

    const cleanMarketName = marketName.trim();

    // ================================================
    // MONTH VALIDATION
    // ================================================

    const monthValidation = validateMonth(month);

    if (!monthValidation.valid) {
      return res.status(400).json({
        success: false,
        message: monthValidation.message,
      });
    }

    // ================================================
    // YEAR VALIDATION
    // ================================================

    const yearValidation = validateYear(year);

    if (!yearValidation.valid) {
      return res.status(400).json({
        success: false,
        message: yearValidation.message,
      });
    }

    // ================================================
    // DRAW DATE VALIDATION
    // ================================================

    const dateValidation = validateDrawDate(drawDate);

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message,
      });
    }

    // ================================================
    // DRAW TIME VALIDATION
    // ================================================

    const timeValidation = validateDrawTime(drawTime);

    if (!timeValidation.valid) {
      return res.status(400).json({
        success: false,
        message: timeValidation.message,
      });
    }

    // ================================================
    // PRIZES VALIDATION
    // ================================================

    if (
      !prizes ||
      typeof prizes !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message: "Prize amounts are required",
      });
    }

    if (
      prizes.first === undefined ||
      prizes.first === null ||
      prizes.first === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "First prize is required",
      });
    }

    if (
      prizes.second === undefined ||
      prizes.second === null ||
      prizes.second === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Second prize is required",
      });
    }

    if (
      prizes.third === undefined ||
      prizes.third === null ||
      prizes.third === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Third prize is required",
      });
    }

    const firstPrize = Number(prizes.first);
    const secondPrize = Number(prizes.second);
    const thirdPrize = Number(prizes.third);

    if (
      !Number.isFinite(firstPrize) ||
      firstPrize < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid first prize amount is required",
      });
    }

    if (
      !Number.isFinite(secondPrize) ||
      secondPrize < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid second prize amount is required",
      });
    }

    if (
      !Number.isFinite(thirdPrize) ||
      thirdPrize < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid third prize amount is required",
      });
    }

    // ================================================
    // CHECK DUPLICATE
    // ================================================

    const startOfDay = new Date(dateValidation.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateValidation.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingLottery = await LotteryConfig.findOne({
      marketName: cleanMarketName,
      drawDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (existingLottery) {
      return res.status(409).json({
        success: false,
        message:
          "Is market ki selected date ka lottery ticket already exist karta hai",
        data: existingLottery,
      });
    }

    // ================================================
    // CREATE ONLY ONE CONFIG
    // ================================================

    const lottery = await LotteryConfig.create({
      marketName: cleanMarketName,

      month: monthValidation.month,

      year: yearValidation.year,

      drawDate: dateValidation.date,

      drawTime: timeValidation.drawTime,

      prizes: {
        first: firstPrize,
        second: secondPrize,
        third: thirdPrize,
      },

      users: [],

      isActive: false,
    });

    // ================================================
    // RESPONSE
    // ================================================

    return res.status(201).json({
      success: true,

      message:
        "Lottery ticket created successfully for selected date",

      data: lottery,
    });
  } catch (error) {
    console.error(
      "Create lottery config error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Is market ki selected date ka lottery ticket already exist karta hai",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// ADD USER LOTTERY ENTRY
// USER
//
// POST /api/lottery/entry
//
// BODY:
//
// {
//   "configId": "...",
//   "number": "123456",
//   "amount": 100
// }
//
// ✅ Wallet se amount deduct hoga
// ✅ Wallet balance check hoga
// ✅ TransactionHistory create hogi
// ✅ Same number multiple times allowed
// =====================================================

const addUserLotteryEntry = async (req, res) => {
  try {
    // =====================================================
    // GET DATA FROM REQUEST
    // =====================================================

    const { configId, number, amount } = req.body;

    // =====================================================
    // GET USER ID
    // =====================================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // =====================================================
    // VALIDATE CONFIG ID
    // =====================================================

    if (!configId) {
      return res.status(400).json({
        success: false,
        message: "configId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(configId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configId",
      });
    }

    // =====================================================
    // VALIDATE NUMBER
    // =====================================================

    const numberValidation = validateNumber(number);

    if (!numberValidation.valid) {
      return res.status(400).json({
        success: false,
        message: numberValidation.message,
      });
    }

    // =====================================================
    // VALIDATE AMOUNT
    // =====================================================

    const amountValidation = validateAmount(amount);

    if (!amountValidation.valid) {
      return res.status(400).json({
        success: false,
        message: amountValidation.message,
      });
    }

    // =====================================================
    // FIND USER (DB SE — wallet check ke liye)
    // =====================================================

    const isObjectId = /^[a-f\d]{24}$/i.test(String(userId));

    const user = await User.findOne({
      $or: [
        ...(isObjectId ? [{ _id: userId }] : []),
        { uuid: String(userId) },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================================
    // WALLET BALANCE CHECK (pre-check for better error message)
    // =====================================================

    if (Number(user.wallet || 0) < Number(amountValidation.amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
        walletBalance: Number(user.wallet || 0),
        requiredAmount: Number(amountValidation.amount),
      });
    }

    // =====================================================
    // FIND LOTTERY CONFIG BY CONFIG ID
    // =====================================================

    const config = await LotteryConfig.findById(configId);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
        configId,
      });
    }

    // =====================================================
    // CHECK ACTIVE
    // =====================================================

    if (!config.isActive) {
      return res.status(400).json({
        success: false,
        message: "This lottery is not active",
        configId: config._id,
        marketName: config.marketName,
      });
    }

    // =====================================================
    // GET DRAW DATE
    // =====================================================

    const getDBDateString = (date) => {
      if (!date) {
        return null;
      }

      const d = new Date(date);

      if (Number.isNaN(d.getTime())) {
        return null;
      }

      return d.toISOString().slice(0, 10);
    };

    const dateString = getDBDateString(config.drawDate);

    if (!dateString) {
      return res.status(500).json({
        success: false,
        message: "Invalid draw date in lottery configuration",
        configId: config._id,
      });
    }

    // =====================================================
    // VALIDATE DRAW TIME
    // =====================================================

    if (
      !config.drawTime ||
      typeof config.drawTime !== "string" ||
      !/^\d{2}:\d{2}$/.test(config.drawTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid draw time in lottery configuration",
        configId: config._id,
        drawDate: dateString,
        drawTime: config.drawTime,
      });
    }

    // =====================================================
    // PARSE DRAW TIME
    // =====================================================

    const [drawHour, drawMinute] = config.drawTime
      .split(":")
      .map(Number);

    if (
      Number.isNaN(drawHour) ||
      Number.isNaN(drawMinute) ||
      drawHour < 0 ||
      drawHour > 23 ||
      drawMinute < 0 ||
      drawMinute > 59
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid draw time in lottery configuration",
        configId: config._id,
        drawDate: dateString,
        drawTime: config.drawTime,
      });
    }

    // =====================================================
    // CREATE DRAW DATETIME (IST)
    // =====================================================

    const drawDateTime = new Date(
      `${dateString}T${config.drawTime}:00+05:30`
    );

    if (Number.isNaN(drawDateTime.getTime())) {
      return res.status(500).json({
        success: false,
        message: "Unable to calculate lottery draw time",
        configId: config._id,
      });
    }

    // =====================================================
    // CURRENT TIME
    // =====================================================

    const now = new Date();

    console.log("==============================================");
    console.log("LOTTERY ENTRY");
    console.log("CONFIG ID       :", config._id);
    console.log("MARKET NAME     :", config.marketName);
    console.log("DRAW DATE       :", dateString);
    console.log("DRAW TIME IST   :", config.drawTime);
    console.log("DRAW DATETIME   :", drawDateTime.toISOString());
    console.log("CURRENT UTC     :", now.toISOString());
    console.log("USER WALLET     :", user.wallet);
    console.log("TICKET AMOUNT   :", amountValidation.amount);
    console.log("NUMBER          :", numberValidation.number);
    console.log("==============================================");

    // =====================================================
    // CHECK DRAW TIME
    // =====================================================

    if (now >= drawDateTime) {
      return res.status(400).json({
        success: false,
        message: "Lottery ticket sale time has ended",
        configId: config._id,
        marketName: config.marketName,
        drawDate: dateString,
        drawTime: config.drawTime,
      });
    }

    // =====================================================
    // SAFETY FOR USERS ARRAY
    // =====================================================

    if (!Array.isArray(config.users)) {
      config.users = [];
    }

    // =====================================================
    // NOTE: Same number multiple times allowed
    // User same config me same number baar-baar kharid sakta hai
    // =====================================================

    // =====================================================
    // DEDUCT WALLET (ATOMIC)
    // =====================================================
    // Pehle atomically deduct karo, taaki race condition na ho.
    // Agar wallet balance kam hua toh null return karega.

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        wallet: { $gte: Number(amountValidation.amount) },
      },
      {
        $inc: { wallet: -Number(amountValidation.amount) },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
        walletBalance: Number(user.wallet || 0),
        requiredAmount: Number(amountValidation.amount),
      });
    }

    console.log(
      `WALLET DEDUCTED: ₹${amountValidation.amount} from user ${user._id}. New balance: ₹${updatedUser.wallet}`
    );

    // =====================================================
    // ADD USER ENTRY
    // =====================================================

    config.users.push({
      userId: String(user._id),

      entryDate: dateString,

      number: numberValidation.number,

      amount: amountValidation.amount,

      isBuy: true,

      prize: {
        first: 0,
        second: 0,
        third: 0,
      },

      prizeType: null,

      status: "pending",
    });

    // =====================================================
    // SAVE CONFIG
    // =====================================================

    try {
      await config.save();
    } catch (saveError) {
      // Config save fail hua toh wallet refund karo
      console.error("Config save failed, refunding wallet:", saveError);

      await User.findByIdAndUpdate(user._id, {
        $inc: { wallet: Number(amountValidation.amount) },
      });

      return res.status(500).json({
        success: false,
        message: "Failed to save lottery entry. Wallet refunded.",
        error: saveError.message,
      });
    }

    // =====================================================
    // TRANSACTION HISTORY
    // =====================================================

    try {
      await TransactionHistory.create({
        orderId: `LOT${Date.now()}${Math.floor(Math.random() * 1000)}`,
        userId: user._id,
        uid: user.uuid,
        phone: user.mobile,
        type: "Lottery Ticket Purchase",
        amount: amountValidation.amount,
        status: 1,
        remark: `Lottery ticket purchased. Market: ${config.marketName}, Draw: ${dateString} ${config.drawTime}, Number: ${numberValidation.number}`,
      });
    } catch (historyError) {
      console.error("TransactionHistory create error:", historyError);
      // Wallet already deduct ho chuka hai, entry save ho chuki hai.
      // History fail hone pe rollback nahi karenge, sirf log karenge.
    }

    // =====================================================
    // GET NEW ENTRY
    // =====================================================

    const newEntry = config.users[config.users.length - 1];

    // =====================================================
    // GET ALL ENTRIES OF THIS USER FOR THIS DRAW
    // =====================================================

    const userEntries = config.users.filter(
      (entry) =>
        String(entry.userId) === String(user._id) &&
        String(entry.entryDate) === String(dateString)
    );

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return res.status(201).json({
      success: true,

      message: "Lottery entry submitted successfully",

      data: {
        configId: config._id,

        lotteryId: config._id,

        marketName: config.marketName,

        month: config.month,

        year: config.year,

        drawDate: dateString,

        drawTime: config.drawTime,

        isActive: config.isActive,

        entryDate: dateString,

        number: numberValidation.number,

        amount: amountValidation.amount,

        // 👇 wallet info
        walletBalance: updatedUser.wallet,

        // 👇 new entry
        entry: newEntry,

        // 👇 total tickets count of this user for this draw
        totalTickets: userEntries.length,

        // 👇 all tickets of this user for this draw
        allEntries: userEntries,
      },
    });
  } catch (error) {
    console.error(
      "Add user lottery entry error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY LOTTERY ENTRIES
// =====================================================

const getMyLotteryEntries = async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log("STEP 0 userId:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // ---- User dhoondo _id ya uuid se ----
    const isObjectId = /^[a-f\d]{24}$/i.test(String(userId));

    const user = await User.findOne({
      $or: [
        ...(isObjectId ? [{ _id: userId }] : []),
        { uuid: String(userId) },
      ],
    }).lean();

    console.log("STEP 1 user:", user ? { _id: user._id, uuid: user.uuid } : null);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ---- Dono identifiers banao: _id + uuid ----
    const identifiers = [
      String(user._id),
      ...(user.uuid ? [String(user.uuid)] : []),
      String(userId),
    ];
    const uniqueIdentifiers = [...new Set(identifiers)];
    console.log("STEP 2 identifiers:", uniqueIdentifiers);

    // ---- Dono se search: users.userId in [_id, uuid] ----
    const configs = await LotteryConfig.find({
      "users.userId": { $in: uniqueIdentifiers },
    })
      .sort({ drawDate: -1 })
      .lean();

    console.log("STEP 3 configs count:", configs.length);

    // ---- Flatten: sirf is user ki entries ----
    const entries = [];

    for (const config of configs) {
      const userEntries = (config.users || []).filter((u) =>
        uniqueIdentifiers.includes(String(u.userId))
      );

      for (const u of userEntries) {
        entries.push({
          configId: config._id,
          marketName: config.marketName,
          month: config.month,
          year: config.year,
          drawDate: config.drawDate,
          drawTime: config.drawTime,
          prizes: config.prizes,
          isActive: config.isActive,
          entryId: u._id,
          userId: u.userId,
          entryDate: u.entryDate,
          number: u.number,
          amount: u.amount,
          isBuy: u.isBuy,
          prize: u.prize,
          prizeType: u.prizeType,
          status: u.status,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        });
      }
    }

    console.log("STEP 5 total entries:", entries.length);

    entries.sort((a, b) => new Date(b.drawDate) - new Date(a.drawDate));

    return res.status(200).json({
      success: true,
      message: "User lottery entries fetched successfully",
      totalEntries: entries.length,
      data: entries,
    });
  } catch (error) {
    console.error("Get my lottery entries error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL LOTTERY CONFIGS
// ADMIN
// =====================================================

const getAllLotteryConfigs = async (req, res) => {
  try {
    const configs = await LotteryConfig.find().sort({
      drawDate: -1,
    });

    return res.status(200).json({
      success: true,

      count: configs.length,

      data: configs,
    });
  } catch (error) {
    console.error(
      "Get all lottery configs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ACTIVE LOTTERY
// =====================================================

const getActiveLotteryConfig = async (req, res) => {
  try {
    const now = new Date();

    const configs = await LotteryConfig.find({
      isActive: true,

      drawDate: {
        $gte: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ),
      },
    })
      .sort({ drawDate: 1 })
      .limit(1);

    const config = configs[0];

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "No active lottery configuration found",
      });
    }

    return res.status(200).json({
      success: true,

      data: config,
    });
  } catch (error) {
    console.error(
      "Get active lottery config error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET CONFIG BY ID
// =====================================================

const getLotteryConfigById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    const config = await LotteryConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error(
      "Get lottery config by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// ACTIVATE CONFIG
// ADMIN
// =====================================================

const activateLotteryConfig = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    const config = await LotteryConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lotteryDate = new Date(config.drawDate);
    lotteryDate.setHours(0, 0, 0, 0);

    if (lotteryDate < today) {
      return res.status(400).json({
        success: false,
        message: "Past lottery cannot be activated",
      });
    }

    await LotteryConfig.updateMany(
      {
        _id: { $ne: config._id },
        isActive: true,
      },
      {
        $set: { isActive: false },
      }
    );

    config.isActive = true;

    await config.save();

    return res.status(200).json({
      success: true,

      message:
        "Lottery configuration activated successfully",

      data: config,
    });
  } catch (error) {
    console.error(
      "Activate lottery config error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// DEACTIVATE CONFIG
// ADMIN
// =====================================================

const deactivateLotteryConfig = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    const config = await LotteryConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
      });
    }

    config.isActive = false;

    await config.save();

    return res.status(200).json({
      success: true,

      message:
        "Lottery configuration deactivated successfully",

      data: config,
    });
  } catch (error) {
    console.error(
      "Deactivate lottery config error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE USER ENTRY STATUS
// ADMIN
// =====================================================

const updateEntryStatus = async (req, res) => {
  try {
    const { configId, entryId } = req.params;

    const { status, prizeType, prize } = req.body;

    if (!mongoose.Types.ObjectId.isValid(configId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    const statusValidation = validateStatus(status);

    if (!statusValidation.valid) {
      return res.status(400).json({
        success: false,
        message: statusValidation.message,
      });
    }

    const config = await LotteryConfig.findById(configId);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
      });
    }

    const entry = config.users.id(entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Lottery entry not found",
      });
    }

    entry.status = statusValidation.status;

    if (statusValidation.status === "win") {
      if (
        prizeType &&
        ["1st", "2nd", "3rd"].includes(prizeType)
      ) {
        entry.prizeType = prizeType;
      }

      if (prize) {
        entry.prize = {
          first: Number(prize.first) || 0,

          second: Number(prize.second) || 0,

          third: Number(prize.third) || 0,
        };
      }
    } else if (statusValidation.status === "lost") {
      entry.prizeType = null;

      entry.prize = {
        first: 0,
        second: 0,
        third: 0,
      };
    } else if (statusValidation.status === "pending") {
      entry.prizeType = null;

      entry.prize = {
        first: 0,
        second: 0,
        third: 0,
      };
    }

    await config.save();

    return res.status(200).json({
      success: true,

      message: "Entry status updated successfully",

      data: entry,
    });
  } catch (error) {
    console.error(
      "Update entry status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE LOTTERY CONFIG
// ADMIN
// =====================================================

const deleteLotteryConfig = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    const config = await LotteryConfig.findByIdAndDelete(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Lottery configuration deleted successfully",

      data: {
        id: config._id,
      },
    });
  } catch (error) {
    console.error(
      "Delete lottery config error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createLotteryConfig,

  addUserLotteryEntry,

  getMyLotteryEntries,

  getAllLotteryConfigs,

  getActiveLotteryConfig,

  getLotteryConfigById,

  activateLotteryConfig,

  deactivateLotteryConfig,

  updateEntryStatus,

  deleteLotteryConfig,
};