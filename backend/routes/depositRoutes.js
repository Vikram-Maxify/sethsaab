const express = require("express");

const {
  createDeposit,
  cancelDeposit,                  // 🆕
  getMyDeposits,
  onlinePayCallback,
  getMyTurnoverHistory,
  getAllDepositsForAdmin,
  getDepositStatusByIdentifier,   // 🆕 (replaces getDepositStatus)
} = require("../controllers/depositecontroller");

const uploadDeposit = require("../middleware/depositUpload.js");
const authMiddleware = require("../middleware/authMiddleware");
const {
  requireVerifiedKYC,
} = require("../middleware/kycVerificationMiddleware");

const router = express.Router();

// =====================================================
// CREATE DEPOSIT (RECHARGE)
// =====================================================

router.post(
  "/deposit",
  authMiddleware,
  requireVerifiedKYC,
  uploadDeposit.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  createDeposit
);

// =====================================================
// 🆕 CANCEL DEPOSIT
// User gateway se back aaya / cancel kiya
// Support _id OR orderId in :depositId
// =====================================================

router.post(
  "/deposit/:depositId/cancel",
  authMiddleware,
  cancelDeposit
);

// =====================================================
// TURNOVER HISTORY
// =====================================================

router.get(
  "/deposit/turnover",
  authMiddleware,
  getMyTurnoverHistory
);

// =====================================================
// DEPOSIT STATUS BY IDENTIFIER (_id OR orderId)
// Frontend payment-success page ke liye (public)
//
// IMPORTANT: Yeh route "/deposit" aur
// "/deposit/:depositId/cancel" ke baad, lekin
// "/deposit" (GET list) se PEHLE hona chahiye.
// =====================================================

router.get(
  "/deposit/status/:identifier",
  getDepositStatusByIdentifier
);

// =====================================================
// MY DEPOSIT HISTORY
// =====================================================

router.get(
  "/deposit",
  authMiddleware,
  getMyDeposits
);

// =====================================================
// ADMIN: GET ALL DEPOSITS
// =====================================================

router.get(
  "/deposits",
  authMiddleware,
  getAllDepositsForAdmin
);

// =====================================================
// AUTOMATIC PAYMENT CALLBACK (QWACKPAY WEBHOOK)
// =====================================================

router.all(
  "/deposit/callback",
  onlinePayCallback
);

module.exports = router;