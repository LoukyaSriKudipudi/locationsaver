const express = require("express");
const visitController = require("../controller/visitController");
const authController = require("../controller/authController");

const router = express.Router();

router.post("/:slug/visit", visitController.recordVisit);
router.delete("/:id", authController.protect, visitController.deleteVisit);

module.exports = router;

//   Project: Location Saver
//   Designed & Developed by Loukya Sri Kudipudi
//   Built with ❤️ while learning Node.js
