console.log("✅ endAuction cron file loaded");

const cron = require("node-cron");
const Product = require("../models/Product");
const sendMail = require("../utils/sendMail");


cron.schedule("*/1 * * * *", async () => {
  try {
    console.log("⏰ Checking auctions to end...");

    const now = new Date();

    const products = await Product.find({
      status: "auction",
      auctionEndAt: { $lte: now },
    });

    for (const product of products) {
      product.status = "sold";
      product.finalPrice = product.currentBid;
      product.auctionEndedAt = now;
      await product.save();
    }

    console.log(`🏁 Ended ${products.length} auctions`);
  } catch (err) {
    console.error("❌ End-auction error:", err);
  }
});
