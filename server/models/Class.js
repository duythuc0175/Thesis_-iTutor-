const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // Reference to the User model (Student)
        required: function () {
            return this.type === "Personal";  // Required only for personal classes
        },
    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",  // Students participating in a group class
        }
    ],
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",  // Reference to the Course model
        required: true,
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // Reference to the User model (Tutor)
        required: true,
    },
    type: {
        type: String,
        enum: ["Personal", "Group"],  // Class can be Personal or Group
        required: true,
    },
    title: {
        type: String, // Add a title field for the class
        required: true,
    },
    time: {
        type: Date,  // Class time
        required: true,
    },
    duration: {
        type: Number,  // Duration of the class in minutes
        required: true,
    },
    classLink: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected", "Scheduled"],  
        required: function () {
            return this.type === "Personal";  
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,  // Default to current timestamp
    },
    assignment: [
        {
            fileUrl: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now },
            deadline: { type: Date }, // <-- Add this line
            solutions: [
                {
                    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    fileUrl: { type: String, required: true },
                    submittedAt: { type: Date, default: Date.now },
                    grade: { type: String },
                    feedback: { type: String }
                }
            ]
        }
    ],
    pendingRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Students requesting to join group class
        }
    ],
});

module.exports = mongoose.model("Class", classSchema);