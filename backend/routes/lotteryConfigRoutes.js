const express = require("express");

const {
  createLotteryConfig,
  addUserLotteryEntry,
  getAllLotteryConfigs,
  getLotteryConfigById,
  getActiveLotteryConfig,
  activateLotteryConfig,
  deactivateLotteryConfig,
  updateUserLotteryEntry,
  deleteUserLotteryEntry,
  deleteLotteryConfig,
} = require("../controllers/lotteryConfigController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// ADMIN
// =====================================================

// Create market
router.post(
  "/",
  authMiddleware,
  createLotteryConfig
);

// Get all markets
router.get(
  "/",
  authMiddleware,
  getAllLotteryConfigs
);

// Get active market
router.get(
  "/active",
  authMiddleware,
  getActiveLotteryConfig
);

// Get market by ID
router.get(
  "/:id",
  authMiddleware,
  getLotteryConfigById
);

// Activate market
router.put(
  "/:id/activate",
  authMiddleware,
  activateLotteryConfig
);

// Deactivate market
router.put(
  "/:id/deactivate",
  authMiddleware,
  deactivateLotteryConfig
);

// Update user entry
router.put(
  "/:id/user/:userEntryId",
  authMiddleware,
  updateUserLotteryEntry
);

// Delete user entry
router.delete(
  "/:id/user/:userEntryId",
  authMiddleware,
  deleteUserLotteryEntry
);

// Delete market
router.delete(
  "/:id",
  authMiddleware,
  deleteLotteryConfig
);

// =====================================================
// USER
// =====================================================

// Add today's entry
router.post(
  "/entry",
  authMiddleware,
  addUserLotteryEntry
);

module.exports = router;