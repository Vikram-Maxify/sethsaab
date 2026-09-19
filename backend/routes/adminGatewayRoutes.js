const express = require("express");
const {
  createGateway,
  getGatewaysAdmin,
  getGatewaysUser,
  updateGateway,
  toggleGatewayStatus,
  deleteGateway,
} = require("../controller/adminGatewayController.js");
const adminMiddleware = require("../middleware/adminMiddleware.js");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Client / User Routes (requires standard authentication)
router.get("/gateway", authMiddleware, getGatewaysUser);

// Admin Control Routes (requires admin authentication)
router.post("/admin/gateway", adminMiddleware, createGateway);
router.get("/admin/gateway", adminMiddleware, getGatewaysAdmin);
router.put("/admin/gateway/:id", adminMiddleware, updateGateway);
router.patch("/admin/gateway/:id/status", adminMiddleware, toggleGatewayStatus);
router.delete("/admin/gateway/:id", adminMiddleware, deleteGateway);

module.exports = router;