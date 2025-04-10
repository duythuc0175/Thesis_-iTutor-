const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const formidable = require("express-formidable");
const { signup, login } = require("../controllers/authController");

// Signup route
router.post("/signup", formidable(), signup);

// Login route
router.post("/login", login);

module.exports = router;
