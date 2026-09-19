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

    entryDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

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

    isBuy: {
      type: Boolean,
      default: false,
      index: true,
    },

    prize: {
      first: { type: Number, default: 0, min: 0 },
      second: { type: Number, default: 0, min: 0 },
      third: { type: Number, default: 0, min: 0 },
    },

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

    date: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
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
      min: 2000,
    },

    prizes: {
      first: { type: Number, required: true, min: 0 },
      second: { type: Number, required: true, min: 0 },
      third: { type: Number, required: true, min: 0 },
    },

    users: {
      type: [lotteryUserEntrySchema],
      default: [],
    },

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
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("LotteryConfig", lotteryConfigSchema);