const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { Test } = require("../models");

// GET /api/tests/:slug -> instructions page before starting (no questions here)
exports.getOne = asyncHandler(async (req, res) => {
  const test = await Test.findOne({ slug: req.params.slug, isPublished: true })
    .populate("exam", "name slug board")
    .populate("sections.subject", "name slug")
    .lean();
  if (!test) throw new ApiError(404, "Test not found");

  const sections = test.sections.map((s) => ({
    _id: s._id,
    title: s.title,
    subject: s.subject,
    questionCount: s.questions.length,
  }));

  res.json({
    success: true,
    data: {
      _id: test._id,
      title: test.title,
      slug: test.slug,
      type: test.type,
      year: test.year,
      exam: test.exam,
      durationMinutes: test.durationMinutes,
      marking: test.marking,
      totalQuestions: test.totalQuestions,
      totalMarks: test.totalMarks,
      sections,
    },
  });
});

// GET /api/tests/daily-quiz/today?exam=<slug>
exports.dailyQuizToday = asyncHandler(async (req, res) => {
  // IST date as "YYYY-MM-DD" — daily quiz slugs end with this date
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const filter = { type: "daily_quiz", isPublished: true, slug: new RegExp(`${today}$`) };
  const quiz = await Test.findOne(filter)
    .populate("exam", "name slug")
    .select("title slug durationMinutes totalQuestions exam")
    .lean();
  if (!quiz) throw new ApiError(404, "No quiz for today yet");
  res.json({ success: true, data: quiz });
});
