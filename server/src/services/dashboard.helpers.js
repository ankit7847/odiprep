// Pure helpers for the dashboard (no database) — unit tested.
const { istDate, istYesterday } = require("../utils/date");

const DAY_MS = 24 * 60 * 60 * 1000;

// Stored streak is only updated on activity. If the student skipped yesterday,
// the streak is broken even though the stored number is still old.
function displayStreak(streak = {}, now = new Date()) {
  const last = streak.lastActiveDate;
  const alive = last === istDate(now) || last === istYesterday(now);
  return {
    current: alive ? streak.current || 0 : 0,
    longest: streak.longest || 0,
    activeToday: last === istDate(now),
  };
}

// Heatmap level 0-3 from questions attempted that day
function activityLevel(questions) {
  if (!questions) return 0;
  if (questions < 20) return 1;
  if (questions < 60) return 2;
  return 3;
}

// Fill missing days with zeros so the frontend can draw a full grid
function buildCalendar(rows, days, now = new Date()) {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = istDate(new Date(now.getTime() - i * DAY_MS));
    const r = byDate.get(date);
    const questions = r ? r.questionsAttempted : 0;
    out.push({
      date,
      questions,
      tests: r ? r.testsCompleted : 0,
      minutes: r ? r.minutesSpent : 0,
      level: activityLevel(questions),
    });
  }
  return out;
}

const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

// Days left until the target exam (IST calendar days), null if not set or past
function daysLeft(targetDate, now = new Date()) {
  if (!targetDate) return null;
  const a = Date.parse(istDate(now));
  const b = Date.parse(istDate(new Date(targetDate)));
  const d = Math.round((b - a) / DAY_MS);
  return d >= 0 ? d : null;
}

module.exports = { displayStreak, activityLevel, buildCalendar, percent, daysLeft };
