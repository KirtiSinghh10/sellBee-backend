const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },

    category: String,
    condition: String,

    sellerCollegeId: {
  type: String,
  required: true,
},

    sellerEmail: String,

    status: {
      type: String,
      enum: ["active", "sold", "auction"],
      default: "active",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
