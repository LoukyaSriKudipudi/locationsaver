const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("Transporter error:", error);
  } else {
    console.log("Server is ready to send emails");
  }
});

// Example: sending mail
async function sendResetEmail(toEmail, resetURL, userName = "") {
  const mailOptions = {
    from: process.env.EMAIL,
    to: toEmail,
    subject: "Password Reset Link",
    html: `
        <p>Hello ${userName},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

module.exports = sendResetEmail;
