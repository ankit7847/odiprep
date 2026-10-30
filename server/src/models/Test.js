const mongoose = require("mongoose");

// A section of a test: "General Knowledge (40)"
const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  },
  { _id: true }
);

// A paper the student can attempt: a PYQ paper, a mock, or the daily quiz
const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },          // "OSSSC RI 2022 Paper"
    slug: { type: String, required: true, unique: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    type: { type: String, enum: ["pyq", "mock", "daily_quiz"], required: true },
    year: Number,                                     // for PYQ papers
    sequence: { type: Number, default: 0 },           // order within exam (PYQs in sequence)

    durationMinutes: { type: Number, required: true },
    marking: {
      correct: { type: Number, default: 1 },
      negative: { type: Number, default: 0.25 },
    },
    sections: [sectionSchema],

    // Denormalised for listing pages
    totalQuestions: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },

    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

testSchema.index({ exam: 1, type: 1, sequence: 1 });

testSchema.pre("save", function (next) {
  this.totalQuestions = this.sections.reduce((n, s) => n + s.questions.length, 0);
  this.totalMarks = this.totalQuestions * this.marking.correct;
  next();
});

module.exports = mongoose.model("Test", testSchema);
