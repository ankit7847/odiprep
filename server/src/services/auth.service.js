const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const { signToken, createResetToken, hashResetToken } = require("../utils/token");
const { sendEmail } = require("../utils/email");

const googleClient = new OAuth2Client();

// Shape sent to the client — never includes password or reset fields
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  avatar: u.avatar,
  role: u.role,
  preferredLanguage: u.preferredLanguage,
  targetExam: u.targetExam,
  targetExamDate: u.targetExamDate,
  streak: u.streak,
  createdAt: u.createdAt,
});

const authResponse = (user) => ({ user: publicUser(user), token: signToken(user) });

async function register({ name, email, password }) {
  if (await User.exists({ email })) throw new ApiError(409, "Email is already registered");
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, lastLoginAt: new Date() });
  return authResponse(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+password");
  // Same message for wrong email or wrong password (don't reveal which emails exist)
  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Wrong email or password");
  }
  if (!user.isActive) throw new ApiError(403, "Account is disabled");
  user.lastLoginAt = new Date();
  await user.save();
  return authResponse(user);
}

async function googleLogin({ idToken }) {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Google sign-in failed");
  }
  if (!payload.email_verified) throw new ApiError(401, "Google email not verified");

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });
  if (!user) {
    user = new User({ name: payload.name || email.split("@")[0], email, avatar: payload.picture });
  }
  user.googleId = payload.sub; // links Google to an existing email account too
  user.lastLoginAt = new Date();
  await user.save();
  return authResponse(user);
}

async function forgotPassword({ email }) {
  const user = await User.findOne({ email });
  // Always respond the same way so nobody can check which emails are registered
  if (!user) return;
  const { raw, hash } = createResetToken();
  user.resetPasswordToken = hash;
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save();
  const link = `${process.env.CLIENT_URL}/reset-password?token=${raw}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your OdiPrep password",
    text: `Click to reset your password (valid for 30 minutes):\n${link}`,
  });
}

async function resetPassword({ token, password }) {
  const user = await User.findOne({
    resetPasswordToken: hashResetToken(token),
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) throw new ApiError(400, "Reset link is invalid or expired");
  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return authResponse(user);
}

async function changePassword(userId, { oldPassword, newPassword }) {
  const user = await User.findById(userId).select("+password");
  if (!user.password) throw new ApiError(400, "This account uses Google sign-in");
  if (!(await bcrypt.compare(oldPassword, user.password))) throw new ApiError(400, "Old password is wrong");
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
}

module.exports = {
  publicUser,
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  changePassword,
};
