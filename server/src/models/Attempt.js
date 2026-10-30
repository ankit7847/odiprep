const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    section: { type: mongoose.Schema.Types.ObjectId }, // Test.sections._id
    selectedOption: { type: String, enum: ["A", "B", "C", "D", "E", null], default: null },
    markedForReview: { type: Boolean, default: false },
    visited: { type: Boolean, default: false },
    timeSpentSec: { type: Number, default: 0 },
    isCorrect: Boolean, // filled on submit
  },
  { _id: false }
);

const sectionResultSchema = new mongoose.Schema(
  {
    section: mongoose.Schema.Types.ObjectId,
    title: String,
    correct: Number,
    wrong: Number,
    skipped: Number,
    score: Number,
  },
  { _id: false }
);

const warningSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["tab_switch", "fullscreen_exit"], required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// One student's attempt at one test.
// Timer lives on the SERVER (startedAt/endsAt) so refresh can't reset it.
const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "auto_submitted"],
      default: "in_progress",
    },
    startedAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    submittedAt: Date,

    answers: [answerSchema],
    lastQuestionIndex: { type: Number, default: 0 }, // resume where left off

    // Light integrity checks (no camera)
    warnings: [warningSchema],

    // Result (filled on submit)
    result: {
      score: Number,
      maxScore: Number,
      correct: Number,
      wrong: Number,
      skipped: Number,
      accuracy: Number, // correct / attempted * 100
      timeTakenSec: Number,
      rank: Number,
      percentile: Number,
      sections: [sectionResultSchema],
    },
  },
  { timestamps: true }
);

attemptSchema.index({ user: 1, test: 1, status: 1 });
attemptSchema.index({ test: 1, "result.score": -1 }); // leaderboard / rank
attemptSchema.index({ user: 1, submittedAt: -1 });   // dashboard score trend

module.exports = mongoose.model("Attempt", attemptSchema);
