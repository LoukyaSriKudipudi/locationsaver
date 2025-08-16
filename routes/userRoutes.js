const express = require("express");
const userController = require("../controller/userController");
const authController = require("../controller/authController");

const router = express.Router();

router.get("/", authController.protect, userController.getUser);
router.get(
  "/delete-preview",
  authController.protect,
  userController.deletePreview
);
router.delete("/delete", authController.protect, userController.deleteAccount);

router.patch("/", authController.protect, userController.editUser);
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/me", authController.protect, userController.getUserDetails);
router.post("/forgotpassword", userController.forgotPassword);
router.patch("/resetpassword/:token", userController.resetPassword);
router.get("/resetpassword/:token", userController.resetPasswordPage);
module.exports = router;

//   Project: Location Saver
//   Designed & Developed by Loukya Sri Kudipudi
//   Built with ❤️ while learning Node.js
