const express = require('express');
const router = express.Router();
const { assignTutorToCourse, getTutorById, getTotalEnrolledStudents, getAllTutors, countTutors } = require('../controllers/tutorController');
const { auth, isTutor, isAdmin } = require('../middlewares/authMiddleware');

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

// Admin-only: Delete Tutor by ID
router.delete('/delete/:tutorId', auth, isAdmin, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const deletedTutor = await require('../models/User').findByIdAndDelete(tutorId);
    if (!deletedTutor) {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }
    res.status(200).json({ success: true, message: 'Tutor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete tutor', error: error.message });
  }
});

module.exports = router;
