const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const slugify = require("../../utils/slugify");
const { Exam, Subject, Topic, Question } = require("../../models");

// Small factory so exam / subject / topic share the same create, update, list code
const crud = (Model, { label, slugFrom }) => ({
  list: asyncHandler(async (req, res) => {
    const filter = {};
    if (Model === Topic && req.query.subject) filter.subject = req.query.subject;
    const items = await Model.find(filter).sort({ order: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: items });
  }),

  create: asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (!body.slug) body.slug = slugify(slugFrom(body));
    if (Model === Topic && !(await Subject.exists({ _id: body.subject }))) throw new ApiError(400, "Subject not found");
    const item = await Model.create(body);
    res.status(201).json({ success: true, data: item, message: `${label} created` });
  }),

  update: asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) throw new ApiError(404, `${label} not found`);
    res.json({ success: true, data: item, message: `${label} updated` });
  }),
});

exports.exam = crud(Exam, { label: "Exam", slugFrom: (b) => b.name });
exports.subject = crud(Subject, { label: "Subject", slugFrom: (b) => b.name.en });
exports.topic = crud(Topic, { label: "Topic", slugFrom: (b) => b.name.en });

// Exams are never hard-deleted (attempts point to them) — just hidden
exports.exam.deactivate = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!exam) throw new ApiError(404, "Exam not found");
  res.json({ success: true, data: exam, message: "Exam hidden" });
});

// A topic can be deleted only if no question uses it
exports.topic.remove = asyncHandler(async (req, res) => {
  if (await Question.exists({ topic: req.params.id })) {
    throw new ApiError(409, "Topic is used by questions, move them first");
  }
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) throw new ApiError(404, "Topic not found");
  res.json({ success: true, message: "Topic deleted" });
});
