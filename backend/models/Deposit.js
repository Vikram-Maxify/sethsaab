const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    gatewayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminGateway",
      default: null,
    },

    uid: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      required: true,
    },


    orderId: {
      type: String,
      unique: true,
      required: true,
    },

    paymentMethod: {
      type: String,
    },

    type: {
      type: String,
    },

    channel: {
      type: String,
    },

    amount: {
      type: Number,
      required: true,
    },

    exchangeRate: {
      type: Number,
      default: 0,
    },

    transactionId: {
      type: String,
      default: "",
    },

    utr: {
      type: String,
      default: "",
    },

    paymentProof: {
      type: String,
      default: "",
    },

    paymentUrl: {
      type: String,
      default: "",
    },

    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },

    adminRemark: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Deposit", depositSchema);