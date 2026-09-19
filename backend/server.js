require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"])

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const amountRoutes = require("./routes/amountRoutes")

const lotteryConfigRoutes = require("./routes/lotteryConfigRoutes");

const lotteryResultRoutes = require("./routes/lotteryResultRoutes");

const depositRoutes = require("./routes/depositRoutes")



const app = express();

// =======================
// CORS
// =======================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// =======================
// MIDDLEWARE
// =======================

app.use(express.json());
app.use(cookieParser());

// =======================
// ROUTES
// =======================

app.use("/api/auth", authRoutes);

app.use("/api", amountRoutes);

app.use("/api", depositRoutes);


app.use(
    "/api/lottery",
    lotteryConfigRoutes
);

app.use(
    "/api/lottery-result",
    lotteryResultRoutes
);

// Connect DB
connectDB();

// =======================
// SERVER
// =======================

const PORT = process.env.PORT || 5099;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
