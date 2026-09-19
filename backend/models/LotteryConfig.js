const mongoose = require("mongoose");

// =====================================================
// USER LOTTERY ENTRY SCHEMA
// (BILKUL WAISA HI — kuch nahi badla)
// =====================================================

const lotteryUserEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Exact date on which user submitted entry
    // Example: 2026-09-18
    entryDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },

    // User's 6 digit lottery number
    number: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =================================================
    // PRIZE DETAILS
    // =================================================
    prize: {
      first: {
        type: Number,
        default: 0,
        min: 0,
      },
      second: {
        type: Number,
        default: 0,
        min: 0,
      },
      third: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Which prize user won
    prizeType: {
      type: String,
      enum: ["1st", "2nd", "3rd", null],
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "win", "lost"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// LOTTERY CONFIG SCHEMA
// =====================================================

const lotteryConfigSchema = new mongoose.Schema(
  {
    marketName: {
      type: String,
      required: true,
      trim: true,
    },

    // 👇 NEW: day of month (1 - 31)
    date: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },

    // 1 - 12
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    // Example: 2026
    year: {
      type: Number,
      required: true,
      min: 2000,
    },

    // Admin-entered prize amounts
    prizes: {
      first: {
        type: Number,
        required: true,
        min: 0,
      },
      second: {
        type: Number,
        required: true,
        min: 0,
      },
      third: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    users: {
      type: [lotteryUserEntrySchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// ONE MARKET PER DATE + MONTH + YEAR
// =====================================================

lotteryConfigSchema.index(
  {
    marketName: 1,
    date: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "LotteryConfig",
  lotteryConfigSchema
);