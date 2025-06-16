const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const { auth, isStudent, isTutor, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

// Route to send a class request (Student only)
router.post("/send-request/:courseId", auth, isStudent, classController.sendClassRequest);

// Route to handle tutor's decision on a class request (Tutor only)
router.post("/handle-request/:requestId", auth, isTutor, classController.handleClassRequest);

// Route to get class requests for the tutor (Tutor only)
router.get("/class-requests", auth, isTutor, classController.getClassRequestsForTutor);

// Student-only: Get Class Requests (Pending)
router.get("/student/class-requests", auth, isStudent, classController.getStudentClassRequests);

// Student-only: Get Accepted Classes (Personal & Group)
router.get("/accepted-classes", auth, classController.getAcceptedClasses);

// Admin-only: Create a Group Class
router.post("/create-group-class/:courseId", auth, isTutor, classController.createGroupClass);

// Route to get group classes for a course
router.get("/group-classes/:courseId", auth, isStudent, classController.getGroupClasses);

// Route for students to request to join a group class
router.post("/join-group-class/:classId", auth, isStudent, classController.requestToJoinGroupClass);

// Route to get available group times for a course
router.get("/available-group-times/:courseId", auth, isStudent, classController.getAvailableGroupTimes);

// Route to fetch all classes for the tutor
router.get("/tutor-classes", auth, isTutor, classController.getTutorClasses);

// Route to delete a class by ID (Tutor only)
router.delete("/:classId", auth, isTutor, classController.deleteClassById);

// Assignment endpoints for a class
router.get("/:classId/assignment", auth, classController.getAssignment);
router.post("/:classId/assignment", auth, upload.single("file"), classController.uploadAssignment);

// Student submits solution for an assignment
router.post(
  "/:classId/assignment/:assignmentIdx/submit",
  auth,
  upload.single("file"),
  classController.submitAssignmentSolution
);

// Add this route for grading a solution (Tutor only)
router.put(
  "/:classId/assignment/:assignmentIdx/solution/:solutionIdx/grade",
  auth,
  isTutor,
  classController.gradeAssignmentSolution
);

// Add this route for deleting an assignment (Tutor only)
router.delete(
  "/:classId/assignment/:assignmentIdx",
  auth,
  isTutor,
  classController.deleteAssignment
);

module.exports = router;