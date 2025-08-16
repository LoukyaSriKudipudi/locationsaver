const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const bot = require("../utils/bot");
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1) Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2) If no token found
    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    // 3) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      });
    }

    // 5) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfterJWT(decoded.iat)) {
      return res.status(401).json({
        status: "fail",
        message: "User recently changed password! Please log in again.",
      });
    }

    const message = `User Name: ${currentUser.name}`;

    await bot.telegram.sendMessage(process.env.Group_ID, message, {
      parse_mode: "Markdown",
    });
    // 6) Grant access
    req.user = currentUser;

    next();
  } catch (err) {
    console.error("JWT Protect Error:", err.message);
    return res.status(401).json({
      status: "fail",
      message:
        err.name === "TokenExpiredError"
          ? "Token has expired. Please log in again."
          : err.name === "JsonWebTokenError"
          ? "Invalid token. Please log in again."
          : "Authentication error. Please log in again.",
    });
  }
};

// <!--
//   Project: Location Saver
//   Designed & Developed by Loukya Sri Kudipudi
//   Built with ❤️ while learning Node.js
// -->
