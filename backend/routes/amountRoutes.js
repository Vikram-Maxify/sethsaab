const express = require("express");
const router = express.Router();

const {
  getAmount,
  updateAmount,
} = require("../controllers/amountController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get(
  "/amount",
  authMiddleware,
  getAmount
);

router.put(
  "/amount",
  authMiddleware,
  updateAmount
);

module.exports = router;