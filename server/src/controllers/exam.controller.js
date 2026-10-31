const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { Exam, Test, Attempt } = require("../models");

const TEST_TYPES = ["pyq", "mock", "daily_quiz"];

// GET /api/exams  -> home page exam cards
exports.list = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();

  // How many published papers each exam has (one query for all exams)
  const counts = await Test.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: { exam: "$exam", type: "$type" }, n: { $sum: 1 } } },
  ]);
  const byExam = {};
  for (const c of counts) {
    const k = String(c._id.exam);
    byExam[k] = byExam[k] || { pyq: 0, mock: 0, daily_quiz: 0 };
    byExam[k][c._id.type] = c.n;
  }

  const data = exams.map((e) => ({ ...e, testCounts: byExam[String(e._id)] || { pyq: 0, mock: 0, daily_quiz: 0 } }));
  res.json({ success: true, data });
});

// GET /api/exams/:slug
exports.getOne = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!exam) throw new ApiError(404, "Exam not found");
  res.json({ success: true, data: exam });
});

// GET /api/exams/:slug/tests?type=pyq
// Papers in sequence. If logged in, each paper gets myStatus: done / in_progress / not_started
exports.listTests = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ slug: req.params.slug, isActive: true }).select("_id name slug").lean();
  if (!exam) throw new ApiError(404, "Exam not found");

  const filter = { exam: exam._id, isPublished: true };
  if (req.query.type) {
    if (!TEST_TYPES.includes(req.query.type)) throw new ApiError(400, "Invalid test type");
    filter.type = req.query.type;
  }

  const tests = await Test.find(filter)
    .sort({ sequence: 1, year: 1, createdAt: 1 })
    .select("title slug type year sequence durationMinutes marking totalQuestions totalMarks")
    .lean();

  if (req.user && tests.length) {
    const attempts = await Attempt.find({ user: req.user._id, test: { $in: tests.map((t) => t._id) } })
      .sort({ createdAt: -1 })
      .select("test status result.score result.maxScore lastQuestionIndex")
      .lean();
    // Latest attempt per test wins
    const latest = {};
    for (const a of attempts) if (!latest[a.test]) latest[a.test] = a;

    for (const t of tests) {
      const a = latest[t._id];
      if (!a) t.myStatus = { state: "not_started" };
      else if (a.status === "in_progress")
        t.myStatus = { state: "in_progress", attemptId: a._id, questionIndex: a.lastQuestionIndex };
      else t.myStatus = { state: "done", attemptId: a._id, score: a.result?.score, maxScore: a.result?.maxScore };
    }
  }

  res.json({ success: true, data: { exam, tests } });
});
