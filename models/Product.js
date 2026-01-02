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
    sellerPhone: String,

    status: {
      type: String,
      enum: ["active", "auction", "sold"],
      default: "active",
    },

    images: [
      {
        url: String,
        public_id: String,
      },
    ],

    /* ================= AUCTION CORE ================= */

    originalPrice: Number,

    currentBid: {
      type: Number,
      default: 0,
    },

    auctionStartAt: Date,
    auctionEndAt: Date,
    auctionEndedAt: Date,

    finalPrice: Number,

    winnerEmail: String,

    /* ================= BIDDING ================= */

    bids: [
      {
        bidderName: String,
        bidderEmail: String,
        bidderPhone: String,
        amount: Number,
        bidAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /* ================= FLAGS ================= */

    isNegotiable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
