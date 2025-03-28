const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
});

const sectionSchema = new mongoose.Schema({
  sectionName: {
    type: String,
    required: true,
  },
  pdfFile: {
    type: String,
    required: true, // Path or URL to the PDF file
  },
  quiz: [
    {
      type: questionSchema, // Embedding the question schema for the quiz
    },
  ],
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model (assumed to represent tutors)
    required: true,
  },
  courseIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course", // Reference to the Course model
      required: true, // Ensure courseIds is always populated
    },
  ],
});

module.exports = mongoose.model("Section", sectionSchema);
