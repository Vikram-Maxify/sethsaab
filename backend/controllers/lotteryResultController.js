const mongoose = require("mongoose");
const LotteryResult = require("../models/LotteryResult");
const LotteryConfig = require("../models/LotteryConfig");

// =====================================================
// VALIDATE 6 DIGIT NUMBER
// =====================================================

const validateSixDigitNumber = (number) => {
  if (number === undefined || number === null) {
    return false;
  }

  const value = String(number);

  return /^\d{6}$/.test(value);
};

// =====================================================
// GET PRIZE
// =====================================================

const getPrize = (userNumber, winningNumber) => {
  userNumber = String(userNumber);
  winningNumber = String(winningNumber);

  // ==========================================
  // 1ST PRIZE
  // All 6 digits exactly same
  // ==========================================

  if (userNumber === winningNumber) {
    return {
      prize: "1st",
      matchedDigits: 6,
    };
  }

  // ==========================================
  // 2ND PRIZE
  // First 5 same OR last 5 same
  // ==========================================

  const firstFiveMatch =
    userNumber.substring(0, 5) ===
    winningNumber.substring(0, 5);

  const lastFiveMatch =
    userNumber.substring(1, 6) ===
    winningNumber.substring(1, 6);

  if (firstFiveMatch || lastFiveMatch) {
    return {
      prize: "2nd",
      matchedDigits: 5,
    };
  }

  // ==========================================
  // 3RD PRIZE
  // First 4 OR middle 4 OR last 4
  // ==========================================

  const firstFourMatch =
    userNumber.substring(0, 4) ===
    winningNumber.substring(0, 4);

  const middleFourMatch =
    userNumber.substring(1, 5) ===
    winningNumber.substring(1, 5);

  const lastFourMatch =
    userNumber.substring(2, 6) ===
    winningNumber.substring(2, 6);

  if (
    firstFourMatch ||
    middleFourMatch ||
    lastFourMatch
  ) {
    return {
      prize: "3rd",
      matchedDigits: 4,
    };
  }

  // ==========================================
  // NO PRIZE
  // ==========================================

  return null;
};

// =====================================================
// CREATE RESULT
// ADMIN
// =====================================================

const createResult = async (req, res) => {
  try {
    const {
      lotteryConfigId,
      date,
      winningNumber,
    } = req.body;

    // ------------------------------------------
    // ADMIN USER ID FROM JWT
    // ------------------------------------------

    const adminId = req.user?.uuid;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin ID not found in token",
      });
    }

    // ------------------------------------------
    // VALIDATE CONFIG ID
    // ------------------------------------------

    if (
      !lotteryConfigId ||
      !mongoose.Types.ObjectId.isValid(lotteryConfigId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid lotteryConfigId is required",
      });
    }

    // ------------------------------------------
    // VALIDATE DATE
    // ------------------------------------------

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const resultDate = new Date(date);

    if (isNaN(resultDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    // ------------------------------------------
    // VALIDATE WINNING NUMBER
    // ------------------------------------------

    if (!validateSixDigitNumber(winningNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "Winning number must contain exactly 6 digits",
      });
    }

    // ------------------------------------------
    // FIND LOTTERY CONFIG
    // ------------------------------------------

    const config = await LotteryConfig.findById(
      lotteryConfigId
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Lottery config not found",
      });
    }

    // ------------------------------------------
    // CHECK DATE EXISTS IN CONFIG
    // ------------------------------------------

    const configDate = config.dates.find((item) => {
      const itemDate = new Date(item.date);

      return (
        itemDate.getFullYear() ===
          resultDate.getFullYear() &&
        itemDate.getMonth() ===
          resultDate.getMonth() &&
        itemDate.getDate() ===
          resultDate.getDate()
      );
    });

    if (!configDate) {
      return res.status(404).json({
        success: false,
        message:
          "Selected date does not exist in this lottery config",
      });
    }

    // ------------------------------------------
    // CHECK RESULT ALREADY EXISTS
    // ------------------------------------------

    const existingResult =
      await LotteryResult.findOne({
        lotteryConfigId,
        date: configDate.date,
      });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message:
          "Result already exists for this date",
      });
    }

    // ------------------------------------------
    // CREATE RESULT
    // ------------------------------------------

    const result = await LotteryResult.create({
      lotteryConfigId,
      date: configDate.date,
      winningNumber: String(winningNumber),
      winners: [],
      isPublished: false,
      createdBy: adminId,
    });

    return res.status(201).json({
      success: true,
      message: "Lottery result created successfully",
      result,
    });
  } catch (error) {
    console.error(
      "Create Result Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Result already exists for this date",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// GET ALL RESULTS
// ADMIN
// =====================================================

const getAllResults = async (req, res) => {
  try {
    const results = await LotteryResult.find()
      .populate(
        "lotteryConfigId",
        "month year isActive"
      )
      .sort({
        date: -1,
      });

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error(
      "Get All Results Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// GET RESULT BY ID
// =====================================================

const getResultById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    const result = await LotteryResult.findById(
      id
    ).populate(
      "lotteryConfigId",
      "month year isActive"
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(
      "Get Result Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// PUBLISH RESULT
// ADMIN
// =====================================================

const publishResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    const result =
      await LotteryResult.findByIdAndUpdate(
        id,
        {
          $set: {
            isPublished: true,
          },
        },
        {
          new: true,
        }
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Result published successfully",
      result,
    });
  } catch (error) {
    console.error(
      "Publish Result Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// UNPUBLISH RESULT
// ADMIN
// =====================================================

const unpublishResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    const result =
      await LotteryResult.findByIdAndUpdate(
        id,
        {
          $set: {
            isPublished: false,
          },
        },
        {
          new: true,
        }
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Result unpublished successfully",
      result,
    });
  } catch (error) {
    console.error(
      "Unpublish Result Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// UPDATE RESULT
// ADMIN
// =====================================================

const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { winningNumber } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    if (
      winningNumber !== undefined &&
      !validateSixDigitNumber(winningNumber)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Winning number must contain exactly 6 digits",
      });
    }

    const result =
      await LotteryResult.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    // Published result ko directly change
    // karne se pehle unpublish karna better hai
    if (result.isPublished) {
      return res.status(400).json({
        success: false,
        message:
          "Published result cannot be edited. Unpublish it first.",
      });
    }

    if (winningNumber !== undefined) {
      result.winningNumber =
        String(winningNumber);

      // Winning number change hone par
      // old winners invalid ho sakte hain
      result.winners = [];
    }

    await result.save();

    return res.status(200).json({
      success: true,
      message: "Result updated successfully",
      result,
    });
  } catch (error) {
    console.error(
      "Update Result Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// DELETE RESULT
// ADMIN
// =====================================================

const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    const result =
      await LotteryResult.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    if (result.isPublished) {
      return res.status(400).json({
        success: false,
        message:
          "Published result cannot be deleted",
      });
    }

    await LotteryResult.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Result deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Result Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// TEST MATCHING
// Optional helper endpoint
// =====================================================

const checkNumber = async (req, res) => {
  try {
    const {
      userNumber,
      winningNumber,
    } = req.body;

    if (
      !validateSixDigitNumber(userNumber) ||
      !validateSixDigitNumber(winningNumber)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Both numbers must contain exactly 6 digits",
      });
    }

    const result = getPrize(
      String(userNumber),
      String(winningNumber)
    );

    return res.status(200).json({
      success: true,
      userNumber: String(userNumber),
      winningNumber: String(winningNumber),
      winner: result !== null,
      result,
    });
  } catch (error) {
    console.error(
      "Check Number Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createResult,
  getAllResults,
  getResultById,
  publishResult,
  unpublishResult,
  updateResult,
  deleteResult,
  checkNumber,
  getPrize,
};