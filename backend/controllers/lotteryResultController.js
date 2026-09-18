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

  return /^\d{6}$/.test(String(number).trim());
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
// DATE STRING
// =====================================================

const getDateString = (date) => {
  if (!date) {
    return null;
  }

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
// CHECK PRIZE
// =====================================================

const getPrize = (userNumber, winningNumber) => {
  const user = String(userNumber).trim();
  const winning = String(winningNumber).trim();

  // ===================================================
  // 1ST PRIZE
  // EXACT 6 DIGITS
  // ===================================================

  if (user === winning) {
    return {
      prize: "1st",
      matchedDigits: 6,
    };
  }

  // ===================================================
  // 2ND PRIZE
  // FIRST 5 OR LAST 5
  // ===================================================

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

  // ===================================================
  // 3RD PRIZE
  // FIRST 4 OR MIDDLE 4 OR LAST 4
  // ===================================================

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

  return null;
};

// =====================================================
// GET PRIZE AMOUNTS
// =====================================================
//
// Optional support if config has:
//
// prizes: {
//   first: 10000,
//   second: 5000,
//   third: 1000
// }
//
// Current config schema may not contain this.
// =====================================================

const getPrizeAmounts = (config) => {
  const prizeObject =
    config?.prizes ||
    config?.prize ||
    {};

  return {
    first:
      Number(
        prizeObject.first ??
        prizeObject.firstPrize ??
        0
      ) || 0,

    second:
      Number(
        prizeObject.second ??
        prizeObject.secondPrize ??
        0
      ) || 0,

    third:
      Number(
        prizeObject.third ??
        prizeObject.thirdPrize ??
        0
      ) || 0,
  };
};

// =====================================================
// BUILD USER PRIZE OBJECT
// =====================================================
//
// This is for LotteryConfig.users[].prize
// =====================================================

const buildUserPrizeObject = (
  prizeType,
  prizeAmounts
) => {
  return {
    first:
      prizeType === "1st"
        ? prizeAmounts.first
        : 0,

    second:
      prizeType === "2nd"
        ? prizeAmounts.second
        : 0,

    third:
      prizeType === "3rd"
        ? prizeAmounts.third
        : 0,
  };
};

// =====================================================
// PROCESS USERS
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

  // ===================================================
  // CHECK USERS
  // ===================================================

  if (!Array.isArray(config.users)) {
    return {
      winners,
      totalUsers: 0,
      firstPrizeCount: 0,
      secondPrizeCount: 0,
      thirdPrizeCount: 0,
      lostCount: 0,
    };
  }

  // ===================================================
  // GET USERS OF SELECTED DATE
  // ===================================================

  const dateUsers = config.users.filter((user) => {
    return (
      getDateString(user.entryDate) ===
      selectedDate
    );
  });

  // ===================================================
  // PROCESS EACH USER
  // ===================================================

  for (const user of dateUsers) {
    const userNumber = String(
      user.number || ""
    ).trim();

    // =================================================
    // INVALID NUMBER
    // =================================================

    if (!validateSixDigitNumber(userNumber)) {
      user.status = "lost";

      user.prizeType = null;

      user.prize = {
        first: 0,
        second: 0,
        third: 0,
      };

      lostCount++;

      continue;
    }

    // =================================================
    // CHECK MATCH
    // =================================================

    const match = getPrize(
      userNumber,
      winningNumber
    );

    // =================================================
    // LOST
    // =================================================

    if (!match) {
      user.status = "lost";

      user.prizeType = null;

      user.prize = {
        first: 0,
        second: 0,
        third: 0,
      };

      lostCount++;

      continue;
    }

    // =================================================
    // WIN
    // =================================================

    user.status = "win";

    user.prizeType = match.prize;

    // =================================================
    // SAVE PRIZE AMOUNT IN USER ENTRY
    // =================================================

    user.prize =
      buildUserPrizeObject(
        match.prize,
        prizeAmounts
      );

    // =================================================
    // COUNT PRIZE
    // =================================================

    if (match.prize === "1st") {
      firstPrizeCount++;
    }

    if (match.prize === "2nd") {
      secondPrizeCount++;
    }

    if (match.prize === "3rd") {
      thirdPrizeCount++;
    }

    // =================================================
    // IMPORTANT
    //
    // LotteryResult.prize expects:
    //
    // "1st"
    // "2nd"
    // "3rd"
    //
    // NOT amount
    // NOT object
    // =================================================

    winners.push({
      userId: user.userId,

      userNumber: userNumber,

      amount: Number(user.amount) || 0,

      prizeType: match.prize,

      matchedDigits: match.matchedDigits,

      prize: match.prize,
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
// POST /
// =====================================================

const createResult = async (req, res) => {
  try {
    const {
      lotteryConfigId,
      date,
      winningNumber,
    } = req.body;

    // =================================================
    // ADMIN ID
    // =================================================

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

    // =================================================
    // CONFIG ID
    // =================================================

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

    // =================================================
    // DATE
    // =================================================

    const selectedDate =
      normalizeDate(date);

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message:
          "Valid date is required. Format: YYYY-MM-DD",
      });
    }

    // =================================================
    // WINNING NUMBER
    // =================================================

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

    // =================================================
    // FIND CONFIG
    // =================================================

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

    // =================================================
    // CHECK DATE USERS
    // =================================================

    const dateUsers =
      Array.isArray(config.users)
        ? config.users.filter((user) => {
            return (
              getDateString(
                user.entryDate
              ) === selectedDate
            );
          })
        : [];

    if (dateUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          `No user entries found for date ${selectedDate}`,
      });
    }

    // =================================================
    // CHECK DUPLICATE RESULT
    // =================================================

    const existingResult =
      await LotteryResult.findOne({
        lotteryConfigId,
        date: selectedDate,
      });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message:
          "Result already exists for this date. Use update API.",
        resultId:
          existingResult._id,
      });
    }

    // =================================================
    // PRIZE AMOUNTS
    // =================================================

    const prizeAmounts =
      getPrizeAmounts(config);

    // =================================================
    // PROCESS USERS
    // =================================================

    const processed =
      processUsersForDate({
        config,

        selectedDate,

        winningNumber:
          finalWinningNumber,

        prizeAmounts,
      });

    // =================================================
    // SAVE USER RESULTS
    // =================================================

    config.markModified("users");

    await config.save();

    // =================================================
    // CREATE RESULT
    // =================================================

    const result =
      await LotteryResult.create({
        lotteryConfigId,

        date: selectedDate,

        winningNumber:
          finalWinningNumber,

        winners:
          processed.winners,

        isPublished: false,

        createdBy: adminId,
      });

    // =================================================
    // RESPONSE
    // =================================================

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
// GET /
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
          "marketName month year isActive"
        )
        .sort({
          date: -1,
          createdAt: -1,
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
// GET /:id
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
      await LotteryResult.findById(id)
        .populate(
          "lotteryConfigId",
          "marketName month year isActive"
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
// PATCH /:id/publish
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
// PATCH /:id/unpublish
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
// UPDATE RESULT
// PUT /:id
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

    // =================================================
    // VALIDATE ID
    // =================================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid result ID",
      });
    }

    // =================================================
    // VALIDATE NUMBER
    // =================================================

    if (
      winningNumber === undefined ||
      winningNumber === null
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

    // =================================================
    // FIND RESULT
    // =================================================

    const result =
      await LotteryResult.findById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Result not found",
      });
    }

    // =================================================
    // PUBLISHED RESULT CANNOT EDIT
    // =================================================

    if (result.isPublished) {
      return res.status(400).json({
        success: false,
        message:
          "Published result cannot be edited. Unpublish it first.",
      });
    }

    // =================================================
    // FIND CONFIG
    // =================================================

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

    // =================================================
    // RESULT DATE
    // =================================================

    const selectedDate =
      getDateString(result.date);

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid result date",
      });
    }

    // =================================================
    // CHECK USERS
    // =================================================

    const dateUsers =
      Array.isArray(config.users)
        ? config.users.filter((user) => {
            return (
              getDateString(
                user.entryDate
              ) === selectedDate
            );
          })
        : [];

    if (dateUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          `No user entries found for date ${selectedDate}`,
      });
    }

    // =================================================
    // PRIZE AMOUNTS
    // =================================================

    const prizeAmounts =
      getPrizeAmounts(config);

    // =================================================
    // RECALCULATE
    // =================================================

    const processed =
      processUsersForDate({
        config,

        selectedDate,

        winningNumber:
          finalWinningNumber,

        prizeAmounts,
      });

    // =================================================
    // UPDATE RESULT
    // =================================================

    result.winningNumber =
      finalWinningNumber;

    result.winners =
      processed.winners;

    await result.save();

    // =================================================
    // SAVE CONFIG USERS
    // =================================================

    config.markModified("users");

    await config.save();

    // =================================================
    // RESPONSE
    // =================================================

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
// DELETE /:id
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

    // =================================================
    // PUBLISHED RESULT DELETE NOT ALLOWED
    // =================================================

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
// CHECK NUMBER
// POST /check-number
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

    // =================================================
    // VALIDATE
    // =================================================

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

    // =================================================
    // CHECK
    // =================================================

    const result = getPrize(
      String(userNumber).trim(),
      String(winningNumber).trim()
    );

    return res.status(200).json({
      success: true,

      userNumber:
        String(userNumber).trim(),

      winningNumber:
        String(winningNumber).trim(),

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
// GET PUBLISHED RESULTS
// GET /published
// =====================================================

const getPublishedResults = async (
  req,
  res
) => {
  try {
    const results =
      await LotteryResult.find({
        isPublished: true,
      })
        .populate(
          "lotteryConfigId",
          "marketName month year isActive"
        )
        .sort({
          date: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      count: results.length,

      results,
    });
  } catch (error) {
    console.error(
      "Get Published Results Error:",
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
// GET PUBLISHED RESULT BY DATE
// GET /published/:date
// =====================================================

const getPublishedResultByDate = async (
  req,
  res
) => {
  try {
    const selectedDate =
      normalizeDate(req.params.date);

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message:
          "Valid date is required. Format: YYYY-MM-DD",
      });
    }

    const result =
      await LotteryResult.findOne({
        date: selectedDate,
        isPublished: true,
      }).populate(
        "lotteryConfigId",
        "marketName month year isActive"
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          `Published result not found for ${selectedDate}`,
      });
    }

    return res.status(200).json({
      success: true,

      result,
    });
  } catch (error) {
    console.error(
      "Get Published Result By Date Error:",
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

  getPublishedResults,

  getPublishedResultByDate,

  getPrize,
};
