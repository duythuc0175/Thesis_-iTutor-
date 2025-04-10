const { uploadFileToS3 } = require("../config/s3Config");

const uploadCV = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    // Upload the file to S3
    const fileUrl = await uploadFileToS3(file.buffer, file.originalname, "pdf");

    res.status(200).json({ message: "File uploaded successfully", fileUrl });
  } catch (error) {
    console.error("Error uploading CV:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { uploadCV };
