const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

// ✅ 1. Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  logger: console,
});

console.log("🟢 AWS SDK configured");
console.log("🧠 AWS Region:", process.env.AWS_REGION);

// ✅ 2. Create S3 instance
const s3 = new AWS.S3();

// ✅ 3. Configure multer with multer-s3
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory for direct S3 upload
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"), false);
    }
  },
});

console.log("🚀 Multer-S3 upload middleware initialized with bucket:", process.env.AWS_S3_BUCKET_NAME);

module.exports = upload;
