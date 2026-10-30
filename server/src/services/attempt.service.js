const { Attempt, Test, Question } = require("../models");
const ApiError = require("../utils/ApiError");
const { scoreAttempt } = require("./scoring");
const progress = require("./progress.service");

const GRACE_MS = 5 * 1000; // allow last answer saved a few seconds after time runs out (slow network)

const isExpired = (attempt, now = Date.now()) => now > attempt.endsAt.getTime();

async function findOwnAttempt(userId, attemptId) {
  const attempt = await Attempt.findOne({ _id: attemptId, user: userId });
  if (!attempt) throw new ApiError(404, "Attempt not found");
  return attempt;
}

// ---------- Start / resume ----------

async function start(userId, testId) {
  const test = await Test.findOne({ _id: testId, isPublished: true });
  if (!test) throw new ApiError(404, "Test not found");
  if (!test.totalQuestions) throw new ApiError(400, "This test has no questions yet");

  // Resume an unfinished attempt instead of starting a new one
  const existing = await Attempt.findOne({ user: userId, test: test._id, status: "in_progress" });
  if (existing) {
    if (!isExpired(existing)) return { attempt: existing, test, resumed: true };
    await finalize(existing, "auto_submitted"); // time ran out while away
  }

  const now = new Date();
  const answers = test.sections.flatMap((s) => s.questions.map((q) => ({ question: q, section: s._id })));
  const attempt = await Attempt.create({
    user: userId,
    test: test._id,
    startedAt: now,
    endsAt: new Date(now.getTime() + test.durationMinutes * 60 * 1000),
    answers,
  });
  return { attempt, test, resumed: false };
}

// Payload for the exam screen: questions WITHOUT answers + saved progress + time left
async function buildExamPayload(attempt, test) {
  const ids = attempt.answers.map((a) => a.question);
  const questions = await Question.find({ _id: { $in: ids } })
    .select("text options imageUrl subject")
    .lean(); // correctOption & explanation are NOT selected
  const byId = new Map(questions.map((q) => [String(q._id), q]));

  return {
    attemptId: attempt._id,
    status: attempt.status,
    test: {
      _id: test._id,
      title: test.title,
      durationMinutes: test.durationMinutes,
      marking: test.marking,
    },
    endsAt: attempt.endsAt,
    serverNow: new Date(), // client syncs its clock to this
    timeLeftSec: Math.max(0, Math.floor((attempt.endsAt - Date.now()) / 1000)),
    lastQuestionIndex: attempt.lastQuestionIndex,
    sections: test.sections.map((s) => ({ _id: s._id, title: s.title })),
    questions: attempt.answers.map((a, index) => ({
      index,
      section: a.section,
      ...byId.get(String(a.question)),
      selectedOption: a.selectedOption,
      markedForReview: a.markedForReview,
      visited: a.visited,
    })),
  };
}

// ---------- During the test ----------

async function getForExam(userId, attemptId) {
  const attempt = await findOwnAttempt(userId, attemptId);
  if (attempt.status === "in_progress" && isExpired(attempt)) {
    await finalize(attempt, "auto_submitted");
  }
  if (attempt.status !== "in_progress") {
    return { attemptId: attempt._id, status: attempt.status, finished: true };
  }
  const test = await Test.findById(attempt.test);
  return buildExamPayload(attempt, test);
}

async function saveAnswer(userId, attemptId, body) {
  const attempt = await findOwnAttempt(userId, attemptId);
  if (attempt.status !== "in_progress") throw new ApiError(409, "Test already submitted");
  if (Date.now() > attempt.endsAt.getTime() + GRACE_MS) {
    await finalize(attempt, "auto_submitted");
    throw new ApiError(410, "Time is over, test submitted");
  }

  const set = { "answers.$.visited": true };
  if (body.selectedOption !== undefined) set["answers.$.selectedOption"] = body.selectedOption;
  if (body.markedForReview !== undefined) set["answers.$.markedForReview"] = body.markedForReview;
  if (body.questionIndex !== undefined) set.lastQuestionIndex = body.questionIndex;

  const update = { $set: set };
  if (body.timeSpentSec) update.$inc = { "answers.$.timeSpentSec": body.timeSpentSec };

  // Atomic positional update: safe even if two saves arrive together
  const res = await Attempt.updateOne(
    { _id: attempt._id, status: "in_progress", "answers.question": body.questionId },
    update
  );
  if (!res.matchedCount) throw new ApiError(400, "Question is not part of this test");
}

