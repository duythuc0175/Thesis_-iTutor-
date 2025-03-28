const cloudinary = require("./config/cloudinaryConfig");
const path = require("path");

const testUpload = async () => {
    try {
        const filePath = path.join(__dirname, "uploads", "test.pdf"); // Replace with an actual file path
        console.log("Uploading file:", filePath);

        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "raw", // Use "raw" for non-image files like PDFs
            folder: "test-uploads", // Optional: Specify a folder in Cloudinary
        });

        console.log("Upload successful:", result.secure_url);
    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error.message);
    }
};

testUpload();
