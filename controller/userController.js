const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const sendResetEmail = require("../utils/email");
const path = require("path");

// JWT token generator
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Unified success response
const successResponse = (statusCode, res, { token, data, message }) => {
  const response = { status: "success" };
  if (token) response.token = token;
  if (data) response.data = data;
  if (message) response.message = message;
  return res.status(statusCode).json(response);
};

// Unified fail response
const failResponse = (statusCode, res, err) => {
  return res.status(statusCode).json({
    status: "fail",
    error: err.message || err,
  });
};

// Signup
exports.signup = async (req, res) => {
  try {
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
    const token = signToken(user.id);
    return successResponse(201, res, { token, data: user });
  } catch (err) {
    return failResponse(400, res, err);
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return failResponse(
        400,
        res,
        new Error("Please provide email and password")
      );
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.checkPassword(password, user.password))) {
      return failResponse(401, res, new Error("Incorrect email or password"));
    }

    const token = signToken(user._id);
    return successResponse(200, res, { token, data: user });
  } catch (err) {
    return failResponse(401, res, err);
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  try {
    if (!user) {
      return failResponse(
        404,
        res,
        new Error("There is no user with this email address")
      );
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetpassword/${resetToken}`;

    try {
      await sendResetEmail(user.email, resetURL, user.name);
    } catch (err) {
      console.error("Email sending failed:", err);
      return failResponse(500, res, new Error("Could not send reset email"));
    }

    return successResponse(200, res, {
      message: "Password reset link generated",
      data: { resetURL },
    });
  } catch (err) {
    if (user) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
    return failResponse(500, res, err);
  }
};

// Get user details
exports.getUserDetails = (req, res) => {
  try {
    return successResponse(200, res, { data: req.user });
  } catch (err) {
    return failResponse(401, res, err);
  }
};

// resetpassword
const crypto = require("crypto");

exports.resetPassword = async (req, res) => {
  try {
    // 1) Hash the token from the URL before checking DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // 2) Find the user with this token and check expiry
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Token is invalid or has expired",
      });
    }

    // 3) Set the new password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 4) Generate JWT token and send response
    const token = signToken(user._id);
    successResponse(200, res, { message: "Password reset successful", token });
  } catch (err) {
    failResponse(400, res, err);
  }
};

// resetPasswordPage
exports.resetPasswordPage = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Token is invalid or has expired",
      });
    }
    res.sendFile(path.join(__dirname, "../public/resetPassword.html"));
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
};
