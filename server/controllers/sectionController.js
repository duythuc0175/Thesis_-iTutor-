const Section = require("../models/Section");
const { uploadFileToS3 } = require("../config/s3Config");
const mongoose = require("mongoose");
const fs = require("fs"); // Import file system module

// Helper function to validate PDF file
const isValidPdf = (filePath) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        return fileBuffer.toString("utf8", 0, 4) === "%PDF"; // Check if the file starts with "%PDF"
    } catch (error) {
        console.error("Error validating PDF file:", error.message);
        return false;
    }
};

// Upload a file to S3
exports.uploadFile = async (req, res) => {
    try {
        const file = req.file; // File uploaded via multer
        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded." });
        }

        const fileType = file.mimetype === "application/pdf" ? "pdf" : "docx";
        const fileUrl = await uploadFileToS3(file.buffer, file.originalname, fileType);

        return res.status(200).json({ success: true, fileUrl });
    } catch (error) {
        console.error("Error uploading file:", error.message);
        return res.status(500).json({ success: false, message: "Failed to upload file.", error: error.message });
    }
};

// Add a New Section (Only Tutor)
exports.addSection = async (req, res) => {
    try {
        if (req.user.accountType !== "Tutor") {
            return res.status(401).json({
                success: false,
                message: "Only Tutors can add sections.",
            });
        }

        const { sectionName, courseIds, fileUrl } = req.body;

        console.log("Received request body:", req.body); // Log the request body for debugging

        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: "File URL is required.",
            });
        }

        const existingSection = await Section.findOne({ sectionName, tutorId: req.user._id });
        if (existingSection) {
            return res.status(400).json({
                success: false,
                message: "A section with this name already exists for this tutor.",
            });
        }

        const newSection = await Section.create({
            sectionName,
            pdfFile: fileUrl,
            tutorId: req.user._id,
            courseIds: courseIds || [],
        });

        return res.status(201).json({
            success: true,
            message: "Section created successfully.",
            data: newSection,
        });
    } catch (error) {
        console.error("Error in addSection:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error occurred while creating the section.",
            error: error.message,
        });
    }
};

// Get Sections by Course ID
exports.getSectionsByCourseId = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Validate the courseId format
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID format.",
            });
        }

        // Fetch sections associated with the course
        const sections = await Section.find({ courseIds: courseId })
            .select("sectionName pdfFile") // Include only sectionName and pdfFile
            .populate("tutorId", "firstName lastName email");

        if (!sections || sections.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No sections found for this course.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Sections fetched successfully.",
            data: sections,
        });
    } catch (error) {
        console.error("Error fetching sections by course ID:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while fetching sections by course ID.",
            error: error.message,
        });
    }
};

// Get Sections by Tutor ID
exports.getSectionsByTutor = async (req, res) => {
    try {
        const tutorId = req.user._id;  // Get the tutorId from the authenticated user

        // Fetch sections where the tutorId matches the signed-in tutor
        const sections = await Section.find({ tutorId })
            .populate("tutorId", "name email")
            .populate("courseIds", "courseName");

        if (sections.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No sections found for this tutor.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Sections fetched successfully.",
            data: sections,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error occurred while fetching sections for the tutor.",
            error: error.message,
        });
    }
};

// Update a Section by ID (Only Tutor who owns the section)
exports.updateSectionById = async (req, res) => {
    try {
        // Verify that the user is a Tutor
        if (req.user.accountType !== "Tutor") {
            return res.status(401).json({
                success: false,
                message: "Only Tutors can update sections.",
            });
        }

        const { sectionId } = req.params;
        const updatedData = req.body;

        // Find the section and ensure the tutor owns it
        const section = await Section.findOne({ _id: sectionId, tutorId: req.user._id });

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found or you do not have permission to update it.",
            });
        }

        // Update the section
        const updatedSection = await Section.findByIdAndUpdate(sectionId, updatedData, { new: true });

        return res.status(200).json({
            success: true,
            message: "Section updated successfully.",
            data: updatedSection,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating the section.",
            error: error.message,
        });
    }
};

