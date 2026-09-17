const express = require("express");

const {
  register,
  login,
  getProfile,
  logout,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.post("/register", register);
router.post("/login", login);

// Protected
router.get("/profile", authMiddleware, getProfile);
router.post("/logout", authMiddleware, logout);

module.exports = router;