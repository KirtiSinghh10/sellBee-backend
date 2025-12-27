import cors from "cors";

app.use(cors({
  origin: "*",
}));

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* ================= CORS (MUST BE FIRST) ================= */
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:8084"],
    credentials: true,
  })
);

/* ================= BODY PARSERS ================= */
app.use(express.json());

/* ================= ROUTES ================= */
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/products", productRoutes);
app.use("/auth", authRoutes);
app.use("/auction", auctionRoutes);
app.use("/users", userRoutes);

/* ================= MULTER ERROR HANDLER (CRITICAL) ================= */
/* 🔴 MUST COME AFTER ROUTES */
app.use(require("./middleware/multerError"));

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({ status: "SellBee backend running 🐝" });
});

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully 🐝");

    // 🔁 START CRON JOBS ONLY AFTER DB IS READY
    require("./cron/autoAuction");
    require("./cron/endAuction");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // 🔒 fail fast in prod
  });

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
