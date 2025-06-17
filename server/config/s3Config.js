const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Configure AWS S3 client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Helper function to upload files to S3
const uploadFileToS3 = async (fileBuffer, fileName, fileType = "pdf") => {
    try {
        const timestamp = Date.now();
        let key;
        if (fileType === "image") {
            key = `course-thumbnails/${timestamp}_${fileName}`;
        } else if (fileType === "assignment") {
            key = `assignment/${timestamp}_${fileName}`;
        } else if (fileType === "solution") {
            key = `solution/${timestamp}_${fileName}`;
        } else if (fileType === "cv" || fileType === "CV") {
            key = `CV/${timestamp}_${fileName}`;
        } else {
            key = `sections/${timestamp}_${fileName}`;
        }

        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: fileType === "image" ? "image/jpeg" : "application/pdf",
            ContentDisposition: fileType === "image" ? undefined : "inline",
        };

        const command = new PutObjectCommand(params);
        await s3.send(command);

        const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log("File successfully uploaded to S3. URL:", fileUrl);
        return fileUrl;
    } catch (error) {
        console.error("Error uploading file to S3:", error.message);
        throw new Error("Failed to upload file to S3.");
    }
};

module.exports = { uploadFileToS3 };
