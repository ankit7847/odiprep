const mongoose = require("mongoose");

// Running accuracy per student per topic -> "Weak topics" + subject accuracy bars.
// Updated after every submitted attempt (cheaper than aggregating all attempts each time).
const topicStatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    attempted: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
  },
  { timestamps: true }
);

topicStatSchema.index({ user: 1, subject: 1, topic: 1 }, { unique: true });

topicStatSchema.virtual("accuracy").get(function () {
  return this.attempted ? Math.round((this.correct / this.attempted) * 100) : 0;
});

module.exports = mongoose.model("TopicStat", topicStatSchema);
