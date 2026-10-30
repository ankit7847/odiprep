const mongoose = require("mongoose");
const crypto = require("crypto");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const slugify = require("../../utils/slugify");
const { Test, Exam, Question, Attempt } = require("../../models");

const toId = (id) => new mongoose.Types.ObjectId(id);

async function uniqueSlug(base, ignoreId) {
  let s = slugify(base) || "test";
  const taken = await Test.exists({ slug: s, ...(ignoreId && { _id: { $ne: ignoreId } }) });
  if (taken) s = `${s}-${crypto.randomBytes(2).toString("hex")}`;
  return s;
}

// Every question must exist and be published (drafts never reach students)
async function checkQuestions(sections) {
  const ids = sections.flatMap((s) => s.questions);
  if (!ids.length) return;
  const found = await Question.find({ _id: { $in: ids } }).select("status").lean();
  if (found.length !== ids.length) throw new ApiError(400, "Some questions were not found");
  const notPublished = found.filter((q) => q.status !== "published").length;
  if (notPublished) throw new ApiError(400, `${notPublished} question(s) are not published yet. Publish them first.`);
}

// GET /api/admin/tests?exam=&type=&published=true|false
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.exam) filter.exam = req.query.exam;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.published) filter.isPublished = req.query.published === "true";

  const tests = await Test.find(filter)
    .sort({ createdAt: -1 })
    .select("title slug exam type year sequence durationMinutes marking totalQuestions isPublished publishedAt createdAt")
    .populate("exam", "name slug")
    .lean();

  // How many students attempted each test
  const counts = await Attempt.aggregate([
    { $match: { test: { $in: tests.map((t) => t._id) } } },
    { $group: { _id: "$test", n: { $sum: 1 } } },
  ]);
  const byTest = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({ success: true, data: tests.map((t) => ({ ...t, attempts: byTest.get(String(t._id)) || 0 })) });
});

// GET /api/admin/tests/:id  (with question previews for the editor)
exports.getOne = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id)
    .populate("exam", "name slug")
    .populate({ path: "sections.questions", select: "text.en options correctOption subject topic status year source" })
    .lean();
  if (!test) throw new ApiError(404, "Test not found");
  const attempts = await Attempt.countDocuments({ test: test._id });
  res.json({ success: true, data: { ...test, attempts } });
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!(await Exam.exists({ _id: body.exam }))) throw new ApiError(400, "Exam not found");
  await checkQuestions(body.sections);
  const exam = await Exam.findById(body.exam).select("marking").lean();

  const test = new Test({
    ...body,
    slug: body.slug ? await uniqueSlug(body.slug) : await uniqueSlug(body.title),
    marking: body.marking || exam.marking,
    isPublished: false,
    createdBy: req.user._id,
  });
  await test.save(); // pre-save fills totalQuestions / totalMarks
  res.status(201).json({ success: true, data: test, message: "Test created as a draft" });
});

exports.update = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw new ApiError(404, "Test not found");
  const body = { ...req.body };

  // Once students have taken a test, its questions and marking are frozen so old results stay correct
  if ((body.sections || body.marking) && (await Attempt.exists({ test: test._id }))) {
    throw new ApiError(409, "Students have already taken this test, so questions and marking can’t change. Create a new test instead.");
  }
  if (body.exam && !(await Exam.exists({ _id: body.exam }))) throw new ApiError(400, "Exam not found");
  if (body.sections) await checkQuestions(body.sections);
  if (body.slug) body.slug = await uniqueSlug(body.slug, test._id);

  Object.assign(test, body);
  if (test.isPublished && !test.totalQuestions) throw new ApiError(400, "A published test needs questions");
  await test.save();
  res.json({ success: true, data: test, message: "Test saved" });
});

// POST /api/admin/tests/:id/publish   { isPublished }
exports.publish = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) throw new ApiError(404, "Test not found");
  if (req.body.isPublished) {
    if (!test.totalQuestions) throw new ApiError(400, "Add questions before publishing");
    await checkQuestions(test.sections.map((s) => ({ questions: s.questions.map(String) })));
    test.publishedAt = test.publishedAt || new Date();
  }
  test.isPublished = req.body.isPublished;
  await test.save();
  res.json({ success: true, data: test, message: req.body.isPublished ? "Test is live" : "Test hidden from students" });
});

exports.remove = asyncHandler(async (req, res) => {
  if (await Attempt.exists({ test: req.params.id })) {
    throw new ApiError(409, "Students have taken this test. Unpublish it instead of deleting.");
  }
  const t = await Test.findByIdAndDelete(req.params.id);
  if (!t) throw new ApiError(404, "Test not found");
  res.json({ success: true, message: "Test deleted" });
});

// POST /api/admin/tests/auto-generate  -> random published questions per section, saved as a draft test
exports.autoGenerate = asyncHandler(async (req, res) => {
  const { sections: wanted, source, ...meta } = req.body;
  const exam = await Exam.findById(meta.exam).select("marking").lean();
  if (!exam) throw new ApiError(400, "Exam not found");

  const used = [];
  const sections = [];
  const shortages = [];
  for (const s of wanted) {
    const match = {
      exam: toId(meta.exam),
      subject: toId(s.subject),
      status: "published",
      _id: { $nin: used },
      ...(s.topic && { topic: toId(s.topic) }),
      ...(source && { source }),
    };
    const picked = await Question.aggregate([{ $match: match }, { $sample: { size: s.count } }, { $project: { _id: 1 } }]);
    if (picked.length < s.count) shortages.push(`${s.title}: only ${picked.length} of ${s.count} available`);
    picked.forEach((p) => used.push(p._id));
    sections.push({ title: s.title, subject: s.subject, questions: picked.map((p) => p._id) });
  }

  if (!used.length) throw new ApiError(400, "No published questions match. Upload and publish questions first.");

  const test = new Test({
    ...meta,
    slug: meta.slug ? await uniqueSlug(meta.slug) : await uniqueSlug(meta.title),
    marking: meta.marking || exam.marking,
    sections: sections.filter((s) => s.questions.length),
    isPublished: false,
    createdBy: req.user._id,
  });
  await test.save();
  res.status(201).json({
    success: true,
    data: test,
    message: shortages.length ? `Draft created, but ${shortages.join("; ")}` : `Draft created with ${test.totalQuestions} questions`,
    warnings: shortages,
  });
});
