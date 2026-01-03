const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

module.exports = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: "SellBee <noreply@sellbee.app>",
    to,
    subject,
    text,
    html,
  });
};
