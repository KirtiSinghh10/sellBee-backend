const express = require("express");
const User = require("../models/User");

const protect = require("../middleware/auth");
const router = express.Router();

/* ================= GET TESTIMONIALS (PUBLIC) ================= */
router.get("/testimonials", async (req, res) => {
  try {
    const users = await User.find(
      { testimonial: { $exists: true, $ne: "" } },
      { name: 1, testimonial: 1 }
    ).limit(6);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch testimonials" });
  }
});


/* ================= UPDATE PROFILE ================= */
router.put("/me", protect, async (req, res) => {
  try {
    console.log("EDIT PROFILE HIT");
    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    const user = req.user;

    user.name = req.body.name ?? user.name;
    user.phone = req.body.phone ?? user.phone;
    user.testimonial = req.body.testimonial ?? user.testimonial;
    const updatedUser = await user.save();

    res.json({
  user: {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    collegeId: updatedUser.collegeId,
    testimonial: updatedUser.testimonial,
    phone: updatedUser.phone,
  },
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
