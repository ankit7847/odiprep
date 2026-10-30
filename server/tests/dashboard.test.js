const { displayStreak, activityLevel, buildCalendar, percent, daysLeft } = require("../src/services/dashboard.helpers");

// 30 Oct 2026, 10:00 AM IST
const now = new Date("2026-10-30T04:30:00Z");

describe("displayStreak", () => {
  test("active today -> keeps streak", () => {
    expect(displayStreak({ current: 12, longest: 19, lastActiveDate: "2026-10-30" }, now)).toEqual({
      current: 12,
      longest: 19,
      activeToday: true,
    });
  });
  test("active yesterday -> still alive, not done today", () => {
    expect(displayStreak({ current: 5, longest: 5, lastActiveDate: "2026-10-29" }, now)).toEqual({
      current: 5,
      longest: 5,
      activeToday: false,
    });
  });
  test("missed a day -> broken, longest kept", () => {
    expect(displayStreak({ current: 5, longest: 9, lastActiveDate: "2026-10-27" }, now).current).toBe(0);
    expect(displayStreak({ current: 5, longest: 9, lastActiveDate: "2026-10-27" }, now).longest).toBe(9);
  });
  test("new user", () => {
    expect(displayStreak(undefined, now)).toEqual({ current: 0, longest: 0, activeToday: false });
  });
});

test("activityLevel buckets", () => {
  expect([0, 1, 19, 20, 59, 60, 200].map(activityLevel)).toEqual([0, 1, 1, 2, 2, 3, 3]);
});

describe("buildCalendar", () => {
  const cal = buildCalendar([{ date: "2026-10-29", questionsAttempted: 40, testsCompleted: 1, minutesSpent: 30 }], 7, now);
  test("fills every day, oldest first, ending today", () => {
    expect(cal).toHaveLength(7);
    expect(cal[0].date).toBe("2026-10-24");
    expect(cal[6].date).toBe("2026-10-30");
  });
  test("uses data where present, zero elsewhere", () => {
    expect(cal[5]).toEqual({ date: "2026-10-29", questions: 40, tests: 1, minutes: 30, level: 2 });
    expect(cal[6].level).toBe(0);
  });
});

test("percent handles zero", () => {
  expect(percent(0, 0)).toBe(0);
  expect(percent(71, 100)).toBe(71);
});

describe("daysLeft", () => {
  test("future date", () => expect(daysLeft("2026-11-15", now)).toBe(16));
  test("today", () => expect(daysLeft("2026-10-30", now)).toBe(0));
  test("past or missing", () => {
    expect(daysLeft("2026-10-01", now)).toBeNull();
    expect(daysLeft(null, now)).toBeNull();
  });
});
