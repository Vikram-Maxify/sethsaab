require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

// =======================
// DNS
// =======================
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// =======================
// CONFIG / ROUTES
// =======================
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const amountRoutes = require("./routes/amountRoutes");
const lotteryConfigRoutes = require("./routes/lotteryConfigRoutes");
const lotteryResultRoutes = require("./routes/lotteryResultRoutes");
const depositRoutes = require("./routes/depositRoutes");
const adminGatewayRoutes = require("./routes/adminGatewayRoutes");
const adminRoutes = require("./routes/adminRoutes");

// =======================
// APP
// =======================
const app = express();

// =======================
// CORS
// =======================
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =======================
// API ROUTES
// =======================

// Auth
app.use("/api/auth", authRoutes);

// Amount
app.use("/api", amountRoutes);

// Deposit
app.use("/api", depositRoutes);

// Lottery Config
app.use("/api/lottery", lotteryConfigRoutes);

// Lottery Result
app.use("/api/lottery-result", lotteryResultRoutes);

// Admin Gateway
app.use("/api", adminGatewayRoutes);

// Admin
app.use("/api", adminRoutes);

// =======================
// HEALTH CHECK
// =======================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    port: PORT,
  });
});

// =======================
// REACT FRONTEND
// =======================
const clientPath = path.join(__dirname, "../client/dist");

// Serve React static files
app.use(express.static(clientPath));

// React SPA fallback
app.use((req, res, next) => {
  // Don't return index.html for unknown API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "API route not found",
    });
  }

  res.sendFile(path.join(clientPath, "index.html"));
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// =======================
// PORT
// =======================
const PORT = process.env.PORT || 5099;

// =======================
// DATABASE + SERVER
// =======================
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log("=================================");
      console.log(`Server running on port ${PORT}`);
      console.log(`Local: http://localhost:${PORT}`);
      console.log("=================================");
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();
