const express = require("express");
const router = express.Router();

// Test route
router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Test route is working!",
    });
});

module.exports = router;