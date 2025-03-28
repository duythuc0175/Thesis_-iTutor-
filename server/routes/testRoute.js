const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinaryConfig");
const path = require("path");

router.get("/test-upload", async (req, res) => {
    try {
        const testFilePath = path.join(__dirname, "../test-files/sample.pdf"); // Replace with a valid test file path
        const result = await cloudinary.uploader.upload(testFilePath, {
            resource_type: "raw",
            folder: "pdfs", // Specify the folder
        });
        console.log("Cloudinary Upload Result:", result);
        res.status(200).json({ success: true, message: "Test upload successful", data: result });
    } catch (error) {
        console.error("Cloudinary Test Upload Error:", error.message);
        res.status(500).json({ success: false, message: "Test upload failed", error: error.message });
    }
});

module.exports = router;
