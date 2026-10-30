// Adds one published sample mock test (16 questions, 4 sections) for OSSSC RI,
// so the mock test screen can be tried end to end.
// Run AFTER `npm run seed`:   npm run seed:sample
// Safe to run again: if the test already exists it does nothing.
require("dotenv").config();
const mongoose = require("mongoose");
const { Exam, Subject, Topic, Question, Test } = require("../src/models");
const sample = require("./sample-questions");

const TEST_SLUG = "osssc-ri-sample-mock-01";
const BATCH = "sample-mock-01";
const KEYS = ["A", "B", "C", "D", "E"];

const SECTIONS = [
  { slug: "odisha-gk", title: "General Knowledge" },
  { slug: "reasoning", title: "Reasoning" },
  { slug: "arithmetic", title: "Arithmetic" },
  { slug: "english", title: "English" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  if (await Test.exists({ slug: TEST_SLUG })) {
    console.log("Sample test already exists — nothing to do.");
    return mongoose.disconnect();
  }

  const exam = await Exam.findOne({ slug: "osssc-ri" });
  if (!exam) throw new Error('Exam "osssc-ri" not found. Run `npm run seed` first.');

  const subjects = new Map((await Subject.find()).map((s) => [s.slug, s]));
  const topics = await Topic.find();
  const topicId = (subjectId, slug) => topics.find((t) => String(t.subject) === String(subjectId) && t.slug === slug)?._id;

  const sections = [];
  for (const sec of SECTIONS) {
    const subject = subjects.get(sec.slug);
    if (!subject) throw new Error(`Subject "${sec.slug}" not found. Run \`npm run seed\` first.`);

    const docs = sample
      .filter((q) => q.subject === sec.slug)
      .map((q) => ({
        exam: exam._id,
        subject: subject._id,
        topic: q.topic ? topicId(subject._id, q.topic) : undefined,
        source: "practice",
        text: q.text,
        options: q.options.map(([en, od], i) => ({ key: KEYS[i], text: { en, od } })),
        correctOption: q.correct,
        explanation: { en: q.explanation },
        difficulty: q.difficulty,
        status: "published",
        uploadBatch: BATCH,
      }));

    const saved = await Question.insertMany(docs);
    sections.push({ title: sec.title, subject: subject._id, questions: saved.map((d) => d._id) });
  }

  const test = await Test.create({
    title: "OSSSC RI · Sample Mock 01",
    slug: TEST_SLUG,
    exam: exam._id,
    type: "mock",
    sequence: 1,
    durationMinutes: 15,
    marking: { correct: 1, negative: 0.25 },
    sections,
    isPublished: true,
    publishedAt: new Date(),
  });

  console.log(`Created "${test.title}" with ${test.totalQuestions} questions.`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
