import express from "express";
import Product from "../models/Product.js";
import auth from "../middleware/auth.js";

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

    // 🚫 seller cannot bid
    if (product.sellerCollegeId === req.user.collegeId) {
      return res.status(403).json({ message: "Seller cannot bid" });
    }

    if (amount <= product.currentBid) {
      return res
        .status(400)
        .json({ message: "Bid must be higher than current bid" });
    }

    product.currentBid = amount;
    product.winnerEmail = req.user.email;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to place bid" });
  }
});

export default router;
