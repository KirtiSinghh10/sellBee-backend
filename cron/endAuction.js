console.log("✅ endAuction cron file loaded");
import cron from "node-cron";
import Product from "../models/Product.js";
import sendMail from "../utils/sendMail.js";


// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running end-auction cron");

  try {
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

      // 📧 Email seller
      await sendMail({
        to: product.sellerEmail,
        subject: "Your auction has ended 🐝",
        text: `Your product "${product.title}" sold for ₹${product.finalPrice}.`,
      });

      // 📧 Email winner (if exists)
      if (product.winnerEmail) {
        await sendMail({
          to: product.winnerEmail,
          subject: "You won the auction! 🎉",
          text: `You won "${product.title}" for ₹${product.finalPrice}.
Please contact the seller to complete the purchase.`,
        });
      }
    }

    console.log(`✅ ${products.length} auctions ended`);

  } catch (err) {
    console.error("❌ End-auction cron error:", err);
  }
});