async function addWarning(userId, attemptId, kind) {
  const res = await Attempt.updateOne(
    { _id: attemptId, user: userId, status: "in_progress" },
    { $push: { warnings: { kind, at: new Date() } } }
  );
  if (!res.matchedCount) throw new ApiError(409, "Test is not running");
}

// ---------- Submit ----------

async function submit(userId, attemptId) {
  const attempt = await findOwnAttempt(userId, attemptId);
  if (attempt.status !== "in_progress") return attempt; // already done: return it, don't score twice
  return finalize(attempt, isExpired(attempt) ? "auto_submitted" : "submitted");
}

async function finalize(attempt, status) {
  const test = await Test.findById(attempt.test).lean();
  const questions = await Question.find({ _id: { $in: attempt.answers.map((a) => a.question) } })
    .select("correctOption subject topic")
    .lean();
  const qMap = new Map(questions.map((q) => [String(q._id), q]));

  const plainAnswers = attempt.answers.map((a) => (a.toObject ? a.toObject() : a));
  const { answers, result } = scoreAttempt(plainAnswers, qMap, test.sections, test.marking);

  const now = new Date();
  const finishedAt = now < attempt.endsAt ? now : attempt.endsAt;
  result.timeTakenSec = Math.round((finishedAt - attempt.startedAt) / 1000);

  // Only the first request that flips in_progress -> submitted wins (no double scoring)
  const saved = await Attempt.findOneAndUpdate(
    { _id: attempt._id, status: "in_progress" },
    { $set: { status, submittedAt: now, answers, result } },
    { new: true }
  );
  if (!saved) return Attempt.findById(attempt._id);

  // Side effects — a failure here must not lose the submitted result
  try {
    const attempted = result.correct + result.wrong;
    await Promise.all([
      progress.updateStreak(attempt.user, now),
      progress.recordDailyActivity(attempt.user, {
        questionsAttempted: attempted,
        minutesSpent: Math.round(result.timeTakenSec / 60),
      }),
      progress.updateTopicStats(attempt.user, answers, qMap),
      progress.updateMistakes(attempt.user, attempt._id, answers),
    ]);
  } catch (err) {
    console.error("Post-submit update failed for attempt", String(attempt._id), err);
  }

  return saved;
}

// ---------- After the test ----------

const FINISHED = ["submitted", "auto_submitted"];

async function getResult(userId, attemptId) {
  const attempt = await findOwnAttempt(userId, attemptId);
  if (!FINISHED.includes(attempt.status)) throw new ApiError(409, "Submit the test to see the result");

  // Rank among everyone's finished attempts on this test (live, so it updates as others take it)
  const filter = { test: attempt.test, status: { $in: FINISHED } };
  const [better, total] = await Promise.all([
    Attempt.countDocuments({ ...filter, "result.score": { $gt: attempt.result.score } }),
    Attempt.countDocuments(filter),
  ]);
  const rank = better + 1;
  const percentile = total > 1 ? Math.round(((total - rank) / (total - 1)) * 100) : 100;

  const test = await Test.findById(attempt.test).select("title slug marking exam").populate("exam", "name slug").lean();

  return {
    attemptId: attempt._id,
    status: attempt.status,
    test,
    submittedAt: attempt.submittedAt,
    warnings: attempt.warnings.length,
    result: { ...attempt.toObject().result, rank, totalCandidates: total, percentile },
  };
}

async function getReview(userId, attemptId) {
  const attempt = await findOwnAttempt(userId, attemptId);
  if (!FINISHED.includes(attempt.status)) throw new ApiError(409, "Submit the test to see answers");

  const questions = await Question.find({ _id: { $in: attempt.answers.map((a) => a.question) } })
    .select("text options imageUrl correctOption explanation subject topic")
    .populate("subject", "name")
    .populate("topic", "name")
    .lean();
  const byId = new Map(questions.map((q) => [String(q._id), q]));

  return attempt.answers.map((a, index) => ({
    index,
    section: a.section,
    ...byId.get(String(a.question)),
    selectedOption: a.selectedOption,
    isCorrect: a.isCorrect,
    timeSpentSec: a.timeSpentSec,
  }));
}

async function listMine(userId, { page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Attempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("test status startedAt submittedAt result.score result.maxScore result.accuracy")
      .populate("test", "title slug type")
      .lean(),
    Attempt.countDocuments({ user: userId }),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

module.exports = {
  start,
  buildExamPayload,
  getForExam,
  saveAnswer,
  addWarning,
  submit,
  finalize,
  getResult,
  getReview,
  listMine,
};
