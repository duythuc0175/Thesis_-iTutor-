const Class = require("../models/Class");
const ClassRequest = require("../models/ClassRequest");
const Course = require("../models/Course");
const Notification = require("../models/Notification");
const cron = require("node-cron");
const { uploadFileToS3 } = require("../config/s3Config");

exports.sendClassRequest = async (req, res) => {
    try {
        const { type, time, duration } = req.body;
        const courseId = req.params.courseId;
        const studentId = req.user.id;

        if (!type || !time || !duration) {
            return res.status(400).json({ error: "Class type, duration and time are required." });
        }

        const classTime = new Date(time);
        if (isNaN(classTime.getTime())) {
            return res.status(400).json({ error: "Invalid time format." });
        }

        const startTime = new Date(classTime);
        const endTime = new Date(classTime.getTime() + duration * 60 * 1000);

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found." });
        }

        const tutorId = course.tutor;

        const isEnrolled = course.studentsEnrolled.some((enrolledStudent) =>
            enrolledStudent.equals(studentId)
        );

        if (!isEnrolled) {
            return res.status(403).json({ error: "You are not enrolled in this course." });
        }

        // Exclude rejected requests when checking for existing requests
        const existingRequest = await ClassRequest.findOne({
            student: studentId,
            time: { 
                $gte: startTime.toISOString(), 
                $lt: endTime.toISOString() 
            },
            status: { $ne: "Rejected" }, // Exclude rejected requests
        });

        if (existingRequest) {
            return res.status(400).json({ error: "You have already made a request for this time or within the same hour." });
        }

        const classRequest = new ClassRequest({
            student: studentId,
            tutor: tutorId,
            course: courseId,
            type,
            duration,
            time: startTime,
            status: "Pending",
        });

        await classRequest.save();

        const notification = new Notification({
            user: tutorId,
            type: "ClassRequestSent",
            message: `You have received a class request from a student for the course: ${course.courseName} at ${startTime.toISOString()}.`,
        });

        await notification.save();

        return res.status(201).json({
            message: "Class request sent successfully.",
            classRequest,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

exports.handleClassRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, classLink } = req.body;

        console.log("Received Request Details:", {
            requestId,
            status,
            classLink
        });

        const classRequest = await ClassRequest.findById(requestId)
            .populate('student')
            .populate('tutor')
            .populate('course');

        if (!classRequest) {
            console.error("Class request not found for ID:", requestId);
            return res.status(404).json({ error: "Class request not found." });
        }

        console.log("Full Class Request Object:", JSON.stringify(classRequest, null, 2));

        // Validate essential fields
        if (!classRequest.student) {
            console.error("No student found in class request");
            return res.status(400).json({ error: "Student information is missing" });
        }

        if (!classRequest.tutor) {
            console.error("No tutor found in class request");
            return res.status(400).json({ error: "Tutor information is missing" });
        }

        if (!classRequest.course) {
            console.error("No course found in class request");
            return res.status(400).json({ error: "Course information is missing" });
        }

        if (status === "Accepted") {
            try {
                const startTime = new Date(classRequest.time);
                const endTime = new Date(startTime.getTime() + classRequest.duration * 60 * 1000);

                // Check for time conflicts with both personal and group classes
                const conflictingClass = await Class.findOne({
                    tutor: classRequest.tutor._id,
                    $or: [
                        {
                            time: { $lt: endTime },
                            $expr: { $gte: [{ $add: ["$time", { $multiply: ["$duration", 60000] }] }, startTime] }
                        },
                        {
                            time: { $gte: startTime, $lt: endTime }
                        }
                    ]
                });

                if (conflictingClass) {
                    console.error("Time conflict detected with another class:", conflictingClass);
                    return res.status(409).json({
                        error: "Time conflict detected with another class.",
                        conflictingClass
                    });
                }

                if (classRequest.type === "Personal") {
                    console.log("Creating Personal Class");
                    const newClass = new Class({
                        title: `Personal Class for ${classRequest.course.courseName}`, // Add default title
                        student: classRequest.student._id,
                        tutor: classRequest.tutor._id,
                        course: classRequest.course._id,
                        type: "Personal",
                        time: classRequest.time,
                        duration: classRequest.duration, // Use duration from classRequest
                        classLink: classLink || "", // Allow empty link
                        status: "Accepted" // Explicitly set status to "Accepted"
                    });

                    console.log("New Class Object:", JSON.stringify(newClass, null, 2));

                    await newClass.save();
                    console.log("Personal Class Created Successfully");
                } else if (classRequest.type === "Group") {
                    console.log("Creating/Updating Group Class");
                    let groupClass = await Class.findOne({
                        course: classRequest.course._id,
                        type: "Group",
                    });

                    if (!groupClass) {
                        groupClass = new Class({
                            title: `Group Class for ${classRequest.course.courseName}`,
                            participants: [classRequest.student._id],
                            tutor: classRequest.tutor._id,
                            course: classRequest.course._id,
                            type: "Group",
                            time: classRequest.time,
                            duration: classRequest.duration,
                            classLink: classLink || "No meeting link provided",
                            status: "Accepted", // Explicitly set status to "Accepted"
                        });
                    } else {
                        if (!groupClass.participants.includes(classRequest.student._id.toString())) {
                            groupClass.participants.push(classRequest.student._id);
                        }
                        groupClass.status = "Accepted"; // Explicitly set status to "Accepted"
                    }

                    await groupClass.save();
                    console.log("Group Class Created/Updated Successfully");
                }

                // Update the request status to "Accepted" only if no conflict is found
                classRequest.status = "Accepted";
                await classRequest.save();
            } catch (classCreationError) {
                console.error("Error in class creation:", classCreationError);
                return res.status(500).json({
                    error: "Failed to create class",
                    details: classCreationError.message,
                });
            }
        } else {
            // Update the request status for other actions (e.g., "Rejected")
            classRequest.status = status;
            await classRequest.save();
        }

        return res.status(200).json({
            message: `Class request ${status.toLowerCase()} successfully.`,
            type: classRequest.type,
        });

    } catch (error) {
        console.error("Comprehensive Error in handleClassRequest:", error);
        return res.status(500).json({
            error: "An error occurred while handling the class request.",
            details: error.message,
        });
    }
};

exports.getClassRequestsForTutor = async (req, res) => {
    try {
        const tutorId = req.user.id;
        const classRequests = await ClassRequest.find({ tutor: tutorId })
            .populate('student', 'name email')
            .populate('course', 'title description');

        return res.status(200).json({
            message: "Class requests retrieved successfully.",
            classRequests,
        });
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while fetching class requests." });
    }
};

exports.getStudentClassRequests = async (req, res) => {
    try {
        const studentId = req.user.id;
        const classRequests = await ClassRequest.find({ student: studentId })
            .populate('tutor', 'name email')
            .populate('course', 'title description');

        return res.status(200).json({
            message: "Class requests retrieved successfully.",
            classRequests,
        });
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while fetching class requests." });
    }
};

exports.getAcceptedClasses = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.accountType;

        let query = { status: "Accepted" };

        if (userRole === "Tutor") {
            // ✅ Tutors see all classes they created
            query.$or = [
                { tutor: userId, type: "Personal" },
                { tutor: userId, type: "Group" }
            ];
        } else {
            // ✅ Students see personal classes they requested AND group classes they participate in
            query.$or = [
                { type: "Personal", student: userId },
                { type: "Group", participants: userId }
            ];
        }

        const acceptedClasses = await Class.find(query)
            .populate('tutor', 'firstName email')
            .populate('course', 'courseName courseDescription')
            .populate('student', 'firstName email') // For personal classes
            .populate('participants', 'firstName email'); // For group classes

        return res.status(200).json({
            message: "Accepted classes retrieved successfully.",
            acceptedClasses,
        });
    } catch (error) {
        console.error("Error fetching accepted classes:", error);
        return res.status(500).json({
            error: "An error occurred while fetching accepted classes.",
            details: error.message
        });
    }
};


// Function to delete a class after its duration
const scheduleClassDeletion = (classId, duration) => {
    const deletionTime = duration * 60 * 1000; // Convert duration to milliseconds
    setTimeout(async () => {
        try {
            await Class.findByIdAndDelete(classId);
            console.log(`Class ${classId} deleted after ${duration} minutes.`);
        } catch (error) {
            console.error("Error deleting class:", error);
        }
    }, deletionTime);
};

// Example usage in createGroupClass
exports.createGroupClass = async (req, res) => {
    try {
        const { title, time, classLink, duration } = req.body;
        const courseId = req.params.courseId;
        const tutorId = req.user.id;

        // Validate input
        if (!title || !time || !duration) {
            return res.status(400).json({ error: "Class title, time, and duration are required." });
        }

        const classTime = new Date(time);
        if (isNaN(classTime.getTime())) {
            return res.status(400).json({ error: "Invalid time format." });
        }

        const currentTime = new Date();
        if (classTime < currentTime) {
            return res.status(400).json({ error: "Cannot create a class in the past." });
        }

        // Fetch the course and validate
        const course = await Course.findById(courseId).populate("studentsEnrolled", "_id");
        if (!course) {
            return res.status(404).json({ error: "Course not found." });
        }

        if (!course.tutor.equals(tutorId)) {
            return res.status(403).json({ error: "You are not authorized to create a group class for this course." });
        }

        if (!course.studentsEnrolled || course.studentsEnrolled.length === 0) {
            return res.status(400).json({ error: "No students are enrolled in this course." });
        }

        // Create group class
        const groupClass = new Class({
            title,
            tutor: tutorId,
            course: courseId,
            type: "Group",
            time: classTime,
            duration,
            classLink: classLink || "No meeting link provided", // Default value if no link is provided
            participants: course.studentsEnrolled.map((student) => student._id),
            status: "Accepted", // Ensure the status is set to "Accepted"
        });

        await groupClass.save();

        return res.status(201).json({
            message: "Group class created successfully.",
            groupClass,
        });
    } catch (error) {
        console.error("Error in createGroupClass:", error);
        return res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

exports.getGroupClasses = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Fetch all upcoming group classes for the course
        const currentTime = new Date();
        console.log("Fetching group classes for course:", courseId, "at time:", currentTime);

        const groupClasses = await Class.find({
            course: courseId,
            type: "Group",
            time: { $gte: currentTime }, // Only fetch classes with a future time
        })
        .populate("course", "courseName") // Populate the course field with courseName
        .populate("participants", "firstName email"); // Populate participants if needed

        console.log("Fetched group classes:", groupClasses);

        if (!groupClasses || groupClasses.length === 0) {
            return res.status(200).json({
                success: true,
                groupClasses: [], // Return an empty array if no group classes are found
            });
        }

        return res.status(200).json({
            success: true,
            groupClasses,
        });
    } catch (error) {
        console.error("Error fetching group classes:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching group classes.",
        });
    }
};

exports.deleteClassById = async (req, res) => {
    try {
        const { classId } = req.params;

        // Find and delete the class
        const deletedClass = await Class.findByIdAndDelete(classId);

        if (!deletedClass) {
            return res.status(404).json({
                success: false,
                message: "Class not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Class deleted successfully.",
        });
    } catch (error) {
        console.error("Error deleting class:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error occurred while deleting the class.",
            error: error.message,
        });
    }
};

exports.requestToJoinGroupClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const studentId = req.user.id;

        // Find the group class
        const groupClass = await Class.findById(classId);
        if (!groupClass || groupClass.type !== "Group") {
            return res.status(404).json({ error: "Group class not found." });
        }

        // Check if the student is already a participant
        if (groupClass.participants.includes(studentId)) {
            return res.status(400).json({ error: "You are already a participant in this group class." });
        }

        // Check if the student is enrolled in the course
        const course = await Course.findById(groupClass.course);
        if (!course || !course.studentsEnrolled.includes(studentId)) {
            return res.status(403).json({ error: "You must be enrolled in the course to join this group class." });
        }

        // Add the student to the participants list
        groupClass.participants.push(studentId);
        await groupClass.save();

        return res.status(200).json({
            message: "Successfully joined the group class.",
            groupClass,
        });
    } catch (error) {
        console.error("Error in requestToJoinGroupClass:", error);
        return res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};

exports.getAvailableGroupTimes = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Find all group classes for the course
        const groupClasses = await Class.find({
            course: courseId,
            type: "Group",
        }).select("time duration");

        if (!groupClasses || groupClasses.length === 0) {
            return res.status(200).json({
                success: true,
                data: [], // Return an empty array if no group classes are available
            });
        }

        // Map the group classes to return only the start times
        const availableTimes = groupClasses.map((groupClass) => ({
            time: groupClass.time,
            duration: groupClass.duration,
        }));

        return res.status(200).json({
            success: true,
            data: availableTimes,
        });
    } catch (error) {
        console.error("Error fetching available group times:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching available group times.",
        });
    }
};

exports.getTutorClasses = async (req, res) => {
    try {
        const tutorId = req.user.id;

        // Fetch all classes where the logged-in user is the tutor
        const classes = await Class.find({ tutor: tutorId })
            .populate("course", "courseName") // Populate course details
            .populate("participants", "_id"); // Populate participants

        return res.status(200).json({
            success: true,
            classes,
        });
    } catch (error) {
        console.error("Error fetching classes for tutor:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch classes for the tutor.",
        });
    }
};

// Upload assignment PDF for a class (Tutor only)
exports.uploadAssignment = async (req, res) => {
    try {
        const { classId } = req.params;
        if (req.user.accountType !== "Tutor") {
            return res.status(401).json({ success: false, message: "Only tutors can upload assignments." });
        }
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded." });
        }
        // Only allow PDF
        if (file.mimetype !== "application/pdf") {
            return res.status(400).json({ success: false, message: "Only PDF files are allowed." });
        }
        // Use "assignment" as fileType to upload to assignment folder
        const fileUrl = await uploadFileToS3(file.buffer, file.originalname, "assignment");

        // Ensure assignment is always an array
        let classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found." });
        }
        if (!Array.isArray(classDoc.assignment)) {
            classDoc.assignment = [];
        }
        classDoc.assignment.push({ fileUrl, uploadedAt: new Date() });
        await classDoc.save();

        return res.status(200).json({ success: true, message: "Assignment uploaded successfully.", assignments: classDoc.assignment });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to upload assignment.", error: error.message });
    }
};

// Student submits solution for an assignment
exports.submitAssignmentSolution = async (req, res) => {
    try {
        const { classId, assignmentIdx } = req.params;
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded." });
        }
        if (file.mimetype !== "application/pdf") {
            return res.status(400).json({ success: false, message: "Only PDF files are allowed." });
        }

        // Upload to S3 under 'solution' folder
        const fileUrl = await uploadFileToS3(file.buffer, file.originalname, "solution");

        // Find class and update the assignment's solutions array
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found." });
        }
        const idx = parseInt(assignmentIdx, 10);
        if (!Array.isArray(classDoc.assignment) || !classDoc.assignment[idx]) {
            return res.status(404).json({ success: false, message: "Assignment not found." });
        }

        // Ensure solutions array exists
        if (!classDoc.assignment[idx].solutions) {
            classDoc.assignment[idx].solutions = [];
        }
        // --- Change: store as ObjectId, not string ---
        classDoc.assignment[idx].solutions.push({
            student: req.user._id, // Always store as ObjectId
            fileUrl,
            submittedAt: new Date()
        });
        await classDoc.save();

        return res.status(200).json({ success: true, message: "Solution submitted successfully!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to submit solution.", error: error.message });
    }
};

// Get assignment PDF URLs for a class
exports.getAssignment = async (req, res) => {
    try {
        const { classId } = req.params;
        // Populate student info in solutions
        const classObj = await Class.findById(classId)
            .populate({
                path: "assignment.solutions.student",
                select: "firstName lastName email"
            });
        if (!classObj || !classObj.assignment || classObj.assignment.length === 0) {
            return res.status(404).json({ success: false, message: "Assignment not found." });
        }
        // Return assignments with populated student info
        return res.status(200).json({ success: true, assignments: classObj.assignment });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch assignment.", error: error.message });
    }
};

// Grade a student's solution for an assignment (Tutor only)
exports.gradeAssignmentSolution = async (req, res) => {
    try {
        const { classId, assignmentIdx, solutionIdx } = req.params;
        const { grade, feedback } = req.body;

        // Find the class
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found." });
        }
        const aIdx = parseInt(assignmentIdx, 10);
        const sIdx = parseInt(solutionIdx, 10);

        if (
            !Array.isArray(classDoc.assignment) ||
            !classDoc.assignment[aIdx] ||
            !Array.isArray(classDoc.assignment[aIdx].solutions) ||
            !classDoc.assignment[aIdx].solutions[sIdx]
        ) {
            return res.status(404).json({ success: false, message: "Assignment or solution not found." });
        }

        // Update grade and feedback
        if (grade !== undefined) classDoc.assignment[aIdx].solutions[sIdx].grade = grade;
        if (feedback !== undefined) classDoc.assignment[aIdx].solutions[sIdx].feedback = feedback;

        await classDoc.save();

        // Optionally, return updated assignments
        return res.status(200).json({ success: true, message: "Solution graded successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to grade solution.", error: error.message });
    }
};

// Delete an assignment from a class (Tutor only)
exports.deleteAssignment = async (req, res) => {
    try {
        const { classId, assignmentIdx } = req.params;
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found." });
        }
        const idx = parseInt(assignmentIdx, 10);
        if (!Array.isArray(classDoc.assignment) || !classDoc.assignment[idx]) {
            return res.status(404).json({ success: false, message: "Assignment not found." });
        }
        classDoc.assignment.splice(idx, 1);
        await classDoc.save();
        return res.status(200).json({ success: true, message: "Assignment deleted successfully.", assignments: classDoc.assignment });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to delete assignment.", error: error.message });
    }
};