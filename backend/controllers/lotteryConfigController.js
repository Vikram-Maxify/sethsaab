const mongoose = require("mongoose");
const LotteryConfig = require("../models/LotteryConfig");

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
  // Past date ticket create nahi hoga.
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
//   "drawDate": "2026-09-20",
//   "drawTime": "18:30",
//   "prizes": {
//      "first": 500000,
//      "second": 100000,
//      "third": 50000
//   }
// }
//
// IMPORTANT:
// Sirf ek date create hogi.
// Future dates automatically create nahi hongi.
// =====================================================

const createLotteryConfig = async (req, res) => {
  try {
    const {
      marketName,
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

    // ================================================
    // FIRST PRIZE
    // ================================================

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

    // ================================================
    // SECOND PRIZE
    // ================================================

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

    // ================================================
    // THIRD PRIZE
    // ================================================

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

    // ================================================
    // PRIZE NUMBER VALIDATION
    // ================================================

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

    // ================================================
    // DUPLICATE KEY
    // ================================================

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
//   "number": "123456",
//   "amount": 100
// }
//
// User sirf ACTIVE lottery mein ticket buy karega.
// =====================================================

const addUserLotteryEntry = async (req, res) => {
  try {
    const {
      number,
      amount,
    } = req.body;

    // ================================================
    // USER ID
    // ================================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // ================================================
    // NUMBER VALIDATION
    // ================================================

    const numberValidation =
      validateNumber(number);

    if (!numberValidation.valid) {
      return res.status(400).json({
        success: false,
        message: numberValidation.message,
      });
    }

    // ================================================
    // AMOUNT VALIDATION
    // ================================================

    const amountValidation =
      validateAmount(amount);

    if (!amountValidation.valid) {
      return res.status(400).json({
        success: false,
        message: amountValidation.message,
      });
    }

    // ================================================
    // GET ACTIVE LOTTERY
    //
    // Nearest upcoming active lottery
    // ================================================

    const now = new Date();

    const config = await LotteryConfig.findOne({
      isActive: true,

      drawDate: {
        $gte: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ),
      },
    }).sort({
      drawDate: 1,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "No active lottery ticket available",
      });
    }

    // ================================================
    // DRAW DATE STRING
    // ================================================

    const dateString =
      formatDateString(config.drawDate);

    if (!dateString) {
      return res.status(500).json({
        success: false,
        message:
          "Invalid draw date in lottery configuration",
      });
    }

    // ================================================
    // CHECK DRAW DATE
    // ================================================

    const todayString =
      getTodayDateString();

    if (dateString !== todayString) {
      return res.status(400).json({
        success: false,
        message:
          "Lottery ticket is not available for today",
        drawDate: dateString,
        drawTime: config.drawTime,
      });
    }

    // ================================================
    // CHECK DRAW TIME
    //
    // Ticket draw time ke baad buy nahi hoga.
    // ================================================

    const [
      drawHour,
      drawMinute,
    ] = config.drawTime
      .split(":")
      .map(Number);

    const drawDateTime = new Date(
      config.drawDate
    );

    drawDateTime.setHours(
      drawHour,
      drawMinute,
      0,
      0
    );

    if (now >= drawDateTime) {
      return res.status(400).json({
        success: false,
        message:
          "Lottery ticket sale time has ended",
        drawDate: dateString,
        drawTime: config.drawTime,
      });
    }

    // ================================================
    // SAFETY
    // ================================================

    if (!Array.isArray(config.users)) {
      config.users = [];
    }

    // ================================================
    // CHECK EXISTING ENTRY
    // ================================================

    const existingEntry =
      config.users.find(
        (entry) =>
          String(entry.userId) ===
            String(userId) &&
          entry.entryDate ===
            dateString
      );

    if (existingEntry) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a lottery entry for this draw",
        data: existingEntry,
      });
    }

    // ================================================
    // ADD ENTRY
    // ================================================

    config.users.push({
      userId: String(userId),

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

    // ================================================
    // SAVE
    // ================================================

    await config.save();

    // ================================================
    // GET NEW ENTRY
    // ================================================

    const newEntry =
      config.users[
        config.users.length - 1
      ];

    // ================================================
    // RESPONSE
    // ================================================

    return res.status(201).json({
      success: true,

      message:
        "Lottery entry submitted successfully",

      data: {
        lotteryId: config._id,

        marketName:
          config.marketName,

        drawDate:
          dateString,

        drawTime:
          config.drawTime,

        isActive:
          config.isActive,

        entryDate:
          dateString,

        entry:
          newEntry,
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

const getMyLotteryEntries = async (
  req,
  res
) => {
  try {
    // ================================================
    // USER ID
    // ================================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID not found in token",
      });
    }

    // ================================================
    // GET CONFIGS
    // ================================================

    const configs =
      await LotteryConfig.find({
        "users.userId":
          String(userId),
      })
        .sort({
          drawDate: -1,
        })
        .lean();

    // ================================================
    // PREPARE ENTRIES
    // ================================================

    const entries = [];

    configs.forEach((config) => {
      if (!Array.isArray(config.users)) {
        return;
      }

      config.users
        .filter(
          (entry) =>
            String(entry.userId) ===
            String(userId)
        )
        .forEach((entry) => {
          entries.push({
            lotteryId:
              config._id,

            entryId:
              entry._id,

            marketName:
              config.marketName,

            drawDate:
              config.drawDate,

            drawTime:
              config.drawTime,

            isActive:
              config.isActive,

            prizes:
              config.prizes,

            entry: {
              _id:
                entry._id,

              userId:
                entry.userId,

              entryDate:
                entry.entryDate,

              number:
                entry.number,

              amount:
                entry.amount,

              isBuy:
                entry.isBuy,

              prize: {
                first:
                  entry.prize?.first ||
                  0,

                second:
                  entry.prize?.second ||
                  0,

                third:
                  entry.prize?.third ||
                  0,
              },

              prizeType:
                entry.prizeType ||
                null,

              status:
                entry.status ||
                "pending",

              createdAt:
                entry.createdAt,

              updatedAt:
                entry.updatedAt,
            },
          });
        });
    });

    // ================================================
    // SORT
    // ================================================

    entries.sort(
      (a, b) =>
        new Date(b.drawDate) -
        new Date(a.drawDate)
    );

    // ================================================
    // RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,

      message:
        "User lottery entries fetched successfully",

      totalEntries:
        entries.length,

      data:
        entries,
    });
  } catch (error) {
    console.error(
      "Get my lottery entries error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL LOTTERY CONFIGS
// ADMIN
// =====================================================

const getAllLotteryConfigs = async (
  req,
  res
) => {
  try {
    const configs =
      await LotteryConfig.find()
        .sort({
          drawDate: -1,
        });

    return res.status(200).json({
      success: true,

      count:
        configs.length,

      data:
        configs,
    });
  } catch (error) {
    console.error(
      "Get all lottery configs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ACTIVE LOTTERY
// =====================================================

const getActiveLotteryConfig = async (
  req,
  res
) => {
  try {
    const now = new Date();

    // ================================================
    // ONLY TODAY/FUTURE ACTIVE LOTTERY
    // ================================================

    const configs =
      await LotteryConfig.find({
        isActive: true,

        drawDate: {
          $gte: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          ),
        },
      })
        .sort({
          drawDate: 1,
        })
        .limit(1);

    const config =
      configs[0];

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
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET CONFIG BY ID
// =====================================================

const getLotteryConfigById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid configuration ID",
      });
    }

    const config =
      await LotteryConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "Lottery configuration not found",
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
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// ACTIVATE CONFIG
// ADMIN
//
// PATCH /api/lottery/:id/activate
//
// IMPORTANT:
// Ek time par sirf ONE active lottery.
// =====================================================

const activateLotteryConfig = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid configuration ID",
      });
    }

    const config =
      await LotteryConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "Lottery configuration not found",
      });
    }

    // ================================================
    // CHECK DATE
    // ================================================

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const lotteryDate =
      new Date(config.drawDate);

    lotteryDate.setHours(
      0,
      0,
      0,
      0
    );

    if (lotteryDate < today) {
      return res.status(400).json({
        success: false,
        message:
          "Past lottery cannot be activated",
      });
    }

    // ================================================
    // DEACTIVATE ALL OTHER LOTTERIES
    // ================================================

    await LotteryConfig.updateMany(
      {
        _id: {
          $ne: config._id,
        },
        isActive: true,
      },
      {
        $set: {
          isActive: false,
        },
      }
    );

    // ================================================
    // ACTIVATE SELECTED
    // ================================================

    config.isActive = true;

    await config.save();

    return res.status(200).json({
      success: true,

      message:
        "Lottery configuration activated successfully",

      data:
        config,
    });
  } catch (error) {
    console.error(
      "Activate lottery config error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// DEACTIVATE CONFIG
// ADMIN
// =====================================================

const deactivateLotteryConfig = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid configuration ID",
      });
    }

    const config =
      await LotteryConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "Lottery configuration not found",
      });
    }

    config.isActive = false;

    await config.save();

    return res.status(200).json({
      success: true,

      message:
        "Lottery configuration deactivated successfully",

      data:
        config,
    });
  } catch (error) {
    console.error(
      "Deactivate lottery config error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE USER ENTRY STATUS
// ADMIN
//
// PATCH /api/lottery/:configId/entry/:entryId/status
//
// BODY:
//
// {
//   "status": "win",
//   "prizeType": "1st",
//   "prize": {
//      "first": 500000,
//      "second": 0,
//      "third": 0
//   }
// }
// =====================================================

const updateEntryStatus = async (
  req,
  res
) => {
  try {
    const {
      configId,
      entryId,
    } = req.params;

    const {
      status,
      prizeType,
      prize,
    } = req.body;

    // ================================================
    // CONFIG ID
    // ================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        configId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid configuration ID",
      });
    }

    // ================================================
    // STATUS
    // ================================================

    const statusValidation =
      validateStatus(status);

    if (!statusValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          statusValidation.message,
      });
    }

    // ================================================
    // GET CONFIG
    // ================================================

    const config =
      await LotteryConfig.findById(
        configId
      );

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "Lottery configuration not found",
      });
    }

    // ================================================
    // GET ENTRY
    // ================================================

    const entry =
      config.users.id(entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message:
          "Lottery entry not found",
      });
    }

    // ================================================
    // UPDATE STATUS
    // ================================================

    entry.status =
      statusValidation.status;

    // ================================================
    // WIN
    // ================================================

    if (
      statusValidation.status ===
      "win"
    ) {
      if (
        prizeType &&
        ["1st", "2nd", "3rd"].includes(
          prizeType
        )
      ) {
        entry.prizeType =
          prizeType;
      }

      if (prize) {
        entry.prize = {
          first:
            Number(prize.first) ||
            0,

          second:
            Number(prize.second) ||
            0,

          third:
            Number(prize.third) ||
            0,
        };
      }
    }

    // ================================================
    // LOST
    // ================================================

    else if (
      statusValidation.status ===
      "lost"
    ) {
      entry.prizeType = null;

      entry.prize = {
        first: 0,
        second: 0,
        third: 0,
      };
    }

    // ================================================
    // PENDING
    // ================================================

    else if (
      statusValidation.status ===
      "pending"
    ) {
      entry.prizeType = null;

      entry.prize = {
        first: 0,
        second: 0,
        third: 0,
      };
    }

    // ================================================
    // SAVE
    // ================================================

    await config.save();

    return res.status(200).json({
      success: true,

      message:
        "Entry status updated successfully",

      data:
        entry,
    });
  } catch (error) {
    console.error(
      "Update entry status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE LOTTERY CONFIG
// ADMIN
// =====================================================

const deleteLotteryConfig = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid configuration ID",
      });
    }

    const config =
      await LotteryConfig.findByIdAndDelete(
        id
      );

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "Lottery configuration not found",
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
      message:
        "Internal server error",
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