console.log("✅ autoAuction cron file loaded");
import cron from "node-cron";
import Product from "../models/Product.js";
import sendMail from "../utils/sendMail.js";  

cron.schedule("0 0 * * *", async () => { // once daily at midnight
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
      product.status = "auction";
      product.originalPrice = product.price;
      product.currentBid = product.price;
      product.auctionEndAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );

      await product.save();

      //mailing sellers

      try {
        await sendMail({
          to: product.sellerEmail,
          subject: "Your item is now in auction 🐝",
          text: `Hi!
Your product "${product.title}" was unsold for 30 days
and has now moved to auction.
Auction ends on ${product.auctionEndAt.toDateString()}.`,
        });
      } catch (emailErr) {
        console.error("📧 Email failed (ignored):", emailErr.message);
      }
    }


  } catch (err) {
    console.error("❌ Auto-auction error:", err);
  }
});
