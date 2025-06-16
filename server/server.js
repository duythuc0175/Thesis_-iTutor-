const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const AWS = require("aws-sdk");

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require("./routes/authRoute");
const courseRoutes = require("./routes/courseRoute");
const sectionRoutes = require("./routes/sectionRoute");
const enrollmentRoutes = require("./routes/enrollmentRoute");
const tutorRoutes = require("./routes/tutorRoute");
const profileRoutes = require("./routes/profileRoute");
const messageRoutes = require("./routes/messageRoute");
const ratingRoutes = require("./routes/ratingRoute");
const classRoutes = require("./routes/classRoute"); // Make sure this is the correct file name
const notificationRoute = require("./routes/notificationRoute");
const meetRoutes = require("./routes/meetRoutes");
const reportRoute = require("./routes/reportRoute");

// Import database configuration
const database = require("./config/db");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Connect to the database
database.connect();

// Middleware setup
app.use(express.json()); // Use for JSON payloads
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));

// Static file serving (for local uploads if any)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route Definitions
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/sections", sectionRoutes); // ⬅️ multer sẽ hoạt động bình thường tại đây
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/enrollment", enrollmentRoutes);
app.use("/api/v1/tutor", tutorRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/rating", ratingRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/notifications", notificationRoute);
app.use("/api/meet", meetRoutes);
app.use("/api/v1/report", reportRoute);

// Default route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Check S3 connection
const checkS3Connection = async () => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  try {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error("AWS_S3_BUCKET_NAME is not set in the environment variables.");
    }

    const buckets = await s3.listBuckets().promise();
    console.log("✅ Successfully connected to S3. Buckets:", buckets.Buckets);
  } catch (error) {
    console.error("❌ Error connecting to S3:", error.message);
  }
};

// Start the server
app.listen(PORT, async () => {
  console.log(`🚀 App is running at http://localhost:${PORT}`);
  await checkS3Connection();
});
