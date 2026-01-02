const express = require("express");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();

/* ================= PLACE BID ================= */
router.post("/:id/bid", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.status !== "auction") {
      return res.status(400).json({ message: "Product not in auction" });
    }

    if (new Date() > product.auctionEndAt) {
      return res.status(400).json({ message: "Auction already ended" });
    }

    // 🚫 Seller cannot bid
    if (product.sellerCollegeId === req.user.collegeId) {
      return res.status(403).json({ message: "Seller cannot bid" });
    }

    // 🔴 Minimum increment ₹10
    if (amount < product.currentBid + 10) {
      return res.status(400).json({
        message: "Minimum bid increment is ₹10",
      });
    }

    // ✅ Update bid
    product.currentBid = amount;

    product.bids.push({
      bidderName: req.user.name,
      bidderEmail: req.user.email,
      bidderPhone: req.user.phone,
      amount,
    });

    await product.save();

    return res.json({
      message: "Bid placed successfully",
      currentBid: product.currentBid,
    });
  } catch (err) {
    console.error("❌ BID ERROR:", err);
    return res.status(500).json({ message: "Failed to place bid" });
  }
});

module.exports = router;
