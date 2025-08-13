const Link = require("../models/linkModel");
const User = require("../models/userModel");
const Visit = require("../models/visitModel");

exports.recordVisit = async (req, res) => {
  const { slug } = req.params;
  const {
    ip,
    city,
    region,
    country,
    org,
    timezone,
    ipLat,
    ipLon,
    useragent,
    lat,
    lng,
    gpsAddress,
    consented,
  } = req.body;

  try {
    // Find the link by slug
    const link = await Link.findOne({ slug });
    if (!link) {
      return res
        .status(404)
        .json({ status: "fail", message: "Link not found" });
    }

    // Create visit document
    const visit = await Visit.create({
      link: link._id,
      ip,
      city,
      region,
      country,
      org,
      timezone,
      ipCoords: ipLat && ipLon ? { lat: ipLat, lon: ipLon } : undefined,
      useragent,
      coords: lat && lng ? { lat, lng } : undefined,
      gpsAddress,
      consented: !!consented,
    });

    res.status(201).json({ status: "success", data: { visitId: visit._id } });
  } catch (err) {
    console.error("Error recording visit:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

// delete visit
exports.deleteVisit = async (req, res) => {
  try {
    // Find the link by id and owner
    const link = await Link.findOne({
      ownerId: req.user._id,
    });
    if (!link) {
      return res.status(404).json({
        status: "fail",
        message: "Link not found or you don't have permission",
      });
    }

    // Delete the specific visit by its id and belonging to the link
    const visit = await Visit.findOneAndDelete({
      _id: req.params.id,
      link: link._id,
    });

    if (!visit) {
      return res
        .status(404)
        .json({ status: "fail", message: "Visit not found" });
    }

    res.status(200).json({ status: "success", message: "Visit deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
