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
    confirmSectionsForCourse
} = require("../controllers/sectionController");

// Add Section
router.post("/add", auth, isTutor, addSection);

// Upload PDF file
router.post("/upload-file", auth, isTutor, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        // Check file type
        const allowedTypes = ["application/pdf"];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file type. Only PDF files are allowed.",
            });
        }

        // Upload the file to Cloudinary
        const fileUrl = await uploadFileToCloudinary(req.file.path);

        res.status(200).json({
            success: true,
            message: "File uploaded successfully.",
            fileUrl,
        });
    } catch (error) {
        console.error("Error uploading file:", error.message);
        res.status(500).json({
            success: false,
            message: "Error uploading file.",
            error: error.message,
        });
    }
});

// Upload Section with PDF file
router.post("/upload", auth, isTutor, upload.single("file"), async (req, res) => {
    try {
        // Log the incoming request body and file
        console.log("Request Body:", req.body);
        console.log("Uploaded File:", req.file);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        const { sectionName, courseIds } = req.body;

        if (!sectionName) {
            return res.status(400).json({
                success: false,
                message: "Section name is required.",
            });
        }

        // Upload the file to Cloudinary
        const pdfFile = await uploadFileToCloudinary(req.file.path);

        const result = await addSection({
            sectionName,
            pdfFile,
            courseIds,
            tutorId: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: "Section uploaded successfully.",
            data: result,
        });
    } catch (error) {
        console.error("Error in /upload route:", error.message);
        res.status(500).json({
            success: false,
            message: "Error uploading section.",
            error: error.message,
        });
    }
});

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

router.get("/:sectionId", getSectionById); 

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

module.exports = router;