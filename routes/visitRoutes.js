const express = require("express");
const visitController = require("../controller/visitController");
const authController = require("../controller/authController");

const router = express.Router();

router.post("/:slug/visit", visitController.recordVisit);
router.delete("/:id", authController.protect, visitController.deleteVisit);

module.exports = router;
