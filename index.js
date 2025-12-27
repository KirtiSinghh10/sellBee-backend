import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

/* ================= CONFIG ================= */
dotenv.config();

/* ================= APP INIT ================= */
const app = express();

/* ================= CORS ================= */
/* Open for now, we’ll lock it after frontend deploy */
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

/* ================= BODY PARSERS ================= */
app.use(express.json());

/* ================= ROUTES ================= */
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import userRoutes from "./routes/userRoutes.js";

app.use("/products", productRoutes);
app.use("/auth", authRoutes);
app.use("/auction", auctionRoutes);
app.use("/users", userRoutes);

/* ================= MULTER ERROR HANDLER ================= */
/* MUST be after routes */
import multerErrorHandler from "./middleware/multerError.js";
app.use(multerErrorHandler);

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({ status: "SellBee backend running 🐝" });
});

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected successfully 🐝");

    // Cron jobs (ES module imports)
    await import("./cron/autoAuction.js");
    await import("./cron/endAuction.js");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
