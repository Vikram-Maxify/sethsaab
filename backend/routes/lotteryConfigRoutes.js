const express = require("express");

const {
  createLotteryConfig,
  getAllLotteryConfigs,
  getLotteryConfigById,
  getActiveLotteryConfig,
  activateLotteryConfig,
  deactivateLotteryConfig,
  updateLotteryDate,
  deleteLotteryConfig,
} = require("../controllers/lotteryConfigController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create monthly configuration
router.post(
  "/create",
  authMiddleware,
  createLotteryConfig
);

// Get all configurations
router.get(
  "/all",
  authMiddleware,
  getAllLotteryConfigs
);

// Get active configuration
router.get(
  "/active",
  getActiveLotteryConfig
);

// Get single configuration
router.get(
  "/:id",
  authMiddleware,
  getLotteryConfigById
);

// Activate
router.patch(
  "/:id/activate",
  authMiddleware,
  activateLotteryConfig
);

// Deactivate
router.patch(
  "/:id/deactivate",
  authMiddleware,
  deactivateLotteryConfig
);

// Update date numbers / amount / status
router.patch(
  "/:id/date/:dateId",
  authMiddleware,
  updateLotteryDate
);

// Delete
router.delete(
  "/:id",
  authMiddleware,
  deleteLotteryConfig
);

module.exports = router;