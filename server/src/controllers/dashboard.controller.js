const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/dashboard.service");

// Read a number from the query string, kept within [min, max]
const num = (v, def, min, max) => Math.min(max, Math.max(min, parseInt(v, 10) || def));

exports.summary = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.summary(req.user._id) });
});

exports.scoreTrend = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.scoreTrend(req.user._id, num(req.query.limit, 8, 1, 30)) });
});

exports.subjectAccuracy = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.subjectAccuracy(req.user._id) });
});

exports.weakTopics = asyncHandler(async (req, res) => {
  const data = await service.weakTopics(req.user._id, {
    limit: num(req.query.limit, 3, 1, 10),
    minAttempted: num(req.query.min, 10, 1, 100),
  });
  res.json({ success: true, data });
});

exports.streakCalendar = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.streakCalendar(req.user._id, num(req.query.days, 84, 7, 365)) });
});

exports.pyqProgress = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.pyqProgress(req.user._id, req.query.exam) });
});
