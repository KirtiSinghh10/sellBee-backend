const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");

const router = express.Router();

/* =====================================================
   SEND OTP (SIGNUP STEP 1)
===================================================== */
router.post("/send-otp", async (req, res) => {
  try {
    const { name, email, password, collegeId, phone } = req.body;

    // 🔒 Basic validation
    if (!name || !email || !password || !collegeId || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🎓 College email check
    if (!email.endsWith(".edu") && !email.endsWith(".ac.in")) {
      return res
        .status(400)
        .json({ message: "Only college email addresses allowed" });
    }

    // 🔁 Allow resend OTP if user exists but NOT verified
    let user = await User.findOne({ email });

    if (user && user.isEmailVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧪 Create OR update unverified user
    if (!user) {
      user = new User({
        name,
        email,
        password: hashedPassword,
        collegeId,
        phone,
        isEmailVerified: false,
      });
    }

    user.otp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

     console.log("Sending OTP email to:", email);

    // 📧 Send OTP email
    await sendMail({
      to: email,
      subject: "SellBee Email Verification OTP",
      html: `
        <h2>SellBee Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      `,
    });

    console.log("✅ OTP email sent successfully");
    return res.json({ message: "OTP sent to college email" });
  } catch (err) {
    console.error("Send OTP Error:", err);
    console.error("Error details:", err.message); // Add this
    console.error("Error stack:", err.stack); // Add this
    return res.status(500).json({ 
      message: "Failed to send OTP",
      error: err.message // Add this for debugging (remove in production)
    });
  }
});
/* =====================================================
   VERIFY OTP (SIGNUP STEP 2)
===================================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (
      !user ||
      user.isEmailVerified ||
      user.otp !== otp ||
      user.otpExpiresAt < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ Mark email verified
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // 🔑 Issue JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        collegeId: user.collegeId,
      },
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
});

/* =====================================================
   LOGIN
===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔒 Block unverified users
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        collegeId: user.collegeId,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
