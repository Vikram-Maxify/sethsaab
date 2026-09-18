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
// CREATE MONTHLY LOTTERY CONFIG
// =====================================================

router.post(
  "/create",
  authMiddleware,
  createLotteryConfig
);

// =====================================================
// GET ALL LOTTERY CONFIGS
// =====================================================

router.get(
  "/all",
  authMiddleware,
  getAllLotteryConfigs
);

// =====================================================
// GET ACTIVE LOTTERY CONFIG
// =====================================================

router.get(
  "/active",
  authMiddleware,
  getActiveLotteryConfig
);

// =====================================================
// GET SINGLE LOTTERY CONFIG
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  getLotteryConfigById
);

// =====================================================
// ADD USER ENTRY TO SPECIFIC DATE
// =====================================================
//
// POST
// /api/lottery/:id/date/:dateId/user
//
// Body:
// {
//   "numbers": [12,25,31,44,56,78],
//   "amount": 100
// }
//
// userId JWT se automatically aayega.
//

router.post(
  "/:id/date/:dateId/user",
  authMiddleware,
  addUserLotteryEntry
);

// =====================================================
// UPDATE USER LOTTERY ENTRY
// =====================================================
//
// PATCH
// /api/lottery/:id/date/:dateId/user/:userEntryId
//
// Body can contain:
// {
//   "numbers": [1,2,3,4,5,6],
//   "amount": 200,
//   "status": "win"
// }

router.patch(
  "/:id/date/:dateId/user/:userEntryId",
  authMiddleware,
  updateUserLotteryEntry
);

// =====================================================
// DELETE USER LOTTERY ENTRY
// =====================================================

router.delete(
  "/:id/date/:dateId/user/:userEntryId",
  authMiddleware,
  deleteUserLotteryEntry
);

// =====================================================
// ACTIVATE LOTTERY CONFIG
// =====================================================

router.patch(
  "/:id/activate",
  authMiddleware,
  activateLotteryConfig
);

// =====================================================
// DEACTIVATE LOTTERY CONFIG
// =====================================================

router.patch(
  "/:id/deactivate",
  authMiddleware,
  deactivateLotteryConfig
);

// =====================================================
// DELETE MONTHLY LOTTERY CONFIG
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  deleteLotteryConfig
);

module.exports = router;