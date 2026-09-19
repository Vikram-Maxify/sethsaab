const mongoose = require("mongoose");
const LotteryConfig = require("../models/LotteryConfig");

// =====================================================
// GET USER ID FROM JWT
// =====================================================

const getUserId = (req) => {
  return req.user?.uuid || req.user?.id || req.user?._id;
};

// =====================================================
// GET TODAY
// =====================================================

const getToday = () => {
  const now = new Date();

  return {
    date: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    dateString:
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, "0")}-` +
      `${String(now.getDate()).padStart(2, "0")}`,
  };
};

// =====================================================
// VALIDATE 6 DIGIT NUMBER
// =====================================================

const validateNumber = (number) => {
  if (number === undefined || number === null || number === "") {
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
  if (amount === undefined || amount === null || amount === "") {
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
  const allowedStatuses = ["pending", "win", "lost"];

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
// CREATE LOTTERY CONFIG (ADMIN)
// POST /api/lottery
// =====================================================

const createLotteryConfig = async (req, res) => {
  try {
    const { marketName, month, year, prizes } = req.body;

    // =================================================
    // MARKET
    // =================================================

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

    // =================================================
    // CURRENT DATE
    // =================================================

    const today = new Date();

    const selectedMonth =
      month !== undefined ? Number(month) : today.getMonth() + 1;

    const selectedYear =
      year !== undefined ? Number(year) : today.getFullYear();

    // =================================================
    // VALIDATE MONTH
    // =================================================

    if (
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    // =================================================
    // VALIDATE YEAR
    // =================================================

    if (!Number.isInteger(selectedYear) || selectedYear < 2000) {
      return res.status(400).json({
        success: false,
        message: "Valid year is required",
      });
    }

    // =================================================
    // VALIDATE PRIZES
    // =================================================

    if (!prizes || typeof prizes !== "object") {
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

    if (!Number.isFinite(firstPrize) || firstPrize < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid first prize amount is required",
      });
    }

    if (!Number.isFinite(secondPrize) || secondPrize < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid second prize amount is required",
      });
    }

    if (!Number.isFinite(thirdPrize) || thirdPrize < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid third prize amount is required",
      });
    }

    // =================================================
    // PAST MONTH CHECK
    // =================================================

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (
      selectedYear < currentYear ||
      (selectedYear === currentYear && selectedMonth < currentMonth)
    ) {
      return res.status(400).json({
        success: false,
        message: "Past month configuration cannot be created",
      });
    }

    // =================================================
    // TOTAL DAYS
    // =================================================

    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

    // =================================================
    // START DAY
    // =================================================

    let startDay = 1;

    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      startDay = today.getDate() + 1;
    }

    // =================================================
    // NO FUTURE DAYS
    // =================================================

    if (startDay > totalDays) {
      return res.status(400).json({
        success: false,
        message: "Is month ki koi future date nahi bachi",
      });
    }

    // =================================================
    // EXISTING CONFIGS
    // =================================================

    const existingConfigs = await LotteryConfig.find({
      marketName: cleanMarketName,
      month: selectedMonth,
      year: selectedYear,
    }).select("date");

    const existingDates = new Set(existingConfigs.map((item) => item.date));

    // =================================================
    // PREPARE DOCUMENTS
    // =================================================

    const documents = [];

    for (let day = startDay; day <= totalDays; day++) {
      if (existingDates.has(day)) {
        continue;
      }

      documents.push({
        marketName: cleanMarketName,
        date: day,
        month: selectedMonth,
        year: selectedYear,
        prizes: {
          first: firstPrize,
          second: secondPrize,
          third: thirdPrize,
        },
        users: [],
        isActive: false,
      });
    }

    // =================================================
    // ALREADY EXISTS
    // =================================================

    if (documents.length === 0) {
      return res.status(409).json({
        success: false,
        message: "Is market ke saare dates already exist karte hain",
      });
    }

    // =================================================
    // INSERT
    // =================================================

    const created = await LotteryConfig.insertMany(documents);

    return res.status(201).json({
      success: true,
      message: `${created.length} lottery configs created successfully`,
      totalCreated: created.length,
      startDay,
      endDay: totalDays,
      data: created,
    });
  } catch (error) {
    console.error("Create lottery config error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Some lottery dates already exist",
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
// ADD USER LOTTERY ENTRY (USER)
// POST /api/lottery/entry
// =====================================================

const addUserLotteryEntry = async (req, res) => {
  try {
    const { number, amount } = req.body;

    // =================================================
    // USER ID
    // =================================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // =================================================
    // NUMBER VALIDATION
    // =================================================

    const numberValidation = validateNumber(number);

    if (!numberValidation.valid) {
      return res.status(400).json({
        success: false,
        message: numberValidation.message,
      });
    }

    // =================================================
    // AMOUNT VALIDATION
    // =================================================

    const amountValidation = validateAmount(amount);

    if (!amountValidation.valid) {
      return res.status(400).json({
        success: false,
        message: amountValidation.message,
      });
    }

    // =================================================
    // TODAY
    // =================================================

    const { date, month, year, dateString } = getToday();

    // =================================================
    // FIND TODAY ACTIVE CONFIG
    // =================================================

    const config = await LotteryConfig.findOne({
      date,
      month,
      year,
      isActive: true,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Today's lottery market is not active",
      });
    }

    // =================================================
    // SAFETY: USERS ARRAY
    // =================================================

    if (!Array.isArray(config.users)) {
      config.users = [];
    }

    // =================================================
    // CHECK EXISTING ENTRY
    // =================================================

    const existingEntry = config.users.find(
      (entry) =>
        String(entry.userId) === String(userId) &&
        entry.entryDate === dateString
    );

    if (existingEntry) {
      return res.status(409).json({
        success: false,
        message: "You already have a lottery entry for today",
        data: existingEntry,
      });
    }

    // =================================================
    // ADD ENTRY
    // =================================================

    config.users.push({
      userId: String(userId),
      entryDate: dateString,
      number: numberValidation.number,
      amount: amountValidation.amount,
      isBuy: false,
      prize: {
        first: 0,
        second: 0,
        third: 0,
      },
      prizeType: null,
      status: "pending",
    });

    // =================================================
    // SAVE
    // =================================================

    await config.save();

    // =================================================
    // GET NEW ENTRY
    // =================================================

    const newEntry = config.users[config.users.length - 1];

    return res.status(201).json({
      success: true,
      message: "Lottery entry submitted successfully",
      data: {
        lotteryId: config._id,
        marketName: config.marketName,
        date: config.date,
        month: config.month,
        year: config.year,
        isActive: config.isActive,
        entryDate: dateString,
        entry: newEntry,
      },
    });
  } catch (error) {
    console.error("Add user lottery entry error:", error);

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

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const configs = await LotteryConfig.find({
      "users.userId": String(userId),
    }).sort({
      year: -1,
      month: -1,
      date: -1,
    });

    const entries = [];

    configs.forEach((config) => {
      config.users
        .filter((entry) => String(entry.userId) === String(userId))
        .forEach((entry) => {
          entries.push({
            lotteryId: config._id,
            marketName: config.marketName,
            date: config.date,
            month: config.month,
            year: config.year,
            isActive: config.isActive,
            prizes: config.prizes,
            entry,
          });
        });
    });

    entries.sort(
      (a, b) =>
        new Date(b.entry.entryDate) - new Date(a.entry.entryDate)
    );

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
// =====================================================

const getAllLotteryConfigs = async (req, res) => {
  try {
    const configs = await LotteryConfig.find().sort({
      year: -1,
      month: -1,
      date: -1,
      marketName: 1,
    });

    return res.status(200).json({
      success: true,
      count: configs.length,
      data: configs,
    });
  } catch (error) {
    console.error("Get all lottery configs error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET TODAY ACTIVE LOTTERY
// =====================================================

const getActiveLotteryConfig = async (req, res) => {
  try {
    const { date, month, year } = getToday();

    const config = await LotteryConfig.findOne({
      date,
      month,
      year,
      isActive: true,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "No active lottery configuration found for today",
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Get active lottery config error:", error);

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
    console.error("Get lottery config by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// ACTIVATE CONFIG
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

    // =================================================
    // DEACTIVATE OTHER DATES
    // =================================================

    await LotteryConfig.updateMany(
      {
        marketName: config.marketName,
        month: config.month,
        year: config.year,
        isActive: true,
        _id: { $ne: config._id },
      },
      {
        $set: { isActive: false },
      }
    );

    // =================================================
    // ACTIVATE THIS
    // =================================================

    config.isActive = true;

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Lottery configuration activated successfully",
      data: config,
    });
  } catch (error) {
    console.error("Activate lottery config error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE USER ENTRY STATUS (ADMIN)
// PATCH /api/lottery/:configId/entry/:entryId/status
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
      entry.prizeType = prizeType || entry.prizeType;

      if (prize) {
        entry.prize = {
          first: prize.first || 0,
          second: prize.second || 0,
          third: prize.third || 0,
        };
      }
    } else if (statusValidation.status === "lost") {
      entry.prizeType = null;
      entry.prize = { first: 0, second: 0, third: 0 };
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Entry status updated successfully",
      data: entry,
    });
  } catch (error) {
    console.error("Update entry status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE LOTTERY CONFIG (ADMIN)
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
      message: "Lottery configuration deleted successfully",
    });
  } catch (error) {
    console.error("Delete lottery config error:", error);

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
  updateEntryStatus,
  deleteLotteryConfig,
};