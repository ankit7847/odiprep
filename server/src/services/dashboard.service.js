const mongoose = require("mongoose");
const { Attempt, TopicStat, DailyActivity, Exam, Test, User } = require("../models");
const ApiError = require("../utils/ApiError");
const { istDate } = require("../utils/date");
const { displayStreak, buildCalendar, percent, daysLeft } = require("./dashboard.helpers");

const FINISHED = ["submitted", "auto_submitted"];
const DAY_MS = 24 * 60 * 60 * 1000;

// Rank of one finished attempt among all finished attempts on the same test
async function rankOf(attempt) {
  const better = await Attempt.countDocuments({
    test: attempt.test,
    status: { $in: FINISHED },
    "result.score": { $gt: attempt.result.score },
  });
  return better + 1;
}

// ---------- Stat cards ----------
async function summary(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);

  const [totals] = await Attempt.aggregate([
    { $match: { user: uid, status: { $in: FINISHED } } },
    {
      $group: {
        _id: null,
        testsTaken: { $sum: 1 },
        testsThisWeek: { $sum: { $cond: [{ $gte: ["$submittedAt", weekAgo] }, 1, 0] } },
        correct: { $sum: "$result.correct" },
        wrong: { $sum: "$result.wrong" },
        avgScorePct: {
          $avg: {
            $cond: [
              { $gt: ["$result.maxScore", 0] },
              { $multiply: [{ $divide: ["$result.score", "$result.maxScore"] }, 100] },
              0,
            ],
          },
        },
      },
    },
  ]);

  // Best rank: check the student's 20 most recent finished attempts (keeps it fast)
  const recent = await Attempt.find({ user: uid, status: { $in: FINISHED } })
    .sort({ submittedAt: -1 })
    .limit(20)
    .select("test result.score")
    .lean();
  let bestRank = null;
  for (const a of recent) {
    const r = await rankOf(a);
    if (bestRank === null || r < bestRank.rank) bestRank = { rank: r, test: a.test };
  }
  if (bestRank) {
    const t = await Test.findById(bestRank.test).select("title slug").lean();
    bestRank.test = t;
  }

  // "Continue last paper" button
  const running = await Attempt.findOne({ user: uid, status: "in_progress", endsAt: { $gt: new Date() } })
    .sort({ updatedAt: -1 })
    .select("test lastQuestionIndex endsAt")
    .populate("test", "title slug totalQuestions")
    .lean();

  const user = await User.findById(uid).select("streak targetExam targetExamDate").populate("targetExam", "name slug").lean();

  const t = totals || { testsTaken: 0, testsThisWeek: 0, correct: 0, wrong: 0, avgScorePct: 0 };
  return {
    testsTaken: t.testsTaken,
    testsThisWeek: t.testsThisWeek,
    avgScorePct: Math.round(t.avgScorePct || 0),
    accuracy: percent(t.correct, t.correct + t.wrong),
    bestRank,
    streak: displayStreak(user?.streak),
    targetExam: user?.targetExam
      ? { ...user.targetExam, date: user.targetExamDate, daysLeft: daysLeft(user.targetExamDate) }
      : null,
    continue: running
      ? {
          attemptId: running._id,
          test: running.test,
          questionIndex: running.lastQuestionIndex,
          endsAt: running.endsAt,
        }
      : null,
  };
}

// ---------- Line chart ----------
async function scoreTrend(userId, limit) {
  const items = await Attempt.find({ user: userId, status: { $in: FINISHED } })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .select("test submittedAt result.score result.maxScore result.accuracy")
    .populate("test", "title slug")
    .lean();

  return items.reverse().map((a, i) => ({
    label: `M${i + 1}`,
    attemptId: a._id,
    test: a.test,
    date: istDate(a.submittedAt),
    score: a.result.score,
    maxScore: a.result.maxScore,
    scorePct: percent(Math.max(0, a.result.score), a.result.maxScore),
    accuracy: a.result.accuracy,
  }));
}

