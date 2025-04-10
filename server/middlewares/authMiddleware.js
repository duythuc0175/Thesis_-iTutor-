const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { google } = require("googleapis");
require("dotenv").config();

// Authentication Middleware
exports.auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: "User not found." });
        }

        req.user = user; // Attach user to request
        next();
    } catch (error) {
        console.error("Error in auth middleware:", error.message);
        return res.status(401).json({ success: false, message: "Unauthorized." });
    }
};

// Student Role Middleware
exports.isStudent = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Student") {
            return res.status(403).json({
                success: false,
                message: "This route is only for students.",
            });
        }
        next();
    } catch (error) {
        console.error("Error in isStudent middleware:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error verifying user role.",
        });
    }
};

// Tutor Role Middleware
exports.isTutor = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Tutor") {
            return res.status(403).json({
                success: false,
                message: "This route is only for tutors.",
            });
        }
        next();
    } catch (error) {
        console.error("Error in isTutor middleware:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error verifying user role.",
        });
    }
};

// Admin Role Middleware
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "This route is only for admins.",
            });
        }
        next();
    } catch (error) {
        console.error("Error in isAdmin middleware:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error verifying user role.",
        });
    }
};

// google meet Middleware
exports.authenticateGoogle = async (req, res, next) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    req.authClient = oauth2Client;
    next();
  } catch (error) {
    res.status(500).json({ error: "Authentication failed" });
  }
};