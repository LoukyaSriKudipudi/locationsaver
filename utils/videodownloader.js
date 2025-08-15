const express = require("express");
const router = express.Router();
const youtubedl = require("@bochilteam/youtube-dl-exec");
const bot = require("./bot");
const path = require("path");
const fs = require("fs");

// Serve HTML page
router.get("/", (req, res) => {
  const htmlPath = path.resolve(
    __dirname,
    "../public/videodownloader/videodownloader.html"
  );
  res.sendFile(htmlPath);
});

// Handle video/audio download
router.post("/download", async (req, res) => {
  const videoUrl = req.body.url;
  const audioonly = !!req.body.audioonly;

  if (!videoUrl) {
    return res.status(400).json({ message: "URL is required" });
  }

  // Ensure downloads folder exists
  const downloadsFolder = path.join(__dirname, "downloads");
  if (!fs.existsSync(downloadsFolder)) fs.mkdirSync(downloadsFolder);

  const fileName = `video_${Date.now()}.${audioonly ? "mp3" : "mp4"}`;
  const filePath = path.join(downloadsFolder, fileName);

  // Make Windows paths safe
  const safeFilePath = `"${filePath}"`; // wrap in quotes

  try {
    // Download using youtube-dl-exec
    await youtubedl(videoUrl, {
      extractAudio: audioonly,
      audioFormat: audioonly ? "mp3" : undefined,
      format: audioonly ? undefined : "mp4",
      output: safeFilePath,
      rejectReturnCode: false,
      noCheckCertificate: true,
      shell: true, // required to handle spaces in paths
    });

    // Check file size
    const stats = fs.statSync(filePath);
    let responseMessage;

    if (stats.size > 50 * 1024 * 1024) {
      responseMessage = `File too large: ${(stats.size / 1024 / 1024).toFixed(
        2
      )} MB`;
      await bot.telegram.sendMessage(process.env.GROUP_ID, responseMessage);
    } else {
      if (audioonly) {
        await bot.telegram.sendAudio(process.env.GROUP_ID, {
          source: filePath,
        });
      } else {
        await bot.telegram.sendVideo(process.env.GROUP_ID, {
          source: filePath,
        });
      }
      responseMessage = `File has been sent to https://t.me/loukyaecho`;
    }

    res.status(200).json({ message: responseMessage });
  } catch (err) {
    console.error("Download/Telegram error:", err);
    res.status(500).json({
      message: "Download or Telegram upload failed",
      error: err.message,
    });
  } finally {
    // Clean up downloaded file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

module.exports = router;