// ---------- Subject bars ----------
async function subjectAccuracy(userId) {
  const rows = await TopicStat.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$subject", attempted: { $sum: "$attempted" }, correct: { $sum: "$correct" } } },
    { $match: { attempted: { $gt: 0 } } },
    { $lookup: { from: "subjects", localField: "_id", foreignField: "_id", as: "subject" } },
    { $unwind: "$subject" },
  ]);
  return rows
    .map((r) => ({
      subject: { _id: r._id, name: r.subject.name, slug: r.subject.slug },
      attempted: r.attempted,
      correct: r.correct,
      accuracy: percent(r.correct, r.attempted),
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

// ---------- Weak topics ----------
async function weakTopics(userId, { limit, minAttempted }) {
  const rows = await TopicStat.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        topic: { $ne: null },
        attempted: { $gte: minAttempted }, // ignore topics with too few answers to judge
      },
    },
    { $addFields: { accuracy: { $divide: ["$correct", "$attempted"] } } },
    { $sort: { accuracy: 1, attempted: -1 } },
    { $limit: limit },
    { $lookup: { from: "topics", localField: "topic", foreignField: "_id", as: "topic" } },
    { $unwind: "$topic" },
    { $lookup: { from: "subjects", localField: "subject", foreignField: "_id", as: "subject" } },
    { $unwind: "$subject" },
  ]);
  return rows.map((r) => ({
    topic: { _id: r.topic._id, name: r.topic.name, slug: r.topic.slug },
    subject: { _id: r.subject._id, name: r.subject.name },
    attempted: r.attempted,
    accuracy: Math.round(r.accuracy * 100),
  }));
}

// ---------- Heatmap ----------
async function streakCalendar(userId, days) {
  const now = new Date();
  const from = istDate(new Date(now.getTime() - (days - 1) * DAY_MS));
  const rows = await DailyActivity.find({ user: userId, date: { $gte: from } })
    .select("date questionsAttempted testsCompleted minutesSpent")
    .lean();
  const user = await User.findById(userId).select("streak").lean();
  return { streak: displayStreak(user?.streak, now), days: buildCalendar(rows, days, now) };
}

// ---------- PYQ progress grid ----------
async function pyqProgress(userId, examSlug) {
  let exam;
  if (examSlug) {
    exam = await Exam.findOne({ slug: examSlug, isActive: true }).select("name slug").lean();
    if (!exam) throw new ApiError(404, "Exam not found");
  } else {
    const user = await User.findById(userId).select("targetExam").lean();
    if (!user?.targetExam) throw new ApiError(400, "Pick an exam or set your target exam");
    exam = await Exam.findById(user.targetExam).select("name slug").lean();
  }

  const tests = await Test.find({ exam: exam._id, type: "pyq", isPublished: true })
    .sort({ sequence: 1, year: 1 })
    .select("title slug year totalQuestions")
    .lean();

  const attempts = await Attempt.find({ user: userId, test: { $in: tests.map((t) => t._id) } })
    .sort({ createdAt: -1 })
    .select("test status lastQuestionIndex result.score result.maxScore")
    .lean();
  const latest = {};
  for (const a of attempts) if (!latest[a.test]) latest[a.test] = a;

  let done = 0;
  const papers = tests.map((t) => {
    const a = latest[t._id];
    let status = { state: "not_started" };
    if (a && a.status === "in_progress") status = { state: "in_progress", attemptId: a._id, questionIndex: a.lastQuestionIndex };
    else if (a) {
      done++;
      status = { state: "done", attemptId: a._id, score: a.result.score, maxScore: a.result.maxScore };
    }
    return { ...t, ...status };
  });

  return { exam, done, total: tests.length, papers };
}

module.exports = { summary, scoreTrend, subjectAccuracy, weakTopics, streakCalendar, pyqProgress };
