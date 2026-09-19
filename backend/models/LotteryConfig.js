const mongoose = require("mongoose");

// =====================================================
// USER LOTTERY ENTRY SCHEMA
// =====================================================

const lotteryUserEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // =================================================
    // ENTRY DATE
    // =================================================

    entryDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },

    // =================================================
    // 6 DIGIT NUMBER
    // =================================================

    number: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },

    // =================================================
    // TICKET AMOUNT
    // =================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =================================================
    // PAYMENT SUCCESS
    // =================================================

    isBuy: {
      type: Boolean,
      default: false,
      index: true,
    },

    // =================================================
    // PRIZE
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

    // =================================================
    // PRIZE TYPE
    // =================================================

    prizeType: {
      type: String,
      enum: ["1st", "2nd", "3rd", null],
      default: null,
    },

    // =================================================
    // RESULT STATUS
    // =================================================

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
    // =================================================
    // MARKET NAME
    // =================================================

    marketName: {
      type: String,
      required: true,
      trim: true,
    },

    // =================================================
    // DATE
    // =================================================

    date: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },

    // =================================================
    // MONTH
    // =================================================

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    // =================================================
    // YEAR
    // =================================================

    year: {
      type: Number,
      required: true,
      min: 2000,
    },

    // =================================================
    // PRIZES
    // =================================================

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

    // =================================================
    // USERS / ENTRIES
    // =================================================

    users: {
      type: [lotteryUserEntrySchema],
      default: [],
    },

    // =================================================
    // ACTIVE
    // =================================================

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

// =====================================================
// UNIQUE MARKET + DATE
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