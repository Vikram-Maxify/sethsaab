const mongoose = require("mongoose");
const LotteryConfig = require("../models/LotteryConfig");

// ==========================================
// VALIDATE NUMBERS
// ==========================================
const validateNumbers = (numbers) => {
    if (!Array.isArray(numbers)) {
        return {
            valid: false,
            message: "numbers must be an array",
        };
    }

    if (numbers.length !== 6) {
        return {
            valid: false,
            message: "Exactly 6 lottery numbers are required",
        };
    }

    const convertedNumbers = numbers.map(Number);

    if (
        convertedNumbers.some(
            (number) =>
                !Number.isInteger(number) ||
                number < 1 ||
                number > 99
        )
    ) {
        return {
            valid: false,
            message:
                "Each lottery number must be between 1 and 99",
        };
    }

    if (new Set(convertedNumbers).size !== 6) {
        return {
            valid: false,
            message:
                "Lottery numbers must be unique",
        };
    }

    return {
        valid: true,
        numbers: convertedNumbers,
    };
};

// ==========================================
// VALIDATE AMOUNT
// ==========================================
const validateAmount = (amount) => {
    if (
        amount === undefined ||
        amount === null ||
        amount === "" ||
        Number.isNaN(Number(amount))
    ) {
        return {
            valid: false,
            message: "Valid amount is required",
        };
    }

    if (Number(amount) < 0) {
        return {
            valid: false,
            message: "Amount cannot be negative",
        };
    }

    return {
        valid: true,
        amount: Number(amount),
    };
};

// ==========================================
// VALIDATE STATUS
// ==========================================
const validateStatus = (status) => {
    const allowedStatuses = [
        "pending",
        "win",
        "lost",
    ];

    if (!allowedStatuses.includes(status)) {
        return {
            valid: false,
            message:
                "Status must be pending, win or lost",
        };
    }

    return {
        valid: true,
        status,
    };
};

// ==========================================
// CREATE MONTHLY CONFIG
// ==========================================
const createLotteryConfig = async (req, res) => {
    try {
        const {
            month,
            year,
            numbers,
            amount,
        } = req.body;

        // ==========================================
        // USER ID FROM JWT
        // ==========================================
        const userId = req.user?.uuid;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found in token",
            });
        }

        const now = new Date();

        const selectedMonth =
            month !== undefined
                ? Number(month)
                : now.getMonth() + 1;

        const selectedYear =
            year !== undefined
                ? Number(year)
                : now.getFullYear();

        // ==========================================
        // VALIDATE MONTH
        // ==========================================
        if (
            !Number.isInteger(selectedMonth) ||
            selectedMonth < 1 ||
            selectedMonth > 12
        ) {
            return res.status(400).json({
                success: false,
                message: "Month must be between 1 and 12",
            });
        }

        // ==========================================
        // VALIDATE YEAR
        // ==========================================
        if (
            !Number.isInteger(selectedYear) ||
            selectedYear < 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid year is required",
            });
        }

        // ==========================================
        // VALIDATE NUMBERS
        // ==========================================
        const numbersValidation =
            validateNumbers(numbers);

        if (!numbersValidation.valid) {
            return res.status(400).json({
                success: false,
                message: numbersValidation.message,
            });
        }

        // ==========================================
        // VALIDATE AMOUNT
        // ==========================================
        const amountValidation =
            validateAmount(amount);

        if (!amountValidation.valid) {
            return res.status(400).json({
                success: false,
                message: amountValidation.message,
            });
        }

        // ==========================================
        // CHECK EXISTING CONFIG
        // FOR THIS USER + MONTH + YEAR
        // ==========================================
        const existingConfig =
            await LotteryConfig.findOne({
                userId,
                month: selectedMonth,
                year: selectedYear,
            });

        if (existingConfig) {
            return res.status(409).json({
                success: false,
                message:
                    "Lottery configuration for this month already exists",
            });
        }

        // ==========================================
        // GET DAYS IN MONTH
        // ==========================================
        const daysInMonth = new Date(
            selectedYear,
            selectedMonth,
            0
        ).getDate();

        const dates = [];

        // ==========================================
        // CREATE EVERY DATE
        // ==========================================
        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {
            dates.push({
                date: new Date(
                    selectedYear,
                    selectedMonth - 1,
                    day
                ),

                numbers:
                    numbersValidation.numbers,

                amount:
                    amountValidation.amount,

                status: "pending",
            });
        }

        // ==========================================
        // CREATE CONFIG
        // ==========================================
        const config =
            await LotteryConfig.create({
                userId,
                month: selectedMonth,
                year: selectedYear,
                dates,
                isActive: false,
            });

        return res.status(201).json({
            success: true,
            message:
                "Monthly lottery configuration created successfully",

            data: config,
        });
    } catch (error) {
        console.error(
            "Create lottery config error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Lottery configuration already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ==========================================
// GET ALL
// ==========================================
const getAllLotteryConfigs = async (
    req,
    res
) => {
    try {
        const configs =
            await LotteryConfig.find().sort({
                year: -1,
                month: -1,
            });

        return res.status(200).json({
            success: true,
            count: configs.length,
            data: configs,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
            error: error.message,
        });
    }
};

// ==========================================
// GET ACTIVE
// ==========================================
const getActiveLotteryConfig = async (
    req,
    res
) => {
    try {
        const config =
            await LotteryConfig.findOne({
                isActive: true,
            });

        if (!config) {
            return res.status(404).json({
                success: false,
                message:
                    "No active lottery configuration found",
            });
        }

        return res.status(200).json({
            success: true,
            data: config,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
            error: error.message,
        });
    }
};

// ==========================================
// GET BY ID
// ==========================================
const getLotteryConfigById = async (
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
                    "Invalid configuration ID",
            });
        }

        const config =
            await LotteryConfig.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message:
                    "Configuration not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: config,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
            error: error.message,
        });
    }
};

