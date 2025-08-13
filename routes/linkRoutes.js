const express = require("express");
const linkController = require("../controller/linkController");
const authController = require("../controller/authController");

const router = express.Router();

router.post("/createlink", authController.protect, linkController.createLink);
router.get("/", authController.protect, linkController.getUserLinks);
router.delete("/:id", authController.protect, linkController.deleteUserLink);
router.get(
  "/:id/visits",
  authController.protect,
  linkController.getLinkVisitData
);

module.exports = router;
