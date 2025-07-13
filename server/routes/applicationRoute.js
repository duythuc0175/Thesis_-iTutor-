const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { isAdmin, auth } = require("../middlewares/authMiddleware");

// Get all pending tutor applications
router.get("/pending-tutors", auth, isAdmin, async (req, res) => {
  try {
    const pendingTutors = await User.find({ accountType: "Tutor", status: "pending" });
    res.status(200).json({ success: true, data: pendingTutors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch pending tutors", error: error.message });
  }
});

// Approve a tutor application
router.put("/approve-tutor/:tutorId", auth, isAdmin, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const tutor = await User.findByIdAndUpdate(
      tutorId,
      { active: true, approved: true, status: "active" },
      { new: true }
    );
    if (!tutor) {
      return res.status(404).json({ success: false, message: "Tutor not found" });
    }
    res.status(200).json({ success: true, message: "Tutor approved", data: tutor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to approve tutor", error: error.message });
  }
});

// Reject a tutor application (delete from database)
// NOTE: Use DELETE method in frontend, not PUT
router.delete("/reject-tutor/:tutorId", auth, isAdmin, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const tutor = await User.findByIdAndDelete(tutorId);
    if (!tutor) {
      return res.status(404).json({ success: false, message: "Tutor not found" });
    }
    res.status(200).json({ success: true, message: "Tutor rejected and deleted", data: tutor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reject and delete tutor", error: error.message });
  }
});

module.exports = router;
