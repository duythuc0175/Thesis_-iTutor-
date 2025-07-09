// This is a new API route for admin dashboard statistics
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');

// GET /dashboard/admin
router.get('/admin', async (req, res) => {
  try {
    // Count students (accountType: 'Student')
    const students = await User.countDocuments({ accountType: 'Student' });
    // Count tutors (accountType: 'Tutor')
    const tutors = await User.countDocuments({ accountType: 'Tutor' });
    // Count courses
    const courses = await Course.countDocuments();
    res.json({ students, tutors, courses });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
