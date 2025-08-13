const mongoose = require("mongoose");

const VisitSchema = new mongoose.Schema({
  link: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Link",
    required: true,
  },

  ip: { type: String },
  city: { type: String },
  region: { type: String },
  country: { type: String },
  org: { type: String },
  timezone: { type: String },

  ipCoords: {
    lat: { type: Number },
    lon: { type: Number },
  },

  useragent: { type: String },

  coords: {
    lat: { type: Number },
    lng: { type: Number },
  },

  gpsAddress: { type: String },

  consented: { type: Boolean, default: false },

  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Visit", VisitSchema);

const Visit = mongoose.model("Visit", VisitSchema);

module.exports = Visit;
