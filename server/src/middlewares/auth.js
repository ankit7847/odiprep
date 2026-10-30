const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/token");
const { User } = require("../models");

// Requires a valid JWT. Sets req.user.
const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Please log in");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, "Session expired, please log in again");
  }

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new ApiError(401, "Account not found");

  req.user = user;
  next();
});

// Like auth, but never fails: public pages just show less when the token is missing or expired
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  try {
    const payload = verifyToken(header.slice(7));
    const user = await User.findById(payload.id);
    if (user && user.isActive) req.user = user;
  } catch {
    /* bad or expired token: treat as logged out */
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") return next(new ApiError(403, "Admins only"));
  next();
};

module.exports = { auth, optionalAuth, isAdmin };
