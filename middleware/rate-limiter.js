const rateLimit = require("express-rate-limit");

const userAPIRateLimiter = rateLimit({
  windowMs: 1 * 1000, // Time in ms
  max: 1, // Max requests allowed per time limit
  statusCode: 200,
  keyGenerator: (req, res) => {
    return req.clientIp; // IP address from requestIp.mw()
  },
  handler: function (req, res, next) {
    return res.status(429).json({ message: "Too many requests detected" });
  },
});

const codeAPIRateLimiter = rateLimit({
  windowMs: 5 * 1000, // Time in ms
  max: 2, // Max requests allowed per time limit
  statusCode: 200,
  keyGenerator: (req, res) => {
    return req.clientIp; // IP address from requestIp.mw()
  },
  handler: function (req, res, next) {
    return res.status(429).json({ message: "Too many requests detected" });
  },
});

// Create a custom rate-limiter function
const customRateLimiter = (windowMs, maxRequests) => {
  const users = new Map();

  return (req, res, next) => {
    const userIP = req.clientIp;

    // Initialize or get the user's request count
    const userRequestCount = users.get(userIP) || 0;

    if (userRequestCount >= maxRequests) {
      return res.status(429).json({
        message: "Too many requests detected",
      });
    }
    users.set(userIP, userRequestCount + 1);

    setTimeout(() => {
      users.delete(userIP);
    }, windowMs * 1000);

    return next();
  };
};

module.exports = { userAPIRateLimiter, codeAPIRateLimiter, customRateLimiter };
