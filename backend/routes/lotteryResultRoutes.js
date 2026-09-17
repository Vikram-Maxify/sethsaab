const express = require("express");

const {
  createResult,
  getAllResults,
  getResultById,
  publishResult,
  unpublishResult,
  updateResult,
  deleteResult,
  checkNumber,
} = require("../controllers/lotteryResultController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// ADMIN RESULT ROUTES
// ==========================================

// Create result
router.post(
  "/create",
  authMiddleware,
  createResult
);

// Get all results
router.get(
  "/all",
  authMiddleware,
  getAllResults
);

// Test number matching
router.post(
  "/check-number",
  authMiddleware,
  checkNumber
);

// Get result by ID
router.get(
  "/:id",
  authMiddleware,
  getResultById
);

// Update result
router.patch(
  "/:id",
  authMiddleware,
  updateResult
);

// Publish result
router.patch(
  "/:id/publish",
  authMiddleware,
  publishResult
);

// Unpublish result
router.patch(
  "/:id/unpublish",
  authMiddleware,
  unpublishResult
);

// Delete result
router.delete(
  "/:id",
  authMiddleware,
  deleteResult
);

module.exports = router;