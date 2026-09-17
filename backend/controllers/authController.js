const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const User = require("../models/userModel");

// =======================
// REGISTER
// =======================
const register = async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    // Validation
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

    // Check existing mobile
    const existingUser = await User.findOne({ mobile });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      uuid: uuidv4(),
      name,
      mobile,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        uuid: user.uuid,
        name: user.name,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    // Duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Mobile number or UUID already exists",
      });
    }

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

    // Validation
    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile and password are required",
      });
    }

    // Get user + password
    const user = await User.findOne({ mobile }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile or password",
      });
    }

    // Compare password
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

    // Create JWT
    const token = jwt.sign(
      {
        uuid: user.uuid,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Save token in cookie
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
    const user = await User.findOne({
      uuid: req.user.uuid,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        uuid: user.uuid,
        name: user.name,
        mobile: user.mobile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
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
