const asyncHandler = require("../../utils/asyncHandler");
const { User, Question, Test, Attempt } = require("../../models");

const FINISHED = ["submitted", "auto_submitted"];

// Start of today in IST, as a Date
function startOfTodayIST() {
  const offset = 5.5 * 3600 * 1000;
  const ist = new Date(Date.now() + offset);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - offset);
}

// GET /api/admin/stats
exports.overview = asyncHandler(async (req, res) => {
  const today = startOfTodayIST();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [students, newStudents, questionsByStatus, tests, testsLive, attemptsToday, attemptsTotal, popular] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "student", createdAt: { $gte: weekAgo } }),
    Question.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Test.countDocuments(),
    Test.countDocuments({ isPublished: true }),
    Attempt.countDocuments({ status: { $in: FINISHED }, submittedAt: { $gte: today } }),
    Attempt.countDocuments({ status: { $in: FINISHED } }),
    Attempt.aggregate([
      { $match: { status: { $in: FINISHED }, submittedAt: { $gte: weekAgo } } },
      { $group: { _id: "$test", attempts: { $sum: 1 }, avgScore: { $avg: "$result.score" } } },
      { $sort: { attempts: -1 } },
      { $limit: 5 },
      { $lookup: { from: "tests", localField: "_id", foreignField: "_id", as: "test" } },
      { $unwind: "$test" },
      { $project: { attempts: 1, avgScore: { $round: ["$avgScore", 1] }, "test.title": 1, "test.slug": 1, "test.totalMarks": 1 } },
    ]),
  ]);

  const q = Object.fromEntries(questionsByStatus.map((x) => [x._id, x.n]));
  res.json({
    success: true,
    data: {
      students,
      newStudents,
      questions: { published: q.published || 0, draft: q.draft || 0, archived: q.archived || 0 },
      tests: { total: tests, live: testsLive },
      attempts: { today: attemptsToday, total: attemptsTotal },
      popularTests: popular,
    },
  });
});
