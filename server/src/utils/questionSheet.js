// Excel <-> question conversion. Pure functions (no database) so they are unit tested.
const XLSX = require("xlsx");

const OPTION_KEYS = ["A", "B", "C", "D", "E"];

// Column order of the upload template
const COLUMNS = [
  "exam", // exam slug, e.g. osssc-ri
  "subject", // subject slug, e.g. odisha-gk
  "topic", // topic slug (optional), e.g. odisha-history
  "source", // pyq | practice (default pyq)
  "year", // e.g. 2022 (optional)
  "question_en",
  "question_od",
  "option_a_en",
  "option_a_od",
  "option_b_en",
  "option_b_od",
  "option_c_en",
  "option_c_od",
  "option_d_en",
  "option_d_od",
  "option_e_en",
  "option_e_od",
  "correct", // A / B / C / D / E
  "explanation_en",
  "explanation_od",
  "difficulty", // easy | medium | hard (default medium)
];

const SAMPLE_ROW = {
  exam: "osssc-ri",
  subject: "odisha-gk",
  topic: "odisha-geography",
  source: "pyq",
  year: 2022,
  question_en: "Which river is known as the 'Sorrow of Odisha'?",
  question_od: "କେଉଁ ନଦୀକୁ 'ଓଡ଼ିଶାର ଦୁଃଖ' କୁହାଯାଏ?",
  option_a_en: "Brahmani",
  option_a_od: "ବ୍ରାହ୍ମଣୀ",
  option_b_en: "Mahanadi",
  option_b_od: "ମହାନଦୀ",
  option_c_en: "Baitarani",
  option_c_od: "ବୈତରଣୀ",
  option_d_en: "Subarnarekha",
  option_d_od: "ସୁବର୍ଣ୍ଣରେଖା",
  correct: "B",
  explanation_en: "Frequent floods of the Mahanadi earned it this name.",
  explanation_od: "",
  difficulty: "easy",
};

const clean = (v) => (v === undefined || v === null ? "" : String(v).trim());

function buildTemplate() {
  const ws = XLSX.utils.json_to_sheet([SAMPLE_ROW], { header: COLUMNS });
  ws["!cols"] = COLUMNS.map((c) => ({ wch: c.startsWith("question") || c.startsWith("explanation") ? 40 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "questions");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// Buffer (xlsx or csv) -> array of row objects keyed by lower-case header
function readRows(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
  return rows.map((r) => {
    const out = {};
    for (const [k, v] of Object.entries(r)) out[String(k).trim().toLowerCase()] = v;
    return out;
  });
}

/**
 * Validate rows and turn them into Question documents.
 * @param rows     from readRows
 * @param lookups  { exams: Map slug->id, subjects: Map slug->id, topics: Map "subjectSlug/topicSlug"->id }
 * @returns { docs: [{ row, doc }], errors: [{ row, message }] }   row = Excel row number
 */
function rowsToQuestions(rows, lookups) {
  const docs = [];
  const errors = [];

  rows.forEach((r, i) => {
    const row = i + 2; // +1 header, +1 because Excel rows start at 1
    const problems = [];

    // Skip fully empty lines
    if (COLUMNS.every((c) => !clean(r[c]))) return;

    const examSlug = clean(r.exam).toLowerCase();
    const subjectSlug = clean(r.subject).toLowerCase();
    const topicSlug = clean(r.topic).toLowerCase();
    const exam = lookups.exams.get(examSlug);
    const subject = lookups.subjects.get(subjectSlug);
    let topic;

    if (!exam) problems.push(`unknown exam "${examSlug}"`);
    if (!subject) problems.push(`unknown subject "${subjectSlug}"`);
    if (topicSlug) {
      topic = lookups.topics.get(`${subjectSlug}/${topicSlug}`);
      if (!topic) problems.push(`unknown topic "${topicSlug}" in subject "${subjectSlug}"`);
    }

    const text = { en: clean(r.question_en), od: clean(r.question_od) || undefined };
    if (!text.en) problems.push("question_en is empty");

    const options = [];
    let gap = false;
    for (const key of OPTION_KEYS) {
      const k = key.toLowerCase();
      const en = clean(r[`option_${k}_en`]);
      const od = clean(r[`option_${k}_od`]);
      if (!en && !od) {
        gap = true;
        continue;
      }
      if (gap) problems.push(`option ${key} is filled but an earlier option is empty`);
      if (!en) problems.push(`option_${k}_en is empty`);
      options.push({ key, text: { en, od: od || undefined } });
    }
    if (options.length < 2) problems.push("at least 2 options are needed");

    const correct = clean(r.correct).toUpperCase();
    if (!correct) problems.push("correct answer is empty");
    else if (!options.some((o) => o.key === correct)) problems.push(`correct "${correct}" is not one of the options`);

    const source = clean(r.source).toLowerCase() || "pyq";
    if (!["pyq", "practice"].includes(source)) problems.push(`source must be pyq or practice`);

    let year;
    if (clean(r.year)) {
      year = Number(clean(r.year));
      if (!Number.isInteger(year) || year < 1990 || year > 2100) problems.push(`year "${clean(r.year)}" is not valid`);
    }

    const difficulty = clean(r.difficulty).toLowerCase() || "medium";
    if (!["easy", "medium", "hard"].includes(difficulty)) problems.push("difficulty must be easy, medium or hard");

    if (problems.length) {
      errors.push({ row, message: problems.join("; ") });
      return;
    }

    const explanationEn = clean(r.explanation_en);
    const explanationOd = clean(r.explanation_od);

    docs.push({
      row,
      doc: {
        exam,
        subject,
        topic,
        source,
        year,
        text,
        options,
        correctOption: correct,
        explanation: explanationEn || explanationOd ? { en: explanationEn, od: explanationOd || undefined } : undefined,
        difficulty,
      },
    });
  });

  return { docs, errors };
}

module.exports = { COLUMNS, buildTemplate, readRows, rowsToQuestions };
