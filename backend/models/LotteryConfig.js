const mongoose = require("mongoose");

// ==========================================
// DATE LOTTERY SCHEMA
// ==========================================
const dateLotterySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    // Exactly 6 lottery numbers
    numbers: {
      type: [Number],
      required: true,

      validate: {
        validator: function (numbers) {
          if (!Array.isArray(numbers)) {
            return false;
          }

          // Exactly 6 numbers
          if (numbers.length !== 6) {
            return false;
          }

          // Unique numbers
          if (new Set(numbers).size !== 6) {
            return false;
          }

          // Numbers between 1 and 99
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

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // pending / win / lost
    status: {
      type: String,
      enum: ["pending", "win", "lost"],
      default: "pending",
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
    // USER ID FROM JWT
    // ==========================================
    userId: {
      type: String,
      required: true,
      index: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    dates: {
      type: [dateLotterySchema],
      required: true,

      validate: {
        validator: function (dates) {
          return dates.length >= 28 && dates.length <= 31;
        },

        message:
          "Month must contain between 28 and 31 dates",
      },
    },

    // Only one active config globally
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

module.exports = mongoose.model(
  "LotteryConfig",
  lotteryConfigSchema
);