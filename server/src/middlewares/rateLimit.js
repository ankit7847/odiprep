const rateLimit = require("express-rate-limit");

// Stops password guessing on login/register/forgot-password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again in 15 minutes" },
  skip: () => process.env.NODE_ENV === "test",
});

module.exports = { authLimiter };
