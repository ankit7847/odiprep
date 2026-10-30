const mongoose = require("mongoose");
const { localizedText } = require("./shared");

// e.g. OSSSC RI, OSSC CGL, OTET, B.Ed Entrance
const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },          // "OSSSC RI"
    slug: { type: String, required: true, unique: true, lowercase: true }, // "osssc-ri"
    board: { type: String, required: true, trim: true },         // "OSSSC"
    description: localizedText(false),
    // Default marking scheme for tests of this exam (a test can override)
    marking: {
      correct: { type: Number, default: 1 },
      negative: { type: Number, default: 0.25 },
    },
    order: { type: Number, default: 0 }, // display order on home page
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
