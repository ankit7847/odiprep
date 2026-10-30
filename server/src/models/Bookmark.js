const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    note: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
