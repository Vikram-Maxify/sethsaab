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
// USER LOTTERY ENTRY
// =====================================================

// User sirf number + amount bhejega
// Market + month + year automatically create/find hoga
//
// POST /api/lottery/entry

router.post(
    "/entry",
    authMiddleware,
    addUserLotteryEntry
);

// =====================================================
// GET ALL LOTTERY CONFIGS
// =====================================================

// GET /api/lottery

router.get(
    "/",
    authMiddleware,
    getAllLotteryConfigs
);

// =====================================================
// GET ACTIVE LOTTERY
// =====================================================

// GET /api/lottery/active

router.get(
    "/active",
    authMiddleware,
    getActiveLotteryConfig
);

// =====================================================
// GET LOTTERY CONFIG BY ID
// =====================================================

// GET /api/lottery/:id

router.get(
    "/:id",
    authMiddleware,
    getLotteryConfigById
);

// =====================================================
// CREATE LOTTERY CONFIG
// =====================================================
//
// Admin manually create kar sakta hai agar zarurat ho.
//
// POST /api/lottery
//
// Body:
// {
//   "marketName": "Delhi Market",
//   "month": 9,
//   "year": 2026
// =====================================================

router.post(
    "/",
    authMiddleware,
    createLotteryConfig
);

// =====================================================
// ACTIVATE LOTTERY
// =====================================================

// PATCH /api/lottery/:id/activate

router.patch(
    "/:id/activate",
    authMiddleware,
    activateLotteryConfig
);

// =====================================================
// DEACTIVATE LOTTERY
// =====================================================

// PATCH /api/lottery/:id/deactivate

router.patch(
    "/:id/deactivate",
    authMiddleware,
    deactivateLotteryConfig
);

// =====================================================
// UPDATE USER ENTRY
// =====================================================
//
// PUT /api/lottery/:id/users/:userEntryId
//
// Body:
// {
//   "number": "123456",
//   "amount": 100,
//   "status": "pending"
// =====================================================

router.put(
    "/:id/users/:userEntryId",
    authMiddleware,
    updateUserLotteryEntry
);

// =====================================================
// DELETE USER ENTRY
// =====================================================

// DELETE /api/lottery/:id/users/:userEntryId

router.delete(
    "/:id/users/:userEntryId",
    authMiddleware,
    deleteUserLotteryEntry
);

// =====================================================
// DELETE LOTTERY CONFIG
// =====================================================

// DELETE /api/lottery/:id

router.delete(
    "/:id",
    authMiddleware,
    deleteLotteryConfig
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
