console.log("✅ endAuction cron file loaded");

const cron = require("node-cron");
const Product = require("../models/Product");
const sendMail = require("../utils/sendMail");

// Runs every minute (important for auctions)
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    const products = await Product.find({
      status: "auction",
      auctionEndAt: { $lte: now },
    });

    for (const product of products) {
      // 🔒 SAFETY GUARD — prevent double processing
      if (product.status !== "auction") continue;

      // 🔹 Sort bids (highest first)
      const sortedBids = [...product.bids].sort(
        (a, b) => b.amount - a.amount
      );

      const top5 = sortedBids.slice(0, 5);
      const winner = top5[0] || null;

      product.status = "sold";
      product.finalPrice = winner
        ? winner.amount
        : product.currentBid;

      product.winnerEmail = winner
        ? winner.bidderEmail
        : null;

      product.auctionEndedAt = now;

      await product.save();

      /* ================= SELLER EMAIL ================= */
      await sendMail({
        to: product.sellerEmail,
        subject: "Your auction has ended 🐝",
        html: `
          <h3>${product.title}</h3>
          <p><strong>Final price:</strong> ₹${product.finalPrice}</p>

          <h4>Top 5 bidders:</h4>
          <ul>
            ${
              top5.length
                ? top5
                    .map(
                      (b) =>
                        `<li>${b.bidderName} – ₹${b.amount} – ${b.bidderPhone}</li>`
                    )
                    .join("")
                : "<li>No bids received</li>"
            }
          </ul>
        `,
      });

      /* ================= WINNER EMAIL ================= */
      if (winner) {
        await sendMail({
          to: winner.bidderEmail,
          subject: "🎉 You won the auction on SellBee!",
          text: `Congratulations ${winner.bidderName}!

You won the auction for "${product.title}" at ₹${winner.amount}.

Please contact the seller to complete the purchase.`,
        });
      }
    }

    if (products.length > 0) {
      console.log(`✅ ${products.length} auctions ended`);
    }
  } catch (err) {
    console.error("❌ End-auction cron error:", err);
  }
});