// Delete a Section by ID (Only Tutor who owns the section)
exports.deleteSectionById = async (req, res) => {
    try {
        // Verify that the user is a Tutor
        if (req.user.accountType !== "Tutor") {
            return res.status(401).json({
                success: false,
                message: "Only Tutors can delete sections.",
            });
        }

        const { sectionId } = req.params;

        // Find the section and ensure the tutor owns it
        const section = await Section.findOne({ _id: sectionId, tutorId: req.user._id });

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found or you do not have permission to delete it.",
            });
        }

        // Delete the section
        await Section.findByIdAndDelete(sectionId);

        return res.status(200).json({
            success: true,
            message: "Section deleted successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error occurred while deleting the section.",
            error: error.message,
        });
    }
};

// Get a Section by ID
exports.getSectionById = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // Find the section by ID
        const section = await Section.findById(sectionId)
            .populate("tutorId", "name email") // Populate tutor details
            .populate("courseIds", "courseName"); // Populate associated course details

        // If section not found
        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found.",
            });
        }

        // Return the section details
        return res.status(200).json({
            success: true,
            message: "Section fetched successfully.",
            data: section,
        });
    } catch (error) {
        // Handle errors
        return res.status(500).json({
            success: false,
            message: "Error occurred while fetching the section.",
            error: error.message,
        });
    }
};

// Get PDF File by Section ID
exports.getSectionPdfById = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // Validate the sectionId format
        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid section ID format.",
            });
        }

        const section = await Section.findById(sectionId).select("pdfFile sectionName");

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found.",
            });
        }

        // Return the direct URL for viewing the PDF
        return res.status(200).json({
            success: true,
            message: "PDF file fetched successfully.",
            data: {
                sectionName: section.sectionName,
                pdfFile: section.pdfFile, // Direct URL to the PDF file
            },
        });
    } catch (error) {
        console.error("Error fetching PDF file by section ID:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while fetching the PDF file.",
            error: error.message,
        });
    }
};

// Upload a Section
exports.uploadSection = async ({ sectionName, pdfFile, courseIds, tutorId }) => {
    try {
        if (!sectionName || !pdfFile) {
            throw new Error("Section name and PDF file are required.");
        }

        const existingSection = await Section.findOne({ sectionName, tutorId });
        if (existingSection) {
            throw new Error("A section with this name already exists for this tutor.");
        }

        const newSection = await Section.create({
            sectionName,
            pdfFile,
            tutorId,
            courseIds: courseIds || [],
        });

        return newSection;
    } catch (error) {
        console.error("Error in uploadSection:", error.message);
        throw error;
    }
};

// Get Selected Sections
exports.getSelectedSections = async (sectionIds) => {
    try {
        // Validate sectionIds
        const validIds = sectionIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

        if (validIds.length === 0) {
            throw new Error("No valid section IDs provided.");
        }

        // Fetch sections by IDs
        const sections = await Section.find({ _id: { $in: validIds } })
            .populate("tutorId", "name email") // Populate tutor details
            .populate("courseIds", "courseName"); // Populate associated course details

        return sections;
    } catch (error) {
        console.error("Error in getSelectedSections:", error.message);
        throw error;
    }
};

// Confirm Sections for Course
exports.confirmSectionsForCourse = async (req, res) => {
    try {
        const { courseId, sectionIds } = req.body;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID format.",
            });
        }

        if (!sectionIds || !Array.isArray(sectionIds)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing section IDs.",
            });
        }

        // Update the sections to associate them with the course
        await Section.updateMany(
            { _id: { $in: sectionIds } },
            { $addToSet: { courseIds: courseId } }
        );

        return res.status(200).json({
            success: true,
            message: "Sections successfully associated with the course.",
        });
    } catch (error) {
        console.error("Error confirming sections for course:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error occurred while confirming sections for the course.",
            error: error.message,
        });
    }
};