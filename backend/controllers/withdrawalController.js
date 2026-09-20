const mongoose = require("mongoose");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/userModel");

// ================= USER =================

// Create withdrawal request (bank detail har baar bhejega)
exports.createWithdrawal = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            amount,
            accountHolderName,
            accountNumber,
            ifscCode,
            bankName,
            branchName,
            upiId,
        } = req.body;

        // Validation
        if (!amount || amount <= 0)
            throw new Error("Invalid amount");
        if (!accountHolderName || !accountNumber || !ifscCode || !bankName)
            throw new Error("All bank details are required");

        const user = await User.findById(req.user._id).session(session);
        if (user.wallet < amount) throw new Error("Insufficient wallet balance");

        // Wallet se amount hold kar do
        user.wallet -= amount;
        await user.save({ session });

        const [withdrawal] = await Withdrawal.create(
            [
                {
                    user: user._id,
                    amount,
                    bankDetail: {
                        accountHolderName,
                        accountNumber,
                        ifscCode,
                        bankName,
                        branchName,
                        upiId,
                    },
                    status: "pending",
                },
            ],
            { session }
        );

        await session.commitTransaction();
        res.status(201).json({
            success: true,
            message: "Withdrawal request submitted",
            data: withdrawal,
        });
    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

// User's own history
exports.getMyWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: withdrawals });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= ADMIN =================

// Get all (with filter + pagination)
exports.getAllWithdrawals = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const [withdrawals, total] = await Promise.all([
            Withdrawal.find(filter)
                .populate("user", "name mobile uuid wallet")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            Withdrawal.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: withdrawals,
            pagination: { total, page: Number(page), limit: Number(limit) },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Approve / Reject
exports.updateWithdrawalStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { status, adminRemark, transactionId } = req.body;

        if (!["approved", "rejected"].includes(status))
            throw new Error("Invalid status");

        const withdrawal = await Withdrawal.findById(id).session(session);
        if (!withdrawal) throw new Error("Withdrawal not found");
        if (withdrawal.status !== "pending") throw new Error("Already processed");

        // Reject → wallet refund
        if (status === "rejected") {
            await User.findByIdAndUpdate(
                withdrawal.user,
                { $inc: { wallet: withdrawal.amount } },
                { session }
            );
        }

        withdrawal.status = status;
        withdrawal.adminRemark = adminRemark || "";
        withdrawal.transactionId = transactionId || "";
        withdrawal.processedBy = req.user._id;
        withdrawal.processedAt = new Date();
        await withdrawal.save({ session });

        await session.commitTransaction();
        res.json({
            success: true,
            message: `Withdrawal ${status}`,
            data: withdrawal,
        });
    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
};