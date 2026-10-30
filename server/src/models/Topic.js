const mongoose = require("mongoose");
const { localizedText } = require("./shared");

// A topic belongs to a subject: Odisha GK -> "Odisha History"
// Used for the "weak topics" feature.
const topicSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    name: localizedText(),
    slug: { type: String, required: true, lowercase: true },
  },
  { timestamps: true }
);

topicSchema.index({ subject: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("Topic", topicSchema);
