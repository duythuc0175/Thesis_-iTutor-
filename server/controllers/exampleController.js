const cloudinary = require("../config/cloudinaryConfig");

const uploadFileToCloudinary = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "raw", // Use "raw" for non-image files like PDFs
            folder: "uploads",    // Optional: Specify a folder in Cloudinary
        });
        return result.secure_url; // Return the secure URL of the uploaded file
    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error.message);
        throw new Error("Failed to upload file to Cloudinary.");
    }
};

module.exports = { uploadFileToCloudinary };
