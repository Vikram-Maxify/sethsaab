const mongoose = require("mongoose");

const winnerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    userNumber: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },

    prize: {
      type: String,
      enum: ["1st", "2nd", "3rd"],
      required: true,
    },

    matchedDigits: {
      type: Number,
      enum: [4, 5, 6],
      required: true,
    },
  },
  {
    _id: true,
  }
);

const lotteryResultSchema = new mongoose.Schema(
  {
    lotteryConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotteryConfig",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    winningNumber: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },

    winners: {
      type: [winnerSchema],
      default: [],
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ek config ke ek date ka sirf ek result
lotteryResultSchema.index(
  {
    lotteryConfigId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "LotteryResult",
  lotteryResultSchema
);