const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ["Admin", "Student", "Tutor"],
      required: true,
    },
    active: {
      type: Boolean,
      default: false, // Tutors are inactive by default
    },
    approved: {
      type: Boolean,
      default: false, // Tutors are not approved by default
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending", // Tutors are pending by default
    },
    additionalDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    token: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    image: {
      type: String,
      default: "",
    },
    courseProgress: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "courseProgress",
      },
    ],
    resumePath: {
      type: String,
    }
  },
  { timestamps: true }
);

userSchema.index({ email: 1, accountType: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
