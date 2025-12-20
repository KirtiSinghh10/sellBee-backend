const express = require("express");
const Product = require("../models/Product");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

/* ================= CREATE LISTING WITH IMAGES ================= */
router.post(
  "/add",
  auth,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const {
        title,
        description,
        price,
        category,
        condition,
      } = req.body;

      if (!title || !price) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const images =
        req.files?.map((file) => ({
          url: file.path,
          public_id: file.filename,
        })) || [];

      const product = new Product({
        title,
        description,
        price,
        category,
        condition,
        sellerCollegeId: req.user.collegeId,
        sellerEmail: req.user.email,
        images,
      });

      await product.save();
      res.status(201).json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create listing" });
    }
  }
);


/* ================= GET ALL PRODUCTS ================= */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/* ================= GET USER PRODUCTS ================= */
router.get("/mine/:collegeId", async (req, res) => {
  try {
    const products = await Product.find({
      sellerCollegeId: req.params.collegeId,
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user listings" });
  }
});

/* ================= GET SINGLE PRODUCT ================= */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch listing" });
  }
});

/* ================= UPDATE LISTING ================= */
router.put("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // 🔐 ownership check
    if (product.sellerCollegeId !== req.user.collegeId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🚫 lock edits once auction starts
    if (product.status === "auction") {
      return res.status(403).json({
        message: "Cannot edit product once auction has started",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "price",
      "category",
      "condition",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update listing" });
  }
});

/* ================= DELETE LISTING ================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }

    // 🔐 ownership check
    if (product.sellerCollegeId !== req.user.collegeId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🚫 block delete during auction
    if (product.status === "auction") {
      return res.status(403).json({
        message: "Cannot delete product during auction",
      });
    }

    // 🔥 delete images from Cloudinary
    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await product.deleteOne();
    res.json({ message: "Listing + images deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

/* ================= MARK AS SOLD ================= */
router.patch("/:id/sold", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // 🔐 ownership check
    if (product.sellerCollegeId !== req.user.collegeId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    product.status = "sold";
    await product.save();

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark as sold" });
  }
});

/* ================= GET AUCTION PRODUCTS ================= */
router.get("/auction/all", async (req, res) => {
  try {
    const products = await Product.find({
      status: "auction",
    }).sort({ auctionEndAt: 1 });

    const auctions = products.map((p) => ({
      _id: p._id,
      title: p.title,
      basePrice: p.originalPrice,
      currentBid: p.currentBid,
      originalPrice: p.originalPrice,
      category: p.category,
      images: p.images,
      sellerCollegeId: p.sellerCollegeId,
      endsAt: p.auctionEndAt,
      totalBids: p.currentBid > p.originalPrice ? 1 : 0,
    }));

    res.json(auctions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch auctions" });
  }
});

module.exports = router;
