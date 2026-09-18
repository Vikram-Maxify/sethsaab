const express = require("express");

const {
  createLotteryConfig,
  addUserLotteryEntry,
  getMyLotteryEntries,
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

// USER
router.get(
  "/my-entries",
  authMiddleware,
  getMyLotteryEntries
);

// USER
router.post(
  "/entry",
  authMiddleware,
  addUserLotteryEntry
);

// ADMIN
router.post("/", authMiddleware, createLotteryConfig);

router.get("/all", authMiddleware, getAllLotteryConfigs);

router.get(
  "/active",
  authMiddleware,
  getActiveLotteryConfig
);

router.get(
  "/:id",
  authMiddleware,
  getLotteryConfigById
);

router.put(
  "/:id/activate",
  authMiddleware,
  activateLotteryConfig
);

router.put(
  "/:id/deactivate",
  authMiddleware,
  deactivateLotteryConfig
);

router.put(
  "/:id/user/:userEntryId",
  authMiddleware,
  updateUserLotteryEntry
);

router.delete(
  "/:id/user/:userEntryId",
  authMiddleware,
  deleteUserLotteryEntry
);

router.delete(
  "/:id",
  authMiddleware,
  deleteLotteryConfig
);

module.exports = router;