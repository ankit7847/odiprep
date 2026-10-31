const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/attempt.service");

exports.start = asyncHandler(async (req, res) => {
  const { attempt, test, resumed } = await service.start(req.user._id, req.body.testId);
  const data = await service.buildExamPayload(attempt, test);
  res.status(resumed ? 200 : 201).json({ success: true, data: { ...data, resumed } });
});

exports.get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getForExam(req.user._id, req.params.id) });
});

exports.saveAnswer = asyncHandler(async (req, res) => {
  await service.saveAnswer(req.user._id, req.params.id, req.body);
  res.json({ success: true });
});

exports.warning = asyncHandler(async (req, res) => {
  await service.addWarning(req.user._id, req.params.id, req.body.kind);
  res.json({ success: true });
});

exports.submit = asyncHandler(async (req, res) => {
  const attempt = await service.submit(req.user._id, req.params.id);
  res.json({ success: true, data: { attemptId: attempt._id, status: attempt.status }, message: "Test submitted" });
});

exports.result = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getResult(req.user._id, req.params.id) });
});

exports.review = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getReview(req.user._id, req.params.id) });
});

exports.listMine = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  res.json({ success: true, data: await service.listMine(req.user._id, { page, limit }) });
});
