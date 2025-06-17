const express = require('express');
const router = express.Router();
const { assignTutorToCourse, getTutorById, getTotalEnrolledStudents, getAllTutors, countTutors } = require('../controllers/tutorController');
const { auth, isTutor } = require('../middlewares/authMiddleware');

// Route to assign tutor to a course
router.post('/assign/:courseId', auth, isTutor, assignTutorToCourse);

// Route to get tutor details by ID
router.get('/:tutorId', getTutorById);

// Route to get total enrolled students for a tutor
router.get('/:tutorId/enrolled-students', auth, isTutor, getTotalEnrolledStudents);

// Get all tutors (for admin)
router.get('/alltutors/getall', getAllTutors);

// Add tutor count route
router.get('/count', countTutors);

module.exports = router;