// ==========================================
// ACTIVATE
// ==========================================
const activateLotteryConfig = async (
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
                    "Invalid configuration ID",
            });
        }

        const config =
            await LotteryConfig.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message:
                    "Configuration not found",
            });
        }

        // Deactivate all
        await LotteryConfig.updateMany(
            {
                isActive: true,
                _id: {
                    $ne: id,
                },
            },
            {
                $set: {
                    isActive: false,
                },
            }
        );

        // Activate selected
        config.isActive = true;

        await config.save();

        return res.status(200).json({
            success: true,
            message:
                "Lottery configuration activated",
            data: config,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
            error: error.message,
        });
    }
};

// ==========================================
// DEACTIVATE
// ==========================================
const deactivateLotteryConfig = async (
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
                    "Invalid configuration ID",
            });
        }

        const config =
            await LotteryConfig.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message:
                    "Configuration not found",
            });
        }

        config.isActive = false;

        await config.save();

        return res.status(200).json({
            success: true,
            message:
                "Lottery configuration deactivated",
            data: config,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
            error: error.message,
        });
    }
};

// ==========================================
// UPDATE DATE
// ==========================================
const updateLotteryDate = async (
    req,
    res
) => {
    try {
        const {
            id,
            dateId,
        } = req.params;

        const {
            numbers,
            amount,
            status,
        } = req.body;

        // Validate config ID
        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid configuration ID",
            });
        }

        // Find config
        const config =
            await LotteryConfig.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message:
                    "Configuration not found",
            });
        }

        // Find date
        const dateObject =
            config.dates.id(dateId);

        if (!dateObject) {
            return res.status(404).json({
                success: false,
                message:
                    "Date object not found",
            });
        }

        // ==========================================
        // UPDATE NUMBERS
        // ==========================================
        if (numbers !== undefined) {
            const numbersValidation =
                validateNumbers(numbers);

            if (!numbersValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message:
                        numbersValidation.message,
                });
            }

            dateObject.numbers =
                numbersValidation.numbers;
        }

        // ==========================================
        // UPDATE AMOUNT
        // ==========================================
        if (amount !== undefined) {
            const amountValidation =
                validateAmount(amount);

            if (!amountValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message:
                        amountValidation.message,
                });
            }

            dateObject.amount =
                amountValidation.amount;
        }

        // ==========================================
        // UPDATE STATUS
        // ==========================================
        if (status !== undefined) {
            const statusValidation =
                validateStatus(status);

            if (!statusValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message:
                        statusValidation.message,
                });
            }

            dateObject.status =
                statusValidation.status;
        }

        await config.save();

        return res.status(200).json({
            success: true,
            message:
                "Lottery date updated successfully",
            data: config,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
            error: error.message,
        });
    }
};

// ==========================================
// DELETE
// ==========================================
const deleteLotteryConfig = async (
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
                    "Invalid configuration ID",
            });
        }

        const config =
            await LotteryConfig.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message:
                    "Configuration not found",
            });
        }

        await LotteryConfig.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message:
                "Lottery configuration deleted successfully",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
            error: error.message,
        });
    }
};

module.exports = {
    createLotteryConfig,
    getAllLotteryConfigs,
    getLotteryConfigById,
    getActiveLotteryConfig,
    activateLotteryConfig,
    deactivateLotteryConfig,
    updateLotteryDate,
    deleteLotteryConfig,
};