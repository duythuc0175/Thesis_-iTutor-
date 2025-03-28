const multer = require("multer");
const path = require("path");

// Set up storage engine and file filtering for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("Saving file to uploads folder...");
        cb(null, "uploads/");  // Save files to the uploads folder
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname);
        console.log("Generated filename:", uniqueName);
        cb(null, uniqueName);  // Unique filename based on current timestamp
    },
});

const fileFilter = (req, file, cb) => {
    console.log("File mimetype:", file.mimetype);
    if (file.mimetype === "application/pdf") {
        cb(null, true);  // Allow PDF files
    } else {
        cb(new Error("Only PDF files are allowed"), false);  // Reject non-PDF files
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;