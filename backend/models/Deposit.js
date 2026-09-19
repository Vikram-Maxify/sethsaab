const mongoose = require("mongoose");

const depositSchema =
  new mongoose.Schema(
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

      // ===============================================
      // LOTTERY CONFIG
      // ===============================================

      configId: {
        type: mongoose.Schema.Types.ObjectId,

        ref: "LotteryConfig",

        default: null,

        index: true,
      },

      // ===============================================
      // LOTTERY ENTRY
      // ===============================================

      entryId: {
        type: mongoose.Schema.Types.ObjectId,

        default: null,

        index: true,
      },

      // ===============================================
      // LOTTERY NUMBER
      // ===============================================

      number: {
        type: String,

        default: null,

        validate: {
          validator: function (value) {
            if (
              value === null ||
              value === ""
            ) {
              return true;
            }

            return /^\d{6}$/.test(
              String(value)
            );
          },

          message:
            "Lottery number must be exactly 6 digits",
        },
      },

      // ===============================================
      // USER DETAILS
      // ===============================================

      uid: {
        type: String,

        default: "",
      },

      phone: {
        type: String,

        required: true,
      },

      username: {
        type: String,

        default: "",
      },

      // ===============================================
      // ORDER
      // ===============================================

      orderId: {
        type: String,

        unique: true,

        required: true,
      },

      paymentMethod: {
        type: String,

        default: "",
      },

      type: {
        type: String,

        default: "",
      },

      channel: {
        type: String,

        default: "",
      },

      // ===============================================
      // AMOUNT
      // ===============================================

      amount: {
        type: Number,

        required: true,

        min: 0,
      },

      exchangeRate: {
        type: Number,

        default: 0,
      },

      // ===============================================
      // TRANSACTION
      // ===============================================

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

      // ===============================================
      // STATUS
      // 0 = pending
      // 1 = success
      // 2 = failed
      // ===============================================

      status: {
        type: Number,

        enum: [0, 1, 2],

        default: 0,

        index: true,
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

// =====================================================
// INDEX
// =====================================================

depositSchema.index({
  userId: 1,
  createdAt: -1,
});

depositSchema.index({
  configId: 1,
  entryId: 1,
});

module.exports =
  mongoose.model(
    "Deposit",
    depositSchema
  );