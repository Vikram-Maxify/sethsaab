const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

const getUsersCollection = () => {
  return mongoose.connection.db.collection("users");
};

// =======================
// REGISTER
// =======================
const register = async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, mobile and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const users = getUsersCollection();

    const existingUser = await users.findOne({ mobile });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const uuid = uuidv4();

    const user = {
      uuid,
      name,
      mobile,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await users.insertOne(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        uuid,
        name,
        mobile,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================
// LOGIN
// =======================
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile and password are required",
      });
    }

    const users = getUsersCollection();

    const user = await users.findOne({ mobile });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile or password",
      });
    }

    const token = jwt.sign(
      {
        uuid: user.uuid,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Save JWT in cookie
    res.cookie("usertoken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        uuid: user.uuid,
        name: user.name,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================
// GET PROFILE
// =======================
const getProfile = async (req, res) => {
  try {
    const users = getUsersCollection();

    const user = await users.findOne(
      { uuid: req.user.uuid },
      {
        projection: {
          _id: 0,
          password: 0,
        },
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================
// LOGOUT
// =======================
const logout = async (req, res) => {
  try {
    // Remove usertoken cookie
    res.clearCookie("usertoken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout,
};