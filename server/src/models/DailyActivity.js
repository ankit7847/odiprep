const mongoose = require("mongoose");

// One row per student per active day -> streak heatmap on dashboard
const dailyActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD" in IST
    questionsAttempted: { type: Number, default: 0 },
    testsCompleted: { type: Number, default: 0 },
    minutesSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dailyActivitySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyActivity", dailyActivitySchema);
