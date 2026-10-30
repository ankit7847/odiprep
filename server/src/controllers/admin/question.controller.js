const crypto = require("crypto");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { Question, Exam, Subject, Topic, Test } = require("../../models");
const { buildTemplate, readRows, rowsToQuestions } = require("../../utils/questionSheet");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/questions?exam=&subject=&topic=&status=&source=&year=&batch=&search=&page=&limit=
exports.list = asyncHandler(async (req, res) => {
  const { exam, subject, topic, status, source, year, batch, search } = req.query;
  const filter = {};
  if (exam) filter.exam = exam;
  if (subject) filter.subject = subject;
  if (topic) filter.topic = topic;
  if (status) filter.status = status;
  else filter.status = { $ne: "archived" };
  if (source) filter.source = source;
  if (year) filter.year = Number(year);
  if (batch) filter.uploadBatch = batch;
  if (search) {
    const rx = new RegExp(escapeRegex(String(search).slice(0, 100)), "i");
    filter.$or = [{ "text.en": rx }, { "text.od": rx }];
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const [items, total] = await Promise.all([
    Question.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("exam", "name slug")
      .populate("subject", "name slug")
      .populate("topic", "name slug")
      .lean(),
    Question.countDocuments(filter),
  ]);
  res.json({ success: true, data: { items, total, page, pages: Math.ceil(total / limit) } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id).populate("exam subject topic", "name slug").lean();
  if (!q) throw new ApiError(404, "Question not found");
  res.json({ success: true, data: q });
});

// Check that exam/subject/topic ids exist and the topic belongs to the subject
async function checkRefs({ exam, subject, topic }, current = {}) {
  const subjectId = subject || current.subject;
  if (exam && !(await Exam.exists({ _id: exam }))) throw new ApiError(400, "Exam not found");
  if (subject && !(await Subject.exists({ _id: subject }))) throw new ApiError(400, "Subject not found");
  if (topic && !(await Topic.exists({ _id: topic, subject: subjectId }))) {
    throw new ApiError(400, "Topic not found in this subject");
  }
}

exports.create = asyncHandler(async (req, res) => {
  await checkRefs(req.body);
  const q = await Question.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: q, message: "Question added" });
});

exports.update = asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id);
  if (!q) throw new ApiError(404, "Question not found");
  await checkRefs(req.body, q);

  const changes = { ...req.body };
  // Editing only the answer key? It must still match the existing options
  const options = changes.options || q.options;
  const correct = changes.correctOption || q.correctOption;
  if (!options.some((o) => o.key === correct)) throw new ApiError(400, "Correct answer must be one of the options");

  Object.assign(q, changes);
  await q.save();
  res.json({ success: true, data: q, message: "Question updated" });
});

// Never hard-delete: old attempts and reviews still point to the question
exports.archive = asyncHandler(async (req, res) => {
  const q = await Question.findByIdAndUpdate(req.params.id, { status: "archived" }, { new: true });
  if (!q) throw new ApiError(404, "Question not found");
  res.json({ success: true, message: "Question archived" });
});

// ---------- Excel ----------

exports.template = (req, res) => {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="odiprep-questions-template.xlsx"');
  res.send(buildTemplate());
};

async function loadLookups() {
  const [exams, subjects, topics] = await Promise.all([
    Exam.find().select("slug").lean(),
    Subject.find().select("slug").lean(),
    Topic.find().select("slug subject").lean(),
  ]);
  const subjectSlugById = new Map(subjects.map((s) => [String(s._id), s.slug]));
  return {
    exams: new Map(exams.map((e) => [e.slug, e._id])),
    subjects: new Map(subjects.map((s) => [s.slug, s._id])),
    topics: new Map(topics.map((t) => [`${subjectSlugById.get(String(t.subject))}/${t.slug}`, t._id])),
  };
}

// POST /api/admin/questions/upload   (form-data: file)   ?dryRun=true to only check
// Valid rows are saved as DRAFT under one uploadBatch id; bad rows are reported with their Excel row number.
exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Attach a file in the 'file' field");

  let rows;
  try {
    rows = readRows(req.file.buffer);
  } catch {
    throw new ApiError(400, "Could not read the file. Use the template.");
  }
  if (!rows.length) throw new ApiError(400, "The sheet is empty");
  if (rows.length > 2000) throw new ApiError(400, "Max 2000 rows per upload, split the file");

  const { docs, errors } = rowsToQuestions(rows, await loadLookups());
  const dryRun = req.query.dryRun === "true";

  if (dryRun || !docs.length) {
    return res.status(docs.length ? 200 : 400).json({
      success: docs.length > 0,
      message: dryRun ? "Checked, nothing saved" : "No valid rows to save",
      data: { valid: docs.length, invalid: errors.length, errors },
    });
  }

  const uploadBatch = `${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(3).toString("hex")}`;
  await Question.insertMany(
    docs.map(({ doc }) => ({ ...doc, status: "draft", uploadBatch, createdBy: req.user._id })),
    { ordered: true }
  );

  res.status(201).json({
    success: true,
    message: `${docs.length} questions saved as draft`,
    data: { uploadBatch, saved: docs.length, invalid: errors.length, errors },
  });
});

// POST /api/admin/questions/publish   { ids } or { uploadBatch }
exports.publish = asyncHandler(async (req, res) => {
  const filter = { status: "draft" };
  if (req.body.ids) filter._id = { $in: req.body.ids };
  if (req.body.uploadBatch) filter.uploadBatch = req.body.uploadBatch;
  const r = await Question.updateMany(filter, { $set: { status: "published" } });
  res.json({ success: true, message: `${r.modifiedCount} questions published`, data: { published: r.modifiedCount } });
});

// DELETE /api/admin/questions/batch/:uploadBatch  -> undo a wrong upload (drafts only, unused in tests)
exports.deleteBatch = asyncHandler(async (req, res) => {
  const ids = await Question.find({ uploadBatch: req.params.uploadBatch, status: "draft" }).distinct("_id");
  if (!ids.length) throw new ApiError(404, "No draft questions in this batch");
  if (await Test.exists({ "sections.questions": { $in: ids } })) {
    throw new ApiError(409, "Some of these questions are already used in a test");
  }
  const r = await Question.deleteMany({ _id: { $in: ids } });
  res.json({ success: true, message: `${r.deletedCount} draft questions deleted` });
});
