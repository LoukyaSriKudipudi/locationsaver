const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  url: {
    type: String,
    unique: true,
  },
  title: { type: String, default: "Untitled Link" },
  createdAt: { type: Date, default: Date.now },
});

const Link = mongoose.model("Link", linkSchema);

module.exports = Link;
