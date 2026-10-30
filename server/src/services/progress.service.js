// Everything that updates after a test is submitted:
// streak, daily activity, topic accuracy, mistake notebook.
const { User, DailyActivity, TopicStat, Mistake } = require("../models");
const { istDate, istYesterday } = require("../utils/date");

async function updateStreak(userId, now = new Date()) {
  const today = istDate(now);
  const user = await User.findById(userId).select("streak");
  if (!user) return;
  const s = user.streak || {};
  if (s.lastActiveDate === today) return; // already counted today

  const current = s.lastActiveDate === istYesterday(now) ? (s.current || 0) + 1 : 1;
  user.streak = { current, longest: Math.max(current, s.longest || 0), lastActiveDate: today };
  await user.save();
}

async function recordDailyActivity(userId, { questionsAttempted, minutesSpent }, now = new Date()) {
  await DailyActivity.updateOne(
    { user: userId, date: istDate(now) },
    { $inc: { questionsAttempted, testsCompleted: 1, minutesSpent } },
    { upsert: true }
  );
}

// questions: Map id -> { subject, topic }
async function updateTopicStats(userId, scoredAnswers, questions) {
  const tally = new Map(); // "subject|topic" -> { subject, topic, attempted, correct }
  for (const a of scoredAnswers) {
    if (!a.selectedOption) continue; // skipped questions don't count
    const q = questions.get(String(a.question));
    if (!q) continue;
    const k = `${q.subject}|${q.topic || ""}`;
    const t = tally.get(k) || { subject: q.subject, topic: q.topic || null, attempted: 0, correct: 0 };
    t.attempted++;
    if (a.isCorrect) t.correct++;
    tally.set(k, t);
  }
  if (!tally.size) return;

  await TopicStat.bulkWrite(
    [...tally.values()].map((t) => ({
      updateOne: {
        filter: { user: userId, subject: t.subject, topic: t.topic },
        update: { $inc: { attempted: t.attempted, correct: t.correct } },
        upsert: true,
      },
    }))
  );
}

async function updateMistakes(userId, attemptId, scoredAnswers) {
  const ops = [];
  for (const a of scoredAnswers) {
    if (a.isCorrect === false) {
      ops.push({
        updateOne: {
          filter: { user: userId, question: a.question },
          update: {
            $set: { lastAttempt: attemptId, lastSelectedOption: a.selectedOption, resolved: false },
            $inc: { timesWrong: 1 },
          },
          upsert: true,
        },
      });
    } else if (a.isCorrect === true) {
      // Got it right this time -> mark an old mistake as fixed
      ops.push({
        updateOne: { filter: { user: userId, question: a.question }, update: { $set: { resolved: true } } },
      });
    }
  }
  if (ops.length) await Mistake.bulkWrite(ops, { ordered: false });
}

module.exports = { updateStreak, recordDailyActivity, updateTopicStats, updateMistakes };
