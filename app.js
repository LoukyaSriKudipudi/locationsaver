const express = require("express");
const { Telegraf } = require("telegraf");
const helmet = require("helmet");
const xss = require("xss");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/userRoutes");
const linkRoutes = require("./routes/linkRoutes");
const visitRoutes = require("./routes/visitRoutes");
const linkController = require("./controller/linkController");

const app = express();
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.BOT_TOKEN);
const GROUP_ID = process.env.GROUP_ID;
bot.launch();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Security middleware
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      frameSrc: ["'self'", "https://maps.google.com", "https://www.google.com"],
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://ipapi.co",
        "https://nominatim.openstreetmap.org",
      ],
      scriptSrc: ["'self'"],
    },
  })
);

// Custom XSS sanitization middleware
app.use((req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = xss(obj[key]); // clean string
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]); // recursively sanitize objects
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

// Rate limiting
const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});
app.use("/api", limiter);
app.use("/r/:slug", async (req, res, next) => {
  try {
    const visitorIP = req.ip;
    const userAgent = req.get("User-Agent");
    await bot.telegram.sendMessage(
      GROUP_ID, // make sure this is set
      `🚀 New visit detected!\n🔗 req: ${req.protocol}://${req.get("host")}${
        req.originalUrl
      }\n🌍 IP: ${visitorIP}\n🖥 UA: ${userAgent}`
    );
  } catch (err) {
    console.error("Error sending Telegram message:", err);
  }
  next();
});
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/links", linkRoutes);
app.use("/api/v1/visits", visitRoutes);
app.get("/r/:slug", linkController.getCapture);
app.use("/r", visitRoutes);
app.use(express.static(path.join(__dirname, "public")));

app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "success",
  });
});

module.exports = app;
