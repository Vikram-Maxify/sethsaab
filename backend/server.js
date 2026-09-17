require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const dns = require('dns')

 dns.setServers(["1.1.1.1","8.8.8.8"])

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// Connect DB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});