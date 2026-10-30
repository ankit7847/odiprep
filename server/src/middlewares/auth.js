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

// Like auth, but doesn't fail when logged out (public pages that show extra info if logged in)
const optionalAuth = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return auth(req, res, next);
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") return next(new ApiError(403, "Admins only"));
  next();
};

module.exports = { auth, optionalAuth, isAdmin };
