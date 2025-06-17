const Notification = require("../models/Notification");

// Function to fetch notifications for a user
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // Get the logged-in user's ID

        // Fetch notifications for the user
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 }) // Sort by creation date in descending order
            .limit(20); // You can limit the number of notifications per request if needed

        // Always return 200 with an array, even if empty
        return res.status(200).json({
            message: "Notifications retrieved successfully.",
            notifications,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while fetching notifications." });
    }
};

// Optionally, function to mark notifications as read
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        // Find the notification and mark it as read
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ error: "Notification not found." });
        }

        // Update the status to 'read'
        notification.status = "read"; // Update the status field to 'read'
        await notification.save();

        return res.status(200).json({ message: "Notification marked as read." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while marking the notification." });
    }
};

// Delete a notification by ID
exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.notificationId;
        const userId = req.user.id;
        const notification = await Notification.findOneAndDelete({ _id: notificationId, user: userId });
        if (!notification) {
            return res.status(404).json({ error: "Notification not found or not authorized." });
        }
        return res.status(200).json({ message: "Notification deleted successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while deleting the notification." });
    }
};
