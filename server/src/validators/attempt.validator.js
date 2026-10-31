const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const startSchema = z.object({ testId: objectId }).strict();

const answerSchema = z
  .object({
    questionId: objectId,
    selectedOption: z.enum(["A", "B", "C", "D", "E"]).nullable().optional(), // null = clear answer
    markedForReview: z.boolean().optional(),
    timeSpentSec: z.number().int().min(0).max(3600).optional(),
    questionIndex: z.number().int().min(0).optional(),
  })
  .strict();

const warningSchema = z.object({ kind: z.enum(["tab_switch", "fullscreen_exit"]) }).strict();

module.exports = { startSchema, answerSchema, warningSchema };
