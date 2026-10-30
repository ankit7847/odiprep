const XLSX = require("xlsx");
const { COLUMNS, buildTemplate, readRows, rowsToQuestions } = require("../src/utils/questionSheet");
const v = require("../src/validators/question.validator");

const lookups = {
  exams: new Map([["osssc-ri", "E1"]]),
  subjects: new Map([["odisha-gk", "S1"], ["reasoning", "S2"]]),
  topics: new Map([["odisha-gk/odisha-history", "T1"]]),
};

const sheet = (rows) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows, { header: COLUMNS }), "q");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};

const good = {
  exam: "osssc-ri",
  subject: "odisha-gk",
  topic: "odisha-history",
  year: 2021,
  question_en: "Capital of Odisha?",
  question_od: "ଓଡ଼ିଶାର ରାଜଧାନୀ?",
  option_a_en: "Cuttack",
  option_b_en: "Bhubaneswar",
  option_c_en: "Puri",
  option_d_en: "Sambalpur",
  correct: "b",
};

describe("template", () => {
  test("has every column and a valid sample row", () => {
    const rows = readRows(buildTemplate());
    expect(Object.keys(rows[0])).toEqual(expect.arrayContaining(COLUMNS.filter((c) => !c.startsWith("option_e"))));
    const sampleLookups = {
      exams: new Map([["osssc-ri", "E1"]]),
      subjects: new Map([["odisha-gk", "S1"]]),
      topics: new Map([["odisha-gk/odisha-geography", "T9"]]),
    };
    const { docs, errors } = rowsToQuestions(rows, sampleLookups);
    expect(errors).toEqual([]);
    expect(docs[0].doc.text.od).toContain("ଓଡ଼ିଶା"); // Odia survives the round trip
  });
});

describe("rowsToQuestions", () => {
  test("valid row -> question doc", () => {
    const { docs, errors } = rowsToQuestions(readRows(sheet([good])), lookups);
    expect(errors).toEqual([]);
    expect(docs[0].row).toBe(2);
    expect(docs[0].doc).toMatchObject({
      exam: "E1",
      subject: "S1",
      topic: "T1",
      source: "pyq",
      year: 2021,
      correctOption: "B",
      difficulty: "medium",
    });
    expect(docs[0].doc.options.map((o) => o.key)).toEqual(["A", "B", "C", "D"]);
  });

  test("reports problems with the Excel row number", () => {
    const rows = [
      good,
      { ...good, exam: "ossc-xyz" },
      { ...good, correct: "E" },
      { ...good, question_en: "" },
      { ...good, option_b_en: "", option_c_en: "" , option_d_en: "" },
      { ...good, topic: "odisha-history", subject: "reasoning" },
      { ...good, year: "20xx" },
    ];
    const { docs, errors } = rowsToQuestions(readRows(sheet(rows)), lookups);
    expect(docs).toHaveLength(1);
    expect(errors.map((e) => e.row)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(errors[0].message).toMatch(/unknown exam/);
    expect(errors[1].message).toMatch(/not one of the options/);
    expect(errors[2].message).toMatch(/question_en is empty/);
    expect(errors[3].message).toMatch(/at least 2 options/);
    expect(errors[4].message).toMatch(/unknown topic/);
    expect(errors[5].message).toMatch(/year/);
  });

  test("option gap is an error", () => {
    const { errors } = rowsToQuestions(readRows(sheet([{ ...good, option_b_en: "" }])), lookups);
    expect(errors[0].message).toMatch(/earlier option is empty/);
  });

  test("blank lines are skipped", () => {
    const { docs, errors } = rowsToQuestions(readRows(sheet([good, {}, good])), lookups);
    expect(docs).toHaveLength(2);
    expect(errors).toHaveLength(0);
  });

  test("reads CSV too", () => {
    const csv = Buffer.from(
      "exam,subject,question_en,option_a_en,option_b_en,correct\nosssc-ri,reasoning,2+2?,3,4,B\n"
    );
    const { docs } = rowsToQuestions(readRows(csv), lookups);
    expect(docs[0].doc.correctOption).toBe("B");
  });
});

describe("question validator", () => {
  const id = "a".repeat(24);
  const q = {
    exam: id,
    subject: id,
    text: { en: "Q?" },
    options: [
      { key: "A", text: { en: "x" } },
      { key: "B", text: { en: "y" } },
    ],
    correctOption: "A",
  };
  test("valid", () => expect(v.createQuestion.safeParse(q).success).toBe(true));
  test("answer must be an option", () =>
    expect(v.createQuestion.safeParse({ ...q, correctOption: "C" }).success).toBe(false));
  test("duplicate keys rejected", () =>
    expect(v.createQuestion.safeParse({ ...q, options: [q.options[0], q.options[0]] }).success).toBe(false));
  test("partial update ok", () => expect(v.updateQuestion.safeParse({ correctOption: "B" }).success).toBe(true));
  test("publish needs ids or batch", () => expect(v.publishSchema.safeParse({}).success).toBe(false));
});
