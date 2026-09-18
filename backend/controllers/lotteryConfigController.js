const mongoose = require("mongoose");

const LotteryConfig = require("../models/LotteryConfig");

// =====================================================
// VALIDATE 6 LOTTERY NUMBERS
// =====================================================

const validateNumbers = (numbers) => {
  if (!Array.isArray(numbers)) {
    return {
      valid: false,
      message: "numbers must be an array",
    };
  }

  if (numbers.length !== 6) {
    return {
      valid: false,
      message: "Exactly 6 lottery numbers are required",
    };
  }

  const convertedNumbers = numbers.map(Number);

  if (
    convertedNumbers.some(
      (number) =>
        !Number.isInteger(number) ||
        number < 1 ||
        number > 99
    )
  ) {
    return {
      valid: false,
      message:
        "Each lottery number must be between 1 and 99",
    };
  }

  if (new Set(convertedNumbers).size !== 6) {
    return {
      valid: false,
      message:
        "Lottery numbers must be unique",
    };
  }

  return {
    valid: true,
    numbers: convertedNumbers,
  };
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
    return {
      valid: false,
      message: "Valid amount is required",
    };
  }

  if (Number(amount) < 0) {
    return {
      valid: false,
      message: "Amount cannot be negative",
    };
  }

  return {
    valid: true,
    amount: Number(amount),
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
      message:
        "Status must be pending, win or lost",
    };
  }

  return {
    valid: true,
    status,
  };
};

// =====================================================
// CREATE MONTHLY LOTTERY CONFIG
// =====================================================

const createLotteryConfig = async (req, res) => {
  try {
    const {
      month,
      year,
    } = req.body;

    // ==========================================
    // USER ID FROM JWT
    // ==========================================

    const userId =
      req.user?.uuid ||
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // ==========================================
    // CURRENT DATE
    // ==========================================

    const now = new Date();

    const selectedMonth =
      month !== undefined
        ? Number(month)
        : now.getMonth() + 1;

    const selectedYear =
      year !== undefined
        ? Number(year)
        : now.getFullYear();

    // ==========================================
    // VALIDATE MONTH
    // ==========================================

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

    // ==========================================
    // VALIDATE YEAR
    // ==========================================

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid year is required",
      });
    }

    // ==========================================
    // CHECK EXISTING CONFIG
    // ==========================================

    const existingConfig =
      await LotteryConfig.findOne({
        userId: String(userId),
        month: selectedMonth,
        year: selectedYear,
      });

    if (existingConfig) {
      return res.status(409).json({
        success: false,
        message:
          "Lottery configuration for this month already exists",
      });
    }

    // ==========================================
    // GET DAYS IN MONTH
    // ==========================================

    const daysInMonth = new Date(
      selectedYear,
      selectedMonth,
      0
    ).getDate();

    // ==========================================
    // CREATE DATE OBJECTS
    // ==========================================

    const dates = [];

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      dates.push({
        date: new Date(
          selectedYear,
          selectedMonth - 1,
          day
        ),

        // Initially no users
        users: [],
      });
    }

    // ==========================================
    // CREATE CONFIG
    // ==========================================

    const config =
      await LotteryConfig.create({
        userId: String(userId),
        month: selectedMonth,
        year: selectedYear,
        dates,
        isActive: false,
      });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message:
        "Monthly lottery configuration created successfully",

      data: config,
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
          "Lottery configuration already exists",
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
// ADD USER LOTTERY ENTRY TO DATE
// =====================================================

