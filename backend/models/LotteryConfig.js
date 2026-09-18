const mongoose = require("mongoose");

// =====================================================
// USER LOTTERY ENTRY SCHEMA
// =====================================================

const userLotterySchema = new mongoose.Schema(
    {
        // ==========================================
        // USER ID FROM JWT
        // ==========================================

        userId: {
            type: String,
            required: true,
            index: true,
        },

        // ==========================================
        // USER LOTTERY AMOUNT
        // ==========================================

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        // ==========================================
        // EXACTLY 6 DIGIT NUMBER
        // ==========================================

        number: {
            type: String,
            required: true,

            validate: {
                validator: function (value) {
                    return /^\d{6}$/.test(value);
                },

                message:
                    "Lottery number must be exactly 6 digits",
            },
        },

        // ==========================================
        // RESULT STATUS
        // ==========================================

        status: {
            type: String,

            enum: [
                "pending",
                "win",
                "lost",
            ],

            default: "pending",
        },
    },
    {
        _id: true,
        timestamps: true,
    }
);

// =====================================================
// MAIN LOTTERY CONFIG SCHEMA
// =====================================================

const lotteryConfigSchema = new mongoose.Schema(
    {
        // ==========================================
        // MARKET NAME
        // ==========================================

        marketName: {
            type: String,
            required: true,
            trim: true,
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
        // ALL USERS
        // ==========================================

        users: {
            type: [userLotterySchema],
            default: [],
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

// =====================================================
// ONE MARKET PER MONTH + YEAR
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

// =====================================================
// ONLY ONE ACTIVE CONFIG
// =====================================================

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

// =====================================================
// EXPORT
// =====================================================

module.exports = mongoose.model(
    "LotteryConfig",
    lotteryConfigSchema
);
