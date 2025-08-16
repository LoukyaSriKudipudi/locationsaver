const crypto = require("crypto");
const Link = require("../models/linkModel");
const path = require("path");
const Visit = require("../models/visitModel");

// create link
exports.createLink = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const slug = crypto.randomBytes(4).toString("hex"); // e.g. 'a1b2c3d4'
    const publicUrl = `${req.protocol}://${req.get("host")}/r/${slug}`;

    const link = await Link.create({
      ownerId: ownerId,
      slug,
      url: publicUrl,
      title: req.body.title,
    });

    res.status(201).json({
      status: "success",
      data: {
        id: link._id,
        slug: slug,
        url: publicUrl,
        title: link.title,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// capture html file
exports.getCapture = async (req, res) => {
  const { slug } = req.params;
  const link = await Link.findOne({ slug });

  if (!link) {
    return res.status(404).send("Link not found");
  }

  // Serve static capture page
  res.sendFile(path.join(__dirname, "../public/capture.html"));
};

// GET user links with visit count
exports.getUserLinks = async (req, res) => {
  try {
    const search = req.query.search.trim() || "";

    const query = { ownerId: req.user._id };
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const links = await Link.find(query).lean();

    // Add visit counts for each link
    const linksWithCounts = await Promise.all(
      links.map(async (link) => {
        const visitCount = await Visit.countDocuments({ link: link._id });
        return { ...link, visitCount };
      })
    );

    res.status(200).json({ status: "success", data: linksWithCounts });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteUserLink = async (req, res) => {
  try {
    // Find the link by id and owner
    const link = await Link.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!link) {
      return res.status(404).json({
        status: "fail",
        message: "Link not found or you do not have permission",
      });
    }

    // Delete the link
    await Link.findByIdAndDelete(link._id);
    await Visit.deleteMany({ link: link._id });

    res.status(200).json({ status: "success", data: link });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.deleteAllLinks = async (req, res) => {
  try {
    const links = await Link.find({ ownerId: req.user._id });
    const linkIds = links.map((link) => link._id);

    await Visit.deleteMany({ link: { $in: linkIds } });

    await Link.deleteMany({ ownerId: req.user._id });

    res.status(204).json({ status: "success" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// getLinkVisitData
exports.getLinkVisitData = async (req, res) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!link) {
      return res
        .status(404)
        .json({ status: "fail", message: "Link not found" });
    }

    const visitData = await Visit.find({ link: link._id });

    res.status(200).json({ status: "success", data: visitData });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
