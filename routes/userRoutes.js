const express = require("express");
const protect = require("../middleware/auth");
const router = express.Router();

/* ================= UPDATE PROFILE ================= */
router.put("/me", protect, async (req, res) => {
  try {
    console.log("EDIT PROFILE HIT");
    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    const user = req.user;

    user.name = req.body.name ?? user.name;
    user.phone = req.body.phone ?? user.phone;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      collegeId: updatedUser.collegeId,
      phone: updatedUser.phone,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
