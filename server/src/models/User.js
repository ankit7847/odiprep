const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false }, // bcrypt hash; empty for Google-only users
    googleId: { type: String, unique: true, sparse: true },
    avatar: String,

    role: { type: String, enum: ["student", "admin"], default: "student" },
    preferredLanguage: { type: String, enum: ["en", "od"], default: "en" },

    targetExam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
    targetExamDate: Date,

    // Streak is kept on the user for fast dashboard reads.
    // Day-by-day history lives in DailyActivity (heatmap).
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: String, // "YYYY-MM-DD" in IST
    },

    resetPasswordToken: { type: String, select: false }, // sha256 hash, never the raw token
    resetPasswordExpires: { type: Date, select: false },

    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
