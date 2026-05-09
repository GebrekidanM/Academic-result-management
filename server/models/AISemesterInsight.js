const mongoose = require("mongoose");

const aiSemesterInsightSchema =
  new mongoose.Schema({
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    semester: {
      type: String,
      required: true
    },
    academicYear: {
      type: String,
      required: true
    },
    language: {
      type: String,
      default: "en"
    },
    insight: {
      type: Object,
      required: true
    }
  }, {
    timestamps: true
  });

module.exports = mongoose.model("AISemesterInsight", aiSemesterInsightSchema);