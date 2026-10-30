const mongoose = require("mongoose");

// Mistake notebook: auto-added when a student answers a question wrong.
// Student can mark it "resolved" after revising.
const mistakeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    lastAttempt: { type: mongoose.Schema.Types.ObjectId, ref: "Attempt" },
    lastSelectedOption: String,
    timesWrong: { type: Number, default: 1 },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

mistakeSchema.index({ user: 1, question: 1 }, { unique: true });
mistakeSchema.index({ user: 1, resolved: 1, updatedAt: -1 });

module.exports = mongoose.model("Mistake", mistakeSchema);
