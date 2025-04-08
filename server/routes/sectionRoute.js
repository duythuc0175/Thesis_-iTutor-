const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { auth, isTutor } = require("../middlewares/authMiddleware");
const {
    addSection,
    updateSectionById,
    deleteSectionById,
    getSectionsByCourseId,  
    getSectionsByTutor,
    getSectionById,
    getSelectedSections,
    getSectionPdfById,
    confirmSectionsForCourse,
    uploadFile
} = require("../controllers/sectionController");

// Add Section
router.post("/add", auth, isTutor, addSection);

// Route for uploading files to S3
router.post("/upload-file", auth, isTutor, upload.single("file"), uploadFile);
  
// Get Selected Sections by IDs
router.post("/get-selected", auth, async (req, res) => {
    try {
        const { sectionIds } = req.body;

        if (!sectionIds || !Array.isArray(sectionIds)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing sectionIds.",
            });
        }

        const sections = await getSelectedSections(sectionIds);

        res.status(200).json({
            success: true,
            message: "Selected sections fetched successfully.",
            data: sections,
        });
    } catch (error) {
        console.error("Error in /get-selected route:", error.message);
        res.status(500).json({
            success: false,
            message: "Error fetching selected sections.",
            error: error.message,
        });
    }
});

// Public: Get Sections by Course ID
router.get("/course/:courseId", getSectionsByCourseId);

// Public: Get Sections by Tutor ID
router.get("/tutor", auth, getSectionsByTutor);

// Public: Get PDF File by Section ID
router.get("/:sectionId/pdf", async (req, res) => {
    try {
        const { sectionId } = req.params;

        const section = await getSectionPdfById(req, res);

        if (section) {
            res.status(200).json(section);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching PDF file.",
            error: error.message,
        });
    }
});

// Confirm Sections for a Course
router.post("/confirm-sections", auth, isTutor, confirmSectionsForCourse);

// Update Section by ID
router.put("/:sectionId", auth, isTutor, updateSectionById);

// Delete Section by ID
router.delete("/:sectionId", auth, isTutor, deleteSectionById);

// Get a Section by ID
router.get("/:sectionId", getSectionById);

module.exports = router;