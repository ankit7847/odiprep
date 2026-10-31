const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

// Random token for password reset: send raw to user, store only the hash
const createResetToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
};

const hashResetToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

module.exports = { signToken, verifyToken, createResetToken, hashResetToken };
