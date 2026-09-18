const mongoose = require("mongoose");

// ==========================================
// USER LOTTERY ENTRY SCHEMA
// ==========================================

const userLotterySchema = new mongoose.Schema(
  {
    // User ID from JWT
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Exactly 6 unique lottery numbers
    numbers: {
      type: [Number],
      required: true,

      validate: {
        validator: function (numbers) {
          if (!Array.isArray(numbers)) {
            return false;
          }

          if (numbers.length !== 6) {
            return false;
          }

          if (new Set(numbers).size !== 6) {
            return false;
          }

          return numbers.every(
            (number) =>
              Number.isInteger(number) &&
              number >= 1 &&
              number <= 99
          );
        },

        message:
          "Exactly 6 unique lottery numbers between 1 and 99 are required",
      },
    },

    // User lottery amount
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Lottery result status
    status: {
      type: String,
      enum: ["pending", "win", "lost"],
      default: "pending",
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

// ==========================================
// DATE LOTTERY SCHEMA
// ==========================================

const dateLotterySchema = new mongoose.Schema(
  {
    // Actual lottery date
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // All users who played on this date
    users: {
      type: [userLotterySchema],
      default: [],
    },
  },
  {
    _id: true,
  }
);

// ==========================================
// MAIN LOTTERY CONFIG SCHEMA
// ==========================================

const lotteryConfigSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER ID
    // ==========================================
    //
    // This can be the creator/admin ID.
    //
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // ==========================================
    // MONTH
    // ==========================================

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    // ==========================================
    // YEAR
    // ==========================================

    year: {
      type: Number,
      required: true,
    },

    // ==========================================
    // ALL DATES OF MONTH
    // ==========================================

    dates: {
      type: [dateLotterySchema],
      required: true,

      validate: {
        validator: function (dates) {
          return (
            Array.isArray(dates) &&
            dates.length >= 28 &&
            dates.length <= 31
          );
        },

        message:
          "Month must contain between 28 and 31 dates",
      },
    },

    // ==========================================
    // ACTIVE CONFIG
    // ==========================================

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },

  {
    timestamps: true,
  }
);

// ==========================================
// ONE CONFIG PER USER + MONTH + YEAR
// ==========================================

lotteryConfigSchema.index(
  {
    userId: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

// ==========================================
// ONLY ONE ACTIVE CONFIG GLOBALLY
// ==========================================

lotteryConfigSchema.index(
  {
    isActive: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
    },
  }
);

// ==========================================
// EXPORT
// ==========================================

module.exports = mongoose.model(
  "LotteryConfig",
  lotteryConfigSchema
);