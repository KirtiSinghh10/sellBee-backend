const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

module.exports = async ({ to, subject, text }) => {
  await transporter.sendMail({
    from: `"SellBee 🐝" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
  });
};
