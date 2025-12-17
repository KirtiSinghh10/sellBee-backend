console.log("🔥 authRoutes.js LOADED");

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User.js");

const router = express.Router();

/* ================= SIGNUP ================= */
router.post("/signup", async (req, res) => {
  console.log("🔥 SIGNUP HIT", req.body);

  try {
    const { name, email, password, collegeId } = req.body;

    if (!name || !email || !password || !collegeId) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (!email.endsWith(".edu") && !email.endsWith(".ac.in")) {
      return res.status(400).json({
        message: "Only college email addresses allowed",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      collegeId,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        collegeId: user.collegeId, // ✅ FIX
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Signup failed",
    });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  console.log("🔥 LOGIN HIT", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        collegeId: user.collegeId, // ✅ FIX
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Login failed",
    });
  }
});

module.exports = router;
