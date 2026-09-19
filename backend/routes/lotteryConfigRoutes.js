const express = require("express");
const router = express.Router();

const {
  createLotteryConfig,
  addUserLotteryEntry,
  getMyLotteryEntries,
  getAllLotteryConfigs,
  getActiveLotteryConfig,
  getLotteryConfigById,
  activateLotteryConfig,
  updateEntryStatus,
  deleteLotteryConfig,
} = require("../controllers/lotteryConfigController");

// =====================================================
// IMPORT YOUR AUTH MIDDLEWARE HERE
// =====================================================
// const { protect, adminOnly } = require("../middleware/auth");

// =====================================================
// PUBLIC / USER ROUTES
// =====================================================

// GET today's active lottery
router.get("/active", getActiveLotteryConfig);

// GET my entries (requires auth)
router.get(
  "/my-entries",
  /* protect, */ getMyLotteryEntries
);

// ADD a new lottery entry (requires auth)
router.post(
  "/entry",
  /* protect, */ addUserLotteryEntry
);

// =====================================================
// ADMIN ROUTES
// =====================================================

// CREATE lottery configs for a month
router.post(
  "/",
  /* protect, adminOnly, */ createLotteryConfig
);

// GET all lottery configs
router.get(
  "/",
  /* protect, adminOnly, */ getAllLotteryConfigs
);

// GET config by ID
router.get(
  "/:id",
  /* protect, adminOnly, */ getLotteryConfigById
);

// ACTIVATE a config
router.patch(
  "/:id/activate",
  /* protect, adminOnly, */ activateLotteryConfig
);

// UPDATE user entry status
router.patch(
  "/:configId/entry/:entryId/status",
  /* protect, adminOnly, */ updateEntryStatus
);

// DELETE a config
router.delete(
  "/:id",
  /* protect, adminOnly, */ deleteLotteryConfig
);

module.exports = router;