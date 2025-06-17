const express = require("express");
const router = express.Router();
const { auth, isTutor } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const {
  getAllCourses,
  getCourseById,
  addCourse,
  updateCourseById,
  deleteCourseById,
  uploadThumbnail,
  countAllCourses,
} = require("../controllers/courseController");

// Public: Get All Courses
router.get("/", getAllCourses);

// Public: Get Course by ID
router.get("/:courseId", getCourseById);

// Admin-only: Add Course
router.post("/add", auth, isTutor, addCourse);

// Admin-only: Update Course by ID
router.put("/:courseId", auth, isTutor, updateCourseById);

// Admin-only: Delete Course by ID
router.delete("/:courseId", auth, isTutor, deleteCourseById);

// Route for uploading course thumbnails
router.post("/upload-thumbnail", auth, isTutor, upload.single("file"), uploadThumbnail);

// Add course count route
router.get("/count", countAllCourses);

module.exports = router;