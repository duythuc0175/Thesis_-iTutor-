const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Configure Cloudinary using CLOUDINARY_URL
cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL, // Use the CLOUDINARY_URL environment variable
});

module.exports = cloudinary;
