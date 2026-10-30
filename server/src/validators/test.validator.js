const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Slug: only a-z, 0-9 and -");
const marking = z.object({
  correct: z.number().positive().max(10),
  negative: z.number().min(0).max(10),
});

const meta = {
  title: z.string().trim().min(3).max(120),
  slug: slug.optional(),
  exam: objectId,
  type: z.enum(["pyq", "mock", "daily_quiz"]),
  year: z.number().int().min(1990).max(2100).nullable().optional(),
  sequence: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).max(600),
  marking: marking.optional(),
};

const section = z.object({
  title: z.string().trim().min(1).max(60),
  subject: objectId.nullable().optional(),
  questions: z.array(objectId).max(500),
});

const noDuplicateQuestions = (t) => {
  if (!t.sections) return true;
  const all = t.sections.flatMap((s) => s.questions);
  return new Set(all).size === all.length;
};
const dupMsg = { message: "A question appears more than once in this test", path: ["sections"] };

const createTest = z
  .object({ ...meta, sections: z.array(section).min(1).max(10) })
  .strict()
  .refine(noDuplicateQuestions, dupMsg);

const updateTest = z
  .object({ ...meta, sections: z.array(section).min(1).max(10) })
  .partial()
  .strict()
  .refine(noDuplicateQuestions, dupMsg);

// "Pick N random published questions per subject"
const autoGenerate = z
  .object({
    ...meta,
    sections: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(60),
          subject: objectId,
          topic: objectId.nullable().optional(),
          count: z.number().int().min(1).max(200),
        })
      )
      .min(1)
      .max(10),
    source: z.enum(["pyq", "practice"]).optional(), // only pick from this source
  })
  .strict();

const publishSchema = z.object({ isPublished: z.boolean() }).strict();

// Turn one Excel upload into a test: sections by subject, questions in sheet order
const fromBatch = z
  .object({
    ...meta,
    exam: objectId.optional(), // defaults to the exam of the uploaded questions
    uploadBatch: z.string().trim().min(1).max(60),
  })
  .strict();

module.exports = { createTest, updateTest, autoGenerate, publishSchema, fromBatch };
