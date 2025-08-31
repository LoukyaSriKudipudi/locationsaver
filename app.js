const express = require("express");
const helmet = require("helmet");
const xss = require("xss");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/userRoutes");
const linkRoutes = require("./routes/linkRoutes");
const visitRoutes = require("./routes/visitRoutes");
const linkController = require("./controller/linkController");

const cors = require("cors");
const path = require("path");

// Load and launch bot once
require("./utils/bot");

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Security middleware
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      frameSrc: [
        "'self'",
        "https://maps.google.com",
        "https://www.google.com",
        "https://maps.google.com",
        "https://maps.googleapis.com",
      ],
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://ipwhois.app/",
        "https://ipapi.co/json/",
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
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
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

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/links", linkRoutes);
app.use("/api/v1/visits", visitRoutes);
app.get("/r/:slug", linkController.getCapture);
app.use("/r", visitRoutes);
app.use(express.static(path.join(__dirname, "public")));

app.get("/ping", (req, res) => {
  res.status(200).json({ status: "success" });
});

module.exports = app;
