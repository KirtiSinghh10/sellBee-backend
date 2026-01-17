const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000);

  user.resetPasswordOtp = await bcrypt.hash(otp.toString(), 10);
  user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save();

  await sendMail({
    to: email,
    subject: "SellBee Password Reset OTP",
    html: `
      <h3>Password Reset Request</h3>
      <p>Your OTP is <b>${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });

  res.json({ message: "OTP sent to email" });
});

router.post("/verify-reset-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.resetPasswordOtp)
    return res.status(400).json({ message: "Invalid request" });

  if (Date.now() > user.resetPasswordOtpExpires)
    return res.status(400).json({ message: "OTP expired" });

  const isValid = await bcrypt.compare(
    otp.toString(),
    user.resetPasswordOtp
  );

  if (!isValid)
    return res.status(400).json({ message: "Invalid OTP" });

  res.json({ message: "OTP verified" });
});
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpires = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
});

/* =====================================================
   SEND OTP (SIGNUP STEP 1)
===================================================== */
router.post("/send-otp", async (req, res) => {
  try {
    const { name, email, password, collegeId, phone } = req.body;

    if (!name || !email || !password || !collegeId || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!email.endsWith(".edu") && !email.endsWith(".ac.in")) {
      return res
        .status(400)
        .json({ message: "Only college email addresses allowed" });
    }

    let user = await User.findOne({ email });

    if (user && user.isEmailVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 🆕 Create user only once
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        name,
        email,
        password: hashedPassword,
        collegeId,
        phone,
        isEmailVerified: false,
      });
    }

    user.otp = hashedOtp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    user.otpAttempts = 0;

    await user.save();

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

    return res.json({ message: "OTP sent to college email" });
  } catch (err) {
    console.error("Send OTP Error:", err.message);
    return res.status(500).json({ message: "Failed to send OTP" });
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
      !user.otp ||
      user.otpExpiresAt < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.otpAttempts >= 5) {
      return res.status(403).json({ message: "Too many attempts" });
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = undefined;

    await user.save();

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
    console.error("Verify OTP Error:", err.message);
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
    if (!user || !user.isEmailVerified) {
      return res.status(403).json({ message: "Invalid credentials" });
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
    console.error("Login Error:", err.message);
    return res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
