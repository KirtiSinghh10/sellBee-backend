require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* 🔥 MUST COME FIRST */
app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:8084"],
  credentials: true,
}));

app.use(express.json());

/* ROUTES */
const productRoutes = require("./routes/productRoutes");
app.use("/products", productRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

/* TEST */
app.get("/", (req, res) => {
  res.send("SellBee backend running");
});

/* DB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully 🐝"))
  .catch(console.error);

/* SERVER */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
