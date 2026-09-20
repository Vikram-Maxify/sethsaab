const express = require("express");
const router = express.Router();
const {
    createWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus,
} = require("../controllers/withdrawalController");

const authMiddleware = require("../middleware/authMiddleware");


// User
router.post("/", authMiddleware, createWithdrawal);
router.get("/me", authMiddleware, getMyWithdrawals);

// Admin
router.get("/admin/all", authMiddleware,  getAllWithdrawals);
router.patch("/admin/:id", authMiddleware,  updateWithdrawalStatus);

module.exports = router;