const v = require("../src/validators/test.validator");

const id = (n) => String(n).padStart(24, "a");
const base = {
  title: "OSSSC RI 2022 Paper",
  exam: id(1),
  type: "pyq",
  year: 2022,
  durationMinutes: 120,
  sections: [
    { title: "GK", subject: id(2), questions: [id(10), id(11)] },
    { title: "Reasoning", subject: id(3), questions: [id(12)] },
  ],
};

describe("createTest", () => {
  test("valid test", () => expect(v.createTest.safeParse(base).success).toBe(true));
  test("same question twice is rejected", () => {
    const r = v.createTest.safeParse({ ...base, sections: [{ title: "A", questions: [id(10)] }, { title: "B", questions: [id(10)] }] });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].message).toMatch(/more than once/);
  });
  test("needs at least one section", () => expect(v.createTest.safeParse({ ...base, sections: [] }).success).toBe(false));
  test("bad type rejected", () => expect(v.createTest.safeParse({ ...base, type: "exam" }).success).toBe(false));
  test("cannot set isPublished on create", () => expect(v.createTest.safeParse({ ...base, isPublished: true }).success).toBe(false));
  test("negative marking must be >= 0", () =>
    expect(v.createTest.safeParse({ ...base, marking: { correct: 1, negative: -1 } }).success).toBe(false));
});

describe("updateTest", () => {
  test("partial update ok", () => expect(v.updateTest.safeParse({ title: "New title" }).success).toBe(true));
  test("duplicate check still applies", () =>
    expect(v.updateTest.safeParse({ sections: [{ title: "A", questions: [id(1), id(1)] }] }).success).toBe(false));
});

describe("autoGenerate", () => {
  const auto = { title: "Mock 02", exam: id(1), type: "mock", durationMinutes: 60, sections: [{ title: "GK", subject: id(2), count: 25 }] };
  test("valid", () => expect(v.autoGenerate.safeParse(auto).success).toBe(true));
  test("count must be positive", () =>
    expect(v.autoGenerate.safeParse({ ...auto, sections: [{ title: "GK", subject: id(2), count: 0 }] }).success).toBe(false));
  test("subject required", () => expect(v.autoGenerate.safeParse({ ...auto, sections: [{ title: "GK", count: 5 }] }).success).toBe(false));
});

test("publish schema", () => {
  expect(v.publishSchema.safeParse({ isPublished: true }).success).toBe(true);
  expect(v.publishSchema.safeParse({}).success).toBe(false);
});
