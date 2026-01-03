const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

module.exports = async ({ to, subject, text, html }) => {
  try {
    console.log("📧 Attempting to send email to:", to);
    console.log("Using SMTP user:", process.env.BREVO_SMTP_USER);
    console.log("From email:", process.env.BREVO_FROM_EMAIL);
    
    const info = await transporter.sendMail({
      from: `"SellBee" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    throw error;
  }
};