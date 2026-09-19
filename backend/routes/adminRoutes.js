const express = require("express");
const router = express.Router();

// Controllers
const {
  getDashboardStats,
} = require("../controllers/adminDashboardController");

const {
  getAllUsers,
  getSingleUser,
  updateUserWallet,
} = require("../controllers/adminUserController");

const {
  getAllDeposits,
  getSingleDeposit,
  updateDepositStatus,
  getDepositStats,
} = require("../controllers/adminDepositController.js");

const {
  getAllConfigs,
  getSingleConfig,
  createConfig,
  updateConfig,
  toggleConfigActive,
  deleteConfig,
} = require("../controllers/adminConfigController");

const {
  getAllEntries,
  getEntriesByConfig,
  getEntryStats,
} = require("../controllers/adminEntryController");

const {
  getAllResults,
  getSingleResult,
  createResult,
  updateResult,
  toggleResultPublish,
  deleteResult,
} = require("../controllers/adminResultController");
const authMiddleware = require("../middleware/authMiddleware.js");

// Auth middleware (apna existing middleware use karo)

// =====================================================
// DASHBOARD
// =====================================================
router.get(
  "/dashboard/stats",
  authMiddleware,
  getDashboardStats
);

// =====================================================
// USERS
// =====================================================
router.get("/users", authMiddleware, getAllUsers);
router.get("/users/:id", authMiddleware, getSingleUser);
router.put(
  "/users/:id/wallet",
  authMiddleware,
  updateUserWallet
);

// =====================================================
// DEPOSITS
// =====================================================
router.get("/deposits", authMiddleware, getAllDeposits);
router.get(
  "/deposits/stats",
  authMiddleware,
  getDepositStats
);
router.get(
  "/deposits/:id",
  authMiddleware,
  getSingleDeposit
);
router.put(
  "/deposits/:id/status",
  authMiddleware,
  updateDepositStatus
);

// =====================================================
// LOTTERY CONFIGS
// =====================================================
router.get("/configs", authMiddleware, getAllConfigs);
router.get(
  "/configs/:id",
  authMiddleware,
  getSingleConfig
);
router.post("/configs", authMiddleware, createConfig);
router.put(
  "/configs/:id",
  authMiddleware,
  updateConfig
);
router.patch(
  "/configs/:id/toggle",
  authMiddleware,
  toggleConfigActive
);
router.delete(
  "/configs/:id",
  authMiddleware,
  deleteConfig
);

// =====================================================
// ENTRIES
// =====================================================
router.get("/entries", authMiddleware, getAllEntries);
router.get(
  "/entries/stats",
  authMiddleware,
  getEntryStats
);
router.get(
  "/entries/config/:configId",
  authMiddleware,
  getEntriesByConfig
);

// =====================================================
// RESULTS
// =====================================================
router.get("/results", authMiddleware, getAllResults);
router.get(
  "/results/:id",
  authMiddleware,
  getSingleResult
);
router.post("/results", authMiddleware, createResult);
router.put(
  "/results/:id",
  authMiddleware,
  updateResult
);
router.patch(
  "/results/:id/toggle",
  authMiddleware,
  toggleResultPublish
);
router.delete(
  "/results/:id",
  authMiddleware,
  deleteResult
);

module.exports = router;