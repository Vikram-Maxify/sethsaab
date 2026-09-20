const express = require("express");

const {
  createDeposit,
  getMyDeposits,
  onlinePayCallback,
  getMyTurnoverHistory,
  getAllDepositsForAdmin,
} = require("../controllers/depositecontroller");



const uploadDeposit = require("../middleware/depositUpload.js");
const authMiddleware = require("../middleware/authMiddleware");
const { requireVerifiedKYC } = require("../middleware/kycVerificationMiddleware");

const router = express.Router();

// =====================================================
// CREATE DEPOSIT
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
// TURNOVER HISTORY
// =====================================================

router.get(
  "/deposit/turnover",
  authMiddleware,
  getMyTurnoverHistory
);

// =====================================================
// MY DEPOSIT HISTORY
// =====================================================

router.get(
  "/deposit",
  authMiddleware,
  getMyDeposits
);

router.get(
  "/deposits",
  authMiddleware,
  getAllDepositsForAdmin
);

// =====================================================
// AUTOMATIC PAYMENT CALLBACK
// =====================================================

router.all(
  "/deposit/callback",
  onlinePayCallback
);

module.exports = router;