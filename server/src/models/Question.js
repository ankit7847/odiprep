const mongoose = require("mongoose");
const { localizedText } = require("./shared");

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ["A", "B", "C", "D", "E"], required: true },
    text: localizedText(),
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },

    source: { type: String, enum: ["pyq", "practice"], default: "pyq" },
    year: Number, // for PYQs: 2022

    text: localizedText(),
    imageUrl: String, // Cloudinary, for diagram questions
    options: {
      type: [optionSchema],
      validate: [(v) => v.length >= 2, "At least 2 options are required"],
    },
    correctOption: { type: String, enum: ["A", "B", "C", "D", "E"], required: true },
    explanation: localizedText(false),

    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },

    // Draft -> admin reviews -> published (only published is shown to students)
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    uploadBatch: String, // id of the Excel upload this came from (easy rollback)
  },
  { timestamps: true }
);

questionSchema.index({ exam: 1, subject: 1, status: 1 });
questionSchema.index({ exam: 1, year: 1 });
questionSchema.index({ topic: 1 });

// Never send the answer to the client during a running test
questionSchema.methods.toStudentJSON = function () {
  const q = this.toObject();
  delete q.correctOption;
  delete q.explanation;
  return q;
};

module.exports = mongoose.model("Question", questionSchema);
