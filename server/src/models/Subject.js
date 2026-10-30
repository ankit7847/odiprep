const mongoose = require("mongoose");
const { localizedText } = require("./shared");

// Shared across exams: "Odisha GK", "Reasoning", "Arithmetic", "English"
const subjectSchema = new mongoose.Schema(
  {
    name: localizedText(),
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
