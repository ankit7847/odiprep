const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

exports.register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  res.status(201).json({ success: true, data, message: "Account created" });
});

exports.login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.json({ success: true, data });
});

exports.google = asyncHandler(async (req, res) => {
  const data = await authService.googleLogin(req.body);
  res.json({ success: true, data });
});

exports.me = (req, res) => {
  res.json({ success: true, data: authService.publicUser(req.user) });
};

exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  res.json({ success: true, message: "If this email is registered, a reset link has been sent" });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  res.json({ success: true, data, message: "Password updated" });
});
