const express = require("express");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/:id/bid", auth, async (req, res) => {
  try {
    let { amount } = req.body;
    amount = Number(amount);

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid bid amount" });
    }

    const product = await Product.findById(req.params.id);

    if (!product || product.status !== "auction") {
      return res.status(400).json({ message: "Auction not active" });
    }

    if (new Date() > product.auctionEndAt) {
      return res.status(400).json({ message: "Auction ended" });
    }

    if (product.sellerCollegeId === req.user.collegeId) {
      return res.status(403).json({ message: "Seller cannot bid" });
    }

    if (amount < product.currentBid + 10) {
      return res.status(400).json({
        message: `Minimum bid is ₹${product.currentBid + 10}`,
      });
    }

    product.currentBid = amount;

    product.bids.push({
      bidderName: req.user.name,
      bidderEmail: req.user.email,
      bidderPhone: req.user.phone,
      amount,
    });

    product.winnerEmail = req.user.email;

    await product.save();
    res.json({ message: "Bid placed", currentBid: amount });
  } catch (err) {
    console.error("❌ BID ERROR:", err);
    res.status(500).json({ message: "Bid failed" });
  }
});

module.exports = router;

