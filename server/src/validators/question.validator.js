const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const localized = z.object({ en: z.string().trim().min(1), od: z.string().trim().optional() });
const optionalLocalized = z.object({ en: z.string().trim(), od: z.string().trim().optional() });
const key = z.enum(["A", "B", "C", "D", "E"]);

const base = z.object({
  exam: objectId,
  subject: objectId,
  topic: objectId.nullable().optional(),
  source: z.enum(["pyq", "practice"]).optional(),
  year: z.number().int().min(1990).max(2100).nullable().optional(),
  text: localized,
  imageUrl: z.string().url().nullable().optional(),
  options: z
    .array(z.object({ key, text: localized }))
    .min(2, "At least 2 options are needed")
    .max(5)
    .refine((opts) => new Set(opts.map((o) => o.key)).size === opts.length, "Option keys must be unique"),
  correctOption: key,
  explanation: optionalLocalized.optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const answerIsAnOption = (q) => !q.options || !q.correctOption || q.options.some((o) => o.key === q.correctOption);
const msg = { message: "Correct answer must be one of the options", path: ["correctOption"] };

const createQuestion = base.strict().refine(answerIsAnOption, msg);
const updateQuestion = base.partial().strict().refine(answerIsAnOption, msg);

const publishSchema = z
  .object({
    ids: z.array(objectId).min(1).max(1000).optional(),
    uploadBatch: z.string().min(1).optional(),
  })
  .strict()
  .refine((b) => b.ids || b.uploadBatch, "Send ids or uploadBatch");

module.exports = { createQuestion, updateQuestion, publishSchema };
