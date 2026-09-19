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

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// PUBLIC ROUTES
// =====================================================

// GET active lottery
// GET /api/lottery-config/active
router.get("/active", getActiveLotteryConfig);


// =====================================================
// USER ROUTES
// =====================================================

// GET my lottery entries
// GET /api/lottery-config/my-entries
router.get(
  "/my-entries",
  authMiddleware,
  getMyLotteryEntries
);

// ADD lottery entry
// POST /api/lottery-config/entry
router.post(
  "/entry",
  authMiddleware,
  addUserLotteryEntry
);


// =====================================================
// ADMIN ROUTES
// =====================================================

// CREATE lottery config
// POST /api/lottery-config
router.post(
  "/",
  authMiddleware,
  createLotteryConfig
);

// GET all lottery configs
// GET /api/lottery-config
router.get(
  "/all",
  authMiddleware,
  getAllLotteryConfigs
);

// GET lottery config by ID
// GET /api/lottery-config/:id
router.get(
  "/:id",
  authMiddleware,
  getLotteryConfigById
);

// ACTIVATE lottery config
// PATCH /api/lottery-config/:id/activate
router.patch(
  "/:id/activate",
  authMiddleware,
  activateLotteryConfig
);

// UPDATE user entry status
// PATCH /api/lottery-config/:configId/entry/:entryId/status
router.patch(
  "/:configId/entry/:entryId/status",
  authMiddleware,
  updateEntryStatus
);

// DELETE lottery config
// DELETE /api/lottery-config/:id
router.delete(
  "/:id",
  authMiddleware,
  deleteLotteryConfig
);

module.exports = router;