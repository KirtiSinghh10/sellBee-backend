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

    images: [
      {
        url: String,
        public_id: String,
      },
    ],

    auctionEndAt: Date,
    currentBid: {
      type: Number,
      default: 0,
    },

    sellerPhone: {
  type: String,
},


    winnerEmail: {
  type: String,
},

finalPrice: {
  type: Number,
},

auctionEndedAt: {
  type: Date,
},

isNegotiable: {
  type: Boolean,
  default: true, // negotiable by default
},



    originalPrice: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
