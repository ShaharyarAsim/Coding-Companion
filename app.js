const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const requestIp = require("request-ip");

const userRoutes = require("./routes/user");
const codeCompilerRoutes = require("./routes/codeCompiler");
const rateLimiter = require("./middleware/rate-limiter");

const app = express();

require("./helpers/init_mongo"); //Connecting to MongoDB Atlas

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(requestIp.mw()); //To request user ip for tracking
app.use("/", express.static(path.join(__dirname, "frontend")));
//app.use("/images", express.static(path.join("backend/images"))); //Use when uploading images on server

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With,content-type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const customCodeAPILimiter = rateLimiter.customRateLimiter(10, 1);

app.use("/api/code", customCodeAPILimiter, codeCompilerRoutes);
app.use("/api/user", rateLimiter.userAPIRateLimiter, userRoutes);
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

module.exports = app;
