console.log("✅ autoAuction cron file loaded");

const cron = require("node-cron");
const Product = require("../models/Product");
const sendMail = require("../utils/sendMail");

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🔁 Auto-auction check running...");

    const THIRTY_DAYS_AGO = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    const products = await Product.find({
      status: "active",
      createdAt: { $lte: THIRTY_DAYS_AGO },
    });

    for (const product of products) {
      const startingBid = Math.floor(product.price * 0.5);

      product.status = "auction";
      product.originalPrice = product.price;
      product.currentBid = startingBid;
      product.auctionStartAt = new Date();
      product.auctionEndAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );

      await product.save();

      // 📧 Notify seller
      try {
        await sendMail({
          to: product.sellerEmail,
          subject: "Your item is now in auction 🐝",
          text: `Hi!

Your product "${product.title}" was unsold for 30 days and has now moved to auction.

Starting price: ₹${startingBid}
Auction ends on: ${product.auctionEndAt.toDateString()}

Regards,
SellBee 🐝`,
        });
      } catch (emailErr) {
        console.error("📧 Email failed (ignored):", emailErr.message);
      }
    }
  } catch (err) {
    console.error("❌ Auto-auction error:", err);
  }
});