const addUserLotteryEntry = async (req, res) => {
  try {
    const {
      id,
      dateId,
    } = req.params;

    const {
      numbers,
      amount,
    } = req.body;

    // ==========================================
    // USER ID FROM JWT
    // ==========================================

    const userId =
      req.user?.uuid ||
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // ==========================================
    // VALIDATE CONFIG ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    // ==========================================
    // FIND CONFIG
    // ==========================================

    const config =
      await LotteryConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    // ==========================================
    // FIND DATE
    // ==========================================

    const dateObject =
      config.dates.id(dateId);

    if (!dateObject) {
      return res.status(404).json({
        success: false,
        message: "Date object not found",
      });
    }

    // ==========================================
    // VALIDATE NUMBERS
    // ==========================================

    const numbersValidation =
      validateNumbers(numbers);

    if (!numbersValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          numbersValidation.message,
      });
    }

    // ==========================================
    // VALIDATE AMOUNT
    // ==========================================

    const amountValidation =
      validateAmount(amount);

    if (!amountValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          amountValidation.message,
      });
    }

    // ==========================================
    // CHECK SAME USER ALREADY ENTERED
    // FOR THIS DATE
    // ==========================================

    const existingUser =
      dateObject.users.find(
        (user) =>
          String(user.userId) ===
          String(userId)
      );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "This user already has a lottery entry for this date",
      });
    }

    // ==========================================
    // ADD USER
    // ==========================================

    dateObject.users.push({
      userId: String(userId),

      numbers:
        numbersValidation.numbers,

      amount:
        amountValidation.amount,

      status: "pending",
    });

    // ==========================================
    // SAVE
    // ==========================================

    await config.save();

    return res.status(201).json({
      success: true,
      message:
        "User lottery entry added successfully",

      data: config,
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
// GET ALL LOTTERY CONFIGS
// =====================================================

const getAllLotteryConfigs = async (
  req,
  res
) => {
  try {
    const configs =
      await LotteryConfig.find().sort({
        year: -1,
        month: -1,
      });

    return res.status(200).json({
      success: true,
      count: configs.length,
      data: configs,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ACTIVE LOTTERY CONFIG
// =====================================================

const getActiveLotteryConfig = async (
  req,
  res
) => {
  try {
    const config =
      await LotteryConfig.findOne({
        isActive: true,
      });

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
    console.error(error);

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

const getLotteryConfigById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

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
          "Configuration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error(error);

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

const activateLotteryConfig = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

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
          "Configuration not found",
      });
    }

    // ==========================================
    // DEACTIVATE ALL OTHER CONFIGS
    // ==========================================

    await LotteryConfig.updateMany(
      {
        isActive: true,
        _id: {
          $ne: id,
        },
      },
      {
        $set: {
          isActive: false,
        },
      }
    );

    // ==========================================
    // ACTIVATE SELECTED
    // ==========================================

    config.isActive = true;

    await config.save();

    return res.status(200).json({
      success: true,
      message:
        "Lottery configuration activated",
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
// =====================================================

const deactivateLotteryConfig = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

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
          "Configuration not found",
      });
    }

    config.isActive = false;

    await config.save();

    return res.status(200).json({
      success: true,
      message:
        "Lottery configuration deactivated",
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
// UPDATE USER LOTTERY ENTRY
// =====================================================

const updateUserLotteryEntry = async (
  req,
  res
) => {
  try {
    const {
      id,
      dateId,
      userEntryId,
    } = req.params;

    const {
      numbers,
      amount,
      status,
    } = req.body;

    // ==========================================
    // VALIDATE CONFIG ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid configuration ID",
      });
    }

    // ==========================================
    // FIND CONFIG
    // ==========================================

    const config =
      await LotteryConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "Configuration not found",
      });
    }

    // ==========================================
    // FIND DATE
    // ==========================================

    const dateObject =
      config.dates.id(dateId);

    if (!dateObject) {
      return res.status(404).json({
        success: false,
        message:
          "Date object not found",
      });
    }

    // ==========================================
    // FIND USER ENTRY
    // ==========================================

    const userEntry =
      dateObject.users.id(
        userEntryId
      );

    if (!userEntry) {
      return res.status(404).json({
        success: false,
        message:
          "User lottery entry not found",
      });
    }

    // ==========================================
    // UPDATE NUMBERS
    // ==========================================

    if (numbers !== undefined) {
      const numbersValidation =
        validateNumbers(numbers);

      if (!numbersValidation.valid) {
        return res.status(400).json({
          success: false,
          message:
            numbersValidation.message,
        });
      }

      userEntry.numbers =
        numbersValidation.numbers;
    }

    // ==========================================
    // UPDATE AMOUNT
    // ==========================================

    if (amount !== undefined) {
      const amountValidation =
        validateAmount(amount);

      if (!amountValidation.valid) {
        return res.status(400).json({
          success: false,
          message:
            amountValidation.message,
        });
      }

      userEntry.amount =
        amountValidation.amount;
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    if (status !== undefined) {
      const statusValidation =
        validateStatus(status);

      if (!statusValidation.valid) {
        return res.status(400).json({
          success: false,
          message:
            statusValidation.message,
        });
      }

      userEntry.status =
        statusValidation.status;
    }

    // ==========================================
    // SAVE
    // ==========================================

    await config.save();

    return res.status(200).json({
      success: true,
      message:
        "User lottery entry updated successfully",
      data: config,
    });
  } catch (error) {
    console.error(
      "Update user lottery entry error:",
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
// DELETE USER LOTTERY ENTRY
// =====================================================

const deleteUserLotteryEntry = async (
  req,
  res
) => {
  try {
    const {
      id,
      dateId,
      userEntryId,
    } = req.params;

    // ==========================================
    // VALIDATE CONFIG ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid configuration ID",
      });
    }

    // ==========================================
    // FIND CONFIG
    // ==========================================

    const config =
      await LotteryConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "Configuration not found",
      });
    }

    // ==========================================
    // FIND DATE
    // ==========================================

    const dateObject =
      config.dates.id(dateId);

    if (!dateObject) {
      return res.status(404).json({
        success: false,
        message:
          "Date object not found",
      });
    }

    // ==========================================
    // FIND USER ENTRY
    // ==========================================

    const userEntry =
      dateObject.users.id(
        userEntryId
      );

    if (!userEntry) {
      return res.status(404).json({
        success: false,
        message:
          "User lottery entry not found",
      });
    }

    // ==========================================
    // DELETE
    // ==========================================

    userEntry.deleteOne();

    await config.save();

    return res.status(200).json({
      success: true,
      message:
        "User lottery entry deleted successfully",
      data: config,
    });
  } catch (error) {
    console.error(
      "Delete user lottery entry error:",
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
// DELETE MONTHLY CONFIG
// =====================================================

const deleteLotteryConfig = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

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
          "Configuration not found",
      });
    }

    await LotteryConfig.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Lottery configuration deleted successfully",
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

  getAllLotteryConfigs,

  getLotteryConfigById,

  getActiveLotteryConfig,

  activateLotteryConfig,

  deactivateLotteryConfig,

  updateUserLotteryEntry,

  deleteUserLotteryEntry,

  deleteLotteryConfig,
};