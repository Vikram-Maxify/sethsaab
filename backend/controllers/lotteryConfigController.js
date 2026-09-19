const mongoose = require("mongoose");

const LotteryConfig = require("../models/LotteryConfig");

// =====================================================
// GET USER ID FROM JWT
// =====================================================

const getUserId = (req) => {
  return req.user?.uuid || req.user?.id || req.user?._id;
};

// =====================================================
// GET CURRENT MONTH + YEAR
// =====================================================

const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

// =====================================================
// GET CURRENT DATE STRING (YYYY-MM-DD)
// =====================================================

const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// =====================================================
// VALIDATE 6 DIGIT NUMBER
// =====================================================

const validateNumber = (number) => {
  if (number === undefined || number === null || number === "") {
    return { valid: false, message: "6 digit lottery number is required" };
  }
  const value = String(number).trim();
  if (!/^\d{6}$/.test(value)) {
    return { valid: false, message: "Lottery number must be exactly 6 digits" };
  }
  return { valid: true, number: value };
};

// =====================================================
// VALIDATE AMOUNT
// =====================================================

const validateAmount = (amount) => {
  if (
    amount === undefined ||
    amount === null ||
    amount === "" ||
    Number.isNaN(Number(amount))
  ) {
    return { valid: false, message: "Valid amount is required" };
  }
  const convertedAmount = Number(amount);
  if (convertedAmount < 0) {
    return { valid: false, message: "Amount cannot be negative" };
  }
  return { valid: true, amount: convertedAmount };
};

// =====================================================
// VALIDATE STATUS
// =====================================================

const validateStatus = (status) => {
  const allowedStatuses = ["pending", "win", "lost"];
  if (!allowedStatuses.includes(status)) {
    return { valid: false, message: "Status must be pending, win or lost" };
  }
  return { valid: true, status };
};

// =====================================================
// VALIDATE MONTH
// =====================================================

const validateMonth = (month) => {
  const value = Number(month);
  if (!Number.isInteger(value) || value < 1 || value > 12) {
    return { valid: false, message: "Month must be between 1 and 12" };
  }
  return { valid: true, month: value };
};

// =====================================================
// VALIDATE YEAR
// =====================================================

const validateYear = (year) => {
  const value = Number(year);
  if (!Number.isInteger(value) || value < 2000) {
    return { valid: false, message: "Valid year is required" };
  }
  return { valid: true, year: value };
};

// =====================================================
// CREATE LOTTERY CONFIG (BULK — 19, 20, 21... sab)
// =====================================================
// ADMIN
//
// POST /api/lottery
//
// Body:
// {
//   "marketName": "Delhi Market",
//   "month": 9,
//   "year": 2026,
//   "prizes": { "first": 1000, "second": 500, "third": 100 }
// }
//
// Result:
// 19 Sept se 30 Sept tak ke saare configs ban jaayenge (inactive)
// Current date (18) skip ho jaayegi
// =====================================================

const createLotteryConfig = async (req, res) => {
  try {
    const { marketName, month, year, prizes } = req.body;

    // ==========================================
    // MARKET NAME
    // ==========================================
    if (!marketName || typeof marketName !== "string" || !marketName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Market name is required",
      });
    }

    // ==========================================
    // CURRENT MONTH + YEAR
    // ==========================================
    const current = getCurrentMonthYear();

    const selectedMonth =
      month !== undefined ? Number(month) : current.month;
    const selectedYear =
      year !== undefined ? Number(year) : current.year;

    // ==========================================
    // VALIDATE MONTH
    // ==========================================
    const monthValidation = validateMonth(selectedMonth);
    if (!monthValidation.valid) {
      return res.status(400).json({
        success: false,
        message: monthValidation.message,
      });
    }

    // ==========================================
    // VALIDATE YEAR
    // ==========================================
    const yearValidation = validateYear(selectedYear);
    if (!yearValidation.valid) {
      return res.status(400).json({
        success: false,
        message: yearValidation.message,
      });
    }

    // ==========================================
    // VALIDATE PRIZES
    // ==========================================
    if (!prizes || typeof prizes !== "object") {
      return res.status(400).json({
        success: false,
        message: "Prize amounts are required",
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

    // ==========================================
    // TOTAL DAYS IN SELECTED MONTH
    // ==========================================
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

    // ==========================================
    // DECIDE START DAY
    // Agar current month/year hai to aaj ke baad se
    // Warna 1st se (future month case)
    // ==========================================
    const today = new Date();
    const isCurrentMonthYear =
      today.getMonth() + 1 === selectedMonth &&
      today.getFullYear() === selectedYear;

    const startDay = isCurrentMonthYear ? today.getDate() + 1 : 1;

    if (startDay > totalDays) {
      return res.status(400).json({
        success: false,
        message: "Is month ki koi future date nahi bachi",
      });
    }

    // ==========================================
    // CHECK EXISTING CONFIGS
    // ==========================================
    const existingConfigs = await LotteryConfig.find({
      marketName: marketName.trim(),
      month: selectedMonth,
      year: selectedYear,
    }).select("date");

    const existingDates = new Set(existingConfigs.map((c) => c.date));

    // ==========================================
    // BUILD BULK INSERT DOCS
    // ==========================================
    const docsToInsert = [];
    for (let day = startDay; day <= totalDays; day++) {
      if (existingDates.has(day)) continue;

      docsToInsert.push({
        marketName: marketName.trim(),
        date: day,
        month: selectedMonth,
        year: selectedYear,
        prizes: {
          first: firstPrize,
          second: secondPrize,
          third: thirdPrize,
        },
        users: [],
        isActive: false, // sab inactive
      });
    }

    if (docsToInsert.length === 0) {
      return res.status(409).json({
        success: false,
        message: "Is market ke saare dates already exist karte hain",
      });
    }

    const createdConfigs = await LotteryConfig.insertMany(docsToInsert);

    // ==========================================
    // RESPONSE
    // ==========================================
    return res.status(201).json({
      success: true,
      message: `${createdConfigs.length} lottery configs created successfully`,
      totalCreated: createdConfigs.length,
      startDay,
      endDay: totalDays,
      data: createdConfigs,
    });
  } catch (error) {
    console.error("Create lottery config error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Kuch dates already exist karti hain",
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
// =====================================================
// USER
//
// POST /api/lottery/entry
//
// Body: { "number": "123456", "amount": 100 }
//
// Logic:
// - Aaj ki date ka ACTIVE config dhoondo
// - Usme user entry push karo
// =====================================================

const addUserLotteryEntry = async (req, res) => {
  try {
    const { number, amount } = req.body;

    // ==========================================
    // USER ID
    // ==========================================
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // ==========================================
    // VALIDATE NUMBER
    // ==========================================
    const numberValidation = validateNumber(number);
    if (!numberValidation.valid) {
      return res.status(400).json({
        success: false,
        message: numberValidation.message,
      });
    }

    // ==========================================
    // VALIDATE AMOUNT
    // ==========================================
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      return res.status(400).json({
        success: false,
        message: amountValidation.message,
      });
    }

    // ==========================================
    // CURRENT DATE + MONTH + YEAR
    // ==========================================
    const entryDate = getCurrentDate();
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // ==========================================
    // FIND ACTIVE CONFIG FOR TODAY
    // ==========================================
    const config = await LotteryConfig.findOne({
      isActive: true,
      date: currentDay,
      month: currentMonth,
      year: currentYear,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "No active lottery market found for today",
      });
    }

    // ==========================================
    // CHECK SAME USER + SAME DATE
    // ==========================================
    const existingUser = config.users.find(
      (user) =>
        String(user.userId) === String(userId) &&
        user.entryDate === entryDate
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "You already have a lottery entry for today",
        data: existingUser,
      });
    }

    // ==========================================
    // ADD USER ENTRY
    // ==========================================
    config.users.push({
      userId: String(userId),
      entryDate,
      amount: amountValidation.amount,
      number: numberValidation.number,
      status: "pending",
    });

    await config.save();

    const newEntry = config.users[config.users.length - 1];

    // ==========================================
    // RESPONSE
    // ==========================================
    return res.status(201).json({
      success: true,
      message: "Lottery entry submitted successfully",
      data: {
        lotteryId: config._id,
        marketName: config.marketName,
        date: config.date,
        month: config.month,
        year: config.year,
        entryDate,
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
// USER
//
// GET /api/lottery/my-entries
//
// Saari dates ke configs se user ki entries nikaal kar deta hai
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

    // Saare configs jisme ye user hai
    const configs = await LotteryConfig.find({
      "users.userId": String(userId),
    }).sort({ year: -1, month: -1, date: -1 });

    const allEntries = [];

    configs.forEach((config) => {
      config.users
        .filter((entry) => String(entry.userId) === String(userId))
        .forEach((entry) => {
          allEntries.push({
            lotteryId: config._id,
            marketName: config.marketName,
            date: config.date,
            month: config.month,
            year: config.year,
            isActive: config.isActive,
            entry,
          });
        });
    });

    // Latest first
    allEntries.sort(
      (a, b) => new Date(b.entry.entryDate) - new Date(a.entry.entryDate)
    );

    return res.status(200).json({
      success: true,
      message: "User lottery entries fetched successfully",
      totalEntries: allEntries.length,
      data: allEntries,
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
// ADMIN
//
// GET /api/lottery
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
// GET ACTIVE LOTTERY CONFIG (AAJ KA)
// =====================================================
//
// GET /api/lottery/active
// =====================================================

const getActiveLotteryConfig = async (req, res) => {
  try {
    const config = await LotteryConfig.findOne({
      isActive: true,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "No active lottery configuration found",
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
// GET LOTTERY CONFIG BY ID
// =====================================================
//
// GET /api/lottery/:id
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
// ACTIVATE LOTTERY CONFIG
// =====================================================
//
// PUT /api/lottery/:id/activate
//
// Sirf us date ka config activate karta hai
// (baaki dates apne aap inactive rahenge)
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

    // ==========================================
    // DEACTIVATE ALL OTHER (sirf same market/month/year)
    // ==========================================
    await LotteryConfig.updateMany(
      {
        marketName: config.marketName,
        month: config.month,
        year: config.year,
        isActive: true,
        _id: { $ne: id },
      },
      {
        $set: { isActive: false },
      }
    );

    // ==========================================
    // ACTIVATE
    // ==========================================
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
// DEACTIVATE LOTTERY CONFIG
// =====================================================
//
// PUT /api/lottery/:id/deactivate
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
      message: "Lottery configuration deactivated successfully",
      data: config,
    });
  } catch (error) {
    console.error("Deactivate lottery config error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE USER LOTTERY ENTRY
// =====================================================
// ADMIN
//
// PUT /api/lottery/:id/user/:userEntryId
// =====================================================

const updateUserLotteryEntry = async (req, res) => {
  try {
    const { id, userEntryId } = req.params;
    const { number, amount, status, entryDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userEntryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user lottery entry ID",
      });
    }

    const config = await LotteryConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
      });
    }

    const userEntry = config.users.id(userEntryId);
    if (!userEntry) {
      return res.status(404).json({
        success: false,
        message: "User lottery entry not found",
      });
    }

    // UPDATE NUMBER
    if (number !== undefined) {
      const validation = validateNumber(number);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }
      userEntry.number = validation.number;
    }

    // UPDATE AMOUNT
    if (amount !== undefined) {
      const validation = validateAmount(amount);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }
      userEntry.amount = validation.amount;
    }

    // UPDATE STATUS
    if (status !== undefined) {
      const validation = validateStatus(status);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }
      userEntry.status = validation.status;
    }

    // UPDATE DATE
    if (entryDate !== undefined) {
      if (
        typeof entryDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Entry date must be in YYYY-MM-DD format",
        });
      }
      userEntry.entryDate = entryDate;
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "User lottery entry updated successfully",
      data: config,
    });
  } catch (error) {
    console.error("Update user lottery entry error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE USER LOTTERY ENTRY
// =====================================================
//
// DELETE /api/lottery/:id/user/:userEntryId
// =====================================================

const deleteUserLotteryEntry = async (req, res) => {
  try {
    const { id, userEntryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userEntryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user lottery entry ID",
      });
    }

    const config = await LotteryConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
      });
    }

    const userEntry = config.users.id(userEntryId);
    if (!userEntry) {
      return res.status(404).json({
        success: false,
        message: "User lottery entry not found",
      });
    }

    userEntry.deleteOne();
    await config.save();

    return res.status(200).json({
      success: true,
      message: "User lottery entry deleted successfully",
      data: config,
    });
  } catch (error) {
    console.error("Delete user lottery entry error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE LOTTERY CONFIG
// =====================================================
//
// DELETE /api/lottery/:id
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

    const config = await LotteryConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery configuration not found",
      });
    }

    await LotteryConfig.findByIdAndDelete(id);

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
  getAllLotteryConfigs,
  getLotteryConfigById,
  getActiveLotteryConfig,
  activateLotteryConfig,
  deactivateLotteryConfig,
  updateUserLotteryEntry,
  deleteUserLotteryEntry,
  deleteLotteryConfig,
  getMyLotteryEntries,
};