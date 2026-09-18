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

  const value = String(number).trim();

  return /^\d{6}$/.test(value);
};

// =====================================================
// NORMALIZE DATE
// =====================================================

const normalizeDate = (date) => {
  if (!date) {
    return null;
  }

  const value = String(date).substring(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
};

// =====================================================
// GET DATE STRING
// =====================================================

const getDateString = (date) => {
  if (!date) {
    return null;
  }

  // Already YYYY-MM-DD
  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return date;
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().split("T")[0];
};

// =====================================================
// GET PRIZE
// =====================================================

const getPrize = (userNumber, winningNumber) => {
  const user = String(userNumber).trim();
  const winning = String(winningNumber).trim();

  // ==========================================
  // 1ST PRIZE
  // ALL 6 DIGITS SAME
  // ==========================================

  if (user === winning) {
    return {
      prize: "1st",
      matchedDigits: 6,
    };
  }

  // ==========================================
  // 2ND PRIZE
  // FIRST 5 OR LAST 5 SAME
  // ==========================================

  const firstFiveMatch =
    user.substring(0, 5) ===
    winning.substring(0, 5);

  const lastFiveMatch =
    user.substring(1, 6) ===
    winning.substring(1, 6);

  if (firstFiveMatch || lastFiveMatch) {
    return {
      prize: "2nd",
      matchedDigits: 5,
    };
  }

  // ==========================================
  // 3RD PRIZE
  // FIRST 4 OR MIDDLE 4 OR LAST 4
  // ==========================================

  const firstFourMatch =
    user.substring(0, 4) ===
    winning.substring(0, 4);

  const middleFourMatch =
    user.substring(1, 5) ===
    winning.substring(1, 5);

  const lastFourMatch =
    user.substring(2, 6) ===
    winning.substring(2, 6);

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
  // LOST
  // ==========================================

  return null;
};

// =====================================================
// GET PRIZE AMOUNTS FROM CONFIG
// =====================================================

const getPrizeAmounts = (config, configDate) => {
  /*
    Ye function multiple possible structures support karta hai.

    Example 1:
    config.prizes.first
    config.prizes.second
    config.prizes.third

    Example 2:
    config.prize.first
    config.prize.second
    config.prize.third

    Example 3:
    configDate.prizes.first
    configDate.prizes.second
    configDate.prizes.third

    Example 4:
    configDate.prize.first
    configDate.prize.second
    configDate.prize.third

    Agar tumhare schema me amount kisi aur field me hai,
    yahan easily add kar sakte ho.
  */

  const configPrize =
    config?.prizes ||
    config?.prize ||
    {};

  const datePrize =
    configDate?.prizes ||
    configDate?.prize ||
    {};

  const first =
    Number(
      datePrize.first ??
      datePrize.firstPrize ??
      configPrize.first ??
      configPrize.firstPrize ??
      0
    ) || 0;

  const second =
    Number(
      datePrize.second ??
      datePrize.secondPrize ??
      configPrize.second ??
      configPrize.secondPrize ??
      0
    ) || 0;

  const third =
    Number(
      datePrize.third ??
      datePrize.thirdPrize ??
      configPrize.third ??
      configPrize.thirdPrize ??
      0
    ) || 0;

  return {
    first,
    second,
    third,
  };
};

// =====================================================
// BUILD USER PRIZE
// =====================================================

const buildPrizeObject = (
  prizeType,
  prizeAmounts
) => {
  const prize = {
    first: 0,
    second: 0,
    third: 0,
  };

  if (prizeType === "1st") {
    prize.first = prizeAmounts.first;
  }

  if (prizeType === "2nd") {
    prize.second = prizeAmounts.second;
  }

  if (prizeType === "3rd") {
    prize.third = prizeAmounts.third;
  }

  return prize;
};

// =====================================================
// PROCESS USERS FOR DATE
// =====================================================

const processUsersForDate = ({
  config,
  selectedDate,
  winningNumber,
  prizeAmounts,
}) => {
  const winners = [];

  let firstPrizeCount = 0;
  let secondPrizeCount = 0;
  let thirdPrizeCount = 0;
  let lostCount = 0;

  // ==========================================
  // CHECK USERS ARRAY
  // ==========================================

  if (!Array.isArray(config.users)) {
    return {
      winners,
      totalUsers: 0,
      firstPrizeCount,
      secondPrizeCount,
      thirdPrizeCount,
      lostCount,
    };
  }

  // ==========================================
  // PROCESS ONLY SELECTED DATE USERS
  // ==========================================

  const dateUsers = config.users.filter(
    (user) => {
      return (
        getDateString(user.entryDate) ===
        selectedDate
      );
    }
  );

  // ==========================================
  // PROCESS EVERY USER
  // ==========================================

  for (const user of dateUsers) {
    const userNumber = String(
      user.number || ""
    ).trim();

    // ========================================
    // INVALID USER NUMBER
    // ========================================

    if (!validateSixDigitNumber(userNumber)) {
      user.status = "lost";

      user.prize = {
        first: 0,
        second: 0,
        third: 0,
      };

      user.prizeType = null;

      lostCount++;

      continue;
    }

    // ========================================
    // MATCH NUMBER
    // ========================================

    const match = getPrize(
      userNumber,
      winningNumber
    );

    // ========================================
    // LOST
    // ========================================

    if (!match) {
      user.status = "lost";

      user.prize = {
        first: 0,
        second: 0,
        third: 0,
      };

      user.prizeType = null;

      lostCount++;

      continue;
    }

    // ========================================
    // WIN
    // ========================================

    user.status = "win";

    user.prizeType = match.prize;

    user.prize = buildPrizeObject(
      match.prize,
      prizeAmounts
    );

    // ========================================
    // COUNT PRIZE
    // ========================================

    if (match.prize === "1st") {
      firstPrizeCount++;
    }

    if (match.prize === "2nd") {
      secondPrizeCount++;
    }

    if (match.prize === "3rd") {
      thirdPrizeCount++;
    }

    // ========================================
    // SAVE WINNER
    // ========================================

    winners.push({
      userId: user.userId,
      number: userNumber,
      amount: Number(user.amount) || 0,

      prizeType: match.prize,

      matchedDigits:
        match.matchedDigits,

      prize: {
        first: user.prize.first,
        second: user.prize.second,
        third: user.prize.third,
      },
    });
  }

  return {
    winners,
    totalUsers: dateUsers.length,

    firstPrizeCount,
    secondPrizeCount,
    thirdPrizeCount,

    lostCount,
  };
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

    // ==========================================
    // ADMIN ID FROM JWT
    // ==========================================

    const adminId =
      req.user?.uuid ||
      req.user?.id ||
      req.user?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message:
          "Admin ID not found in token",
      });
    }

    // ==========================================
    // VALIDATE CONFIG ID
    // ==========================================

    if (
      !lotteryConfigId ||
      !mongoose.Types.ObjectId.isValid(
        lotteryConfigId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid lotteryConfigId is required",
      });
    }

    // ==========================================
    // VALIDATE DATE
    // ==========================================

    const selectedDate =
      normalizeDate(date);

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message:
          "Valid date is required. Format: YYYY-MM-DD",
      });
    }

    // ==========================================
    // VALIDATE WINNING NUMBER
    // ==========================================

    if (
      !validateSixDigitNumber(
        winningNumber
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Winning number must contain exactly 6 digits",
      });
    }

    const finalWinningNumber =
      String(winningNumber).trim();

    // ==========================================
    // FIND LOTTERY CONFIG
    // ==========================================

    const config =
      await LotteryConfig.findById(
        lotteryConfigId
      );

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "Lottery config not found",
      });
    }

    // ==========================================
    // FIND SELECTED DATE IN CONFIG
    // ==========================================

    if (!Array.isArray(config.dates)) {
      return res.status(400).json({
        success: false,
        message:
          "Lottery config does not contain dates",
      });
    }

    const configDate =
      config.dates.find((item) => {
        return (
          getDateString(item.date) ===
          selectedDate
        );
      });

    if (!configDate) {
      return res.status(404).json({
        success: false,
        message:
          `Date ${selectedDate} does not exist in this lottery config`,
      });
    }

    // ==========================================
    // CHECK EXISTING RESULT
    // ==========================================

    const existingResult =
      await LotteryResult.findOne({
        lotteryConfigId,
        date: configDate.date,
      });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message:
          "Result already exists for this date. Use update API.",
        resultId: existingResult._id,
      });
    }

    // ==========================================
    // GET PRIZE AMOUNTS
    // ==========================================

    const prizeAmounts =
      getPrizeAmounts(
        config,
        configDate
      );

    // ==========================================
    // PROCESS USERS
    // ==========================================

    const processed =
      processUsersForDate({
        config,
        selectedDate,
        winningNumber:
          finalWinningNumber,
        prizeAmounts,
      });

    // ==========================================
    // SAVE USER RESULTS IN CONFIG
    // ==========================================

    config.markModified("users");

    await config.save();

    // ==========================================
    // CREATE RESULT
    // ==========================================

    const result =
      await LotteryResult.create({
        lotteryConfigId,

        date: configDate.date,

        winningNumber:
          finalWinningNumber,

        winners:
          processed.winners,

        isPublished: false,

        createdBy: adminId,
      });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,

      message:
        "Lottery result created and users processed successfully",

      result,

      summary: {
        date: selectedDate,

        winningNumber:
          finalWinningNumber,

        totalUsers:
          processed.totalUsers,

        firstPrize:
          processed.firstPrizeCount,

        secondPrize:
          processed.secondPrizeCount,

        thirdPrize:
          processed.thirdPrizeCount,

        lost:
          processed.lostCount,
      },
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
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL RESULTS
// ADMIN
// =====================================================

const getAllResults = async (
  req,
  res
) => {
  try {
    const results =
      await LotteryResult.find()
        .populate(
          "lotteryConfigId",
          "marketName month year isActive dates"
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
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET RESULT BY ID
// =====================================================

const getResultById = async (
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
          "Invalid result ID",
      });
    }

    const result =
      await LotteryResult.findById(
        id
      ).populate(
        "lotteryConfigId",
        "marketName month year isActive dates"
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Result not found",
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
      message:
        "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// PUBLISH RESULT
// =====================================================

const publishResult = async (
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
          "Invalid result ID",
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
          runValidators: true,
        }
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Result not found",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Result published successfully",

      result,
    });
  } catch (error) {
    console.error(
      "Publish Result Error:",
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
// UNPUBLISH RESULT
// =====================================================

const unpublishResult = async (
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
          "Invalid result ID",
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
          runValidators: true,
        }
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Result not found",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Result unpublished successfully",

      result,
    });
  } catch (error) {
    console.error(
      "Unpublish Result Error:",
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
// UPDATE RESULT + RECALCULATE USERS
// ADMIN
// =====================================================

const updateResult = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      winningNumber,
    } = req.body;

    // ==========================================
    // VALIDATE RESULT ID
    // ==========================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid result ID",
      });
    }

    // ==========================================
    // VALIDATE WINNING NUMBER
    // ==========================================

    if (
      winningNumber === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "winningNumber is required",
      });
    }

    if (
      !validateSixDigitNumber(
        winningNumber
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Winning number must contain exactly 6 digits",
      });
    }

    const finalWinningNumber =
      String(winningNumber).trim();

    // ==========================================
    // FIND RESULT
    // ==========================================

    const result =
      await LotteryResult.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Result not found",
      });
    }

    // ==========================================
    // PUBLISHED RESULT CANNOT EDIT
    // ==========================================

    if (result.isPublished) {
      return res.status(400).json({
        success: false,
        message:
          "Published result cannot be edited. Unpublish it first.",
      });
    }

    // ==========================================
    // FIND CONFIG
    // ==========================================

    const config =
      await LotteryConfig.findById(
        result.lotteryConfigId
      );

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "Lottery config not found",
      });
    }

    // ==========================================
    // FIND DATE
    // ==========================================

    const selectedDate =
      getDateString(result.date);

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid result date",
      });
    }

    const configDate =
      config.dates?.find((item) => {
        return (
          getDateString(item.date) ===
          selectedDate
        );
      });

    if (!configDate) {
      return res.status(404).json({
        success: false,
        message:
          "Result date does not exist in lottery config",
      });
    }

    // ==========================================
    // GET PRIZE AMOUNTS
    // ==========================================

    const prizeAmounts =
      getPrizeAmounts(
        config,
        configDate
      );

    // ==========================================
    // RECALCULATE USERS
    // ==========================================

    const processed =
      processUsersForDate({
        config,

        selectedDate,

        winningNumber:
          finalWinningNumber,

        prizeAmounts,
      });

    // ==========================================
    // UPDATE RESULT
    // ==========================================

    result.winningNumber =
      finalWinningNumber;

    result.winners =
      processed.winners;

    await result.save();

    // ==========================================
    // SAVE USER DATA
    // ==========================================

    config.markModified("users");

    await config.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        "Result updated and users recalculated successfully",

      result,

      summary: {
        date: selectedDate,

        winningNumber:
          finalWinningNumber,

        totalUsers:
          processed.totalUsers,

        firstPrize:
          processed.firstPrizeCount,

        secondPrize:
          processed.secondPrizeCount,

        thirdPrize:
          processed.thirdPrizeCount,

        lost:
          processed.lostCount,
      },
    });
  } catch (error) {
    console.error(
      "Update Result Error:",
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
// DELETE RESULT
// ADMIN
// =====================================================

const deleteResult = async (
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
          "Invalid result ID",
      });
    }

    const result =
      await LotteryResult.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Result not found",
      });
    }

    // ==========================================
    // PUBLISHED RESULT DELETE NOT ALLOWED
    // ==========================================

    if (result.isPublished) {
      return res.status(400).json({
        success: false,
        message:
          "Published result cannot be deleted",
      });
    }

    // ==========================================
    // DELETE RESULT
    // ==========================================

    await LotteryResult.findByIdAndDelete(
      id
    );

    return res.status(200).json({
      success: true,

      message:
        "Result deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Result Error:",
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
// TEST NUMBER MATCHING
// =====================================================

const checkNumber = async (
  req,
  res
) => {
  try {
    const {
      userNumber,
      winningNumber,
    } = req.body;

    // ==========================================
    // VALIDATE
    // ==========================================

    if (
      !validateSixDigitNumber(
        userNumber
      ) ||
      !validateSixDigitNumber(
        winningNumber
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Both numbers must contain exactly 6 digits",
      });
    }

    // ==========================================
    // MATCH
    // ==========================================

    const result = getPrize(
      String(userNumber),
      String(winningNumber)
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      userNumber:
        String(userNumber),

      winningNumber:
        String(winningNumber),

      winner:
        result !== null,

      result,
    });
  } catch (error) {
    console.error(
      "Check Number Error:",
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