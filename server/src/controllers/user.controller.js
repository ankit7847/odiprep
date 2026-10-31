const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { Exam } = require("../models");
const authService = require("../services/auth.service");

exports.updateMe = asyncHandler(async (req, res) => {
  const updates = req.body;
  if (updates.targetExam && !(await Exam.exists({ _id: updates.targetExam, isActive: true }))) {
    throw new ApiError(400, "Exam not found");
  }
  Object.assign(req.user, updates);
  await req.user.save();
  res.json({ success: true, data: authService.publicUser(req.user) });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);
  res.json({ success: true, message: "Password changed" });
});
