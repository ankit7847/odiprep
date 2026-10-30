const { scoreAttempt } = require("../src/services/scoring");
const { istDate, istYesterday } = require("../src/utils/date");

const sections = [
  { _id: "s1", title: "GK" },
  { _id: "s2", title: "Reasoning" },
];
const key = new Map([
  ["q1", { correctOption: "A" }],
  ["q2", { correctOption: "B" }],
  ["q3", { correctOption: "C" }],
  ["q4", { correctOption: "D" }],
  ["q5", { correctOption: "A" }],
]);
const marking = { correct: 1, negative: 0.25 };

describe("scoreAttempt", () => {
  const answers = [
    { question: "q1", section: "s1", selectedOption: "A" }, // correct
    { question: "q2", section: "s1", selectedOption: "C" }, // wrong
    { question: "q3", section: "s1", selectedOption: null }, // skipped
    { question: "q4", section: "s2", selectedOption: "D" }, // correct
    { question: "q5", section: "s2", selectedOption: "B" }, // wrong
  ];
  const { answers: scored, result } = scoreAttempt(answers, key, sections, marking);

  test("counts correct / wrong / skipped", () => {
    expect(result.correct).toBe(2);
    expect(result.wrong).toBe(2);
    expect(result.skipped).toBe(1);
  });

  test("negative marking: 2 - 2*0.25 = 1.5", () => {
    expect(result.score).toBe(1.5);
    expect(result.maxScore).toBe(5);
  });

  test("accuracy counts only attempted questions", () => {
    expect(result.accuracy).toBe(50);
  });

  test("section-wise scores", () => {
    expect(result.sections).toEqual([
      { section: "s1", title: "GK", correct: 1, wrong: 1, skipped: 1, score: 0.75 },
      { section: "s2", title: "Reasoning", correct: 1, wrong: 1, skipped: 0, score: 0.75 },
    ]);
  });

  test("marks each answer", () => {
    expect(scored.map((a) => a.isCorrect)).toEqual([true, false, undefined, true, false]);
  });

  test("all skipped -> zero, no division by zero", () => {
    const r = scoreAttempt(answers.map((a) => ({ ...a, selectedOption: null })), key, sections, marking).result;
    expect(r.score).toBe(0);
    expect(r.accuracy).toBe(0);
  });

  test("score can go negative", () => {
    const allWrong = answers.map((a) => ({ ...a, selectedOption: "E" }));
    expect(scoreAttempt(allWrong, key, sections, marking).result.score).toBe(-1.25);
  });
});

describe("IST dates", () => {
  test("11:00 PM IST on 30 Oct is still 30 Oct", () => {
    expect(istDate(new Date("2026-10-30T17:30:00Z"))).toBe("2026-10-30");
  });
  test("12:30 AM IST is the next day", () => {
    expect(istDate(new Date("2026-10-30T19:00:00Z"))).toBe("2026-10-31");
  });
  test("yesterday", () => {
    expect(istYesterday(new Date("2026-11-01T06:00:00Z"))).toBe("2026-10-31");
  });
});
