const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

/* CREATE LISTING */
router.post("/add", async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      sellerCollegeId,
      sellerEmail,
    } = req.body;

    if (!title || !price || !sellerCollegeId) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const product = new Product({
      title,
      description,
      price,
      category,
      condition,
      sellerCollegeId,
      sellerEmail,
    });

    await product.save();

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create listing",
    });
  }
});

/* GET listings of logged-in user (by collegeId) */
router.get("/mine/:collegeId", async (req, res) => {
  try {
    const { collegeId } = req.params;

    const products = await Product.find({
      sellerCollegeId: collegeId,
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch user listings",
    });
  }
});

module.exports = router;
