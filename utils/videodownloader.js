const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
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

// Handle video download
router.post("/download", (req, res) => {
  const videoUrl = req.body.url;
  const audioonly = req.body.audioonly;

  if (!videoUrl) return res.status(400).json({ message: "URL is required" });

  const fileExt = audioonly ? "mp3" : "mp4";
  const filePath = path.join(__dirname, `video_${Date.now()}.${fileExt}`);

  const ytDlpCommand = audioonly
    ? `yt-dlp -x --audio-format mp3 -o "${filePath}" "${videoUrl}"`
    : `yt-dlp -f mp4 -o "${filePath}" "${videoUrl}"`;

  exec(ytDlpCommand, async (err) => {
    if (err) {
      console.error("yt-dlp error:", err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res
        .status(500)
        .json({ message: "Download failed", error: err.message });
    }

    try {
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
        responseMessage = `File has been sent to https://t.me/loukyaecho group`;
      }

      res.status(200).json({ message: responseMessage });
    } catch (err) {
      console.error("Telegram upload error:", err);
      res
        .status(500)
        .json({ message: "Telegram upload failed", error: err.message });
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
});

module.exports = router;
