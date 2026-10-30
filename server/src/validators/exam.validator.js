const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const localized = z.object({ en: z.string().trim().min(1), od: z.string().trim().optional() });
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Slug: only a-z, 0-9 and -");

const examSchema = z.object({
  name: z.string().trim().min(2),
  slug: slug.optional(), // auto from name if missing
  board: z.string().trim().min(2),
  description: z.object({ en: z.string().trim(), od: z.string().trim().optional() }).optional(),
  marking: z
    .object({ correct: z.number().positive(), negative: z.number().min(0) })
    .optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const subjectSchema = z.object({ name: localized, slug: slug.optional() });

const topicSchema = z.object({ subject: objectId, name: localized, slug: slug.optional() });

module.exports = {
  createExam: examSchema.strict(),
  updateExam: examSchema.partial().strict(),
  createSubject: subjectSchema.strict(),
  updateSubject: subjectSchema.partial().strict(),
  createTopic: topicSchema.strict(),
  updateTopic: topicSchema.partial().strict(),
};
