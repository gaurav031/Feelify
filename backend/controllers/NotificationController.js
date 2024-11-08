import Notification from "../models/notificationModel.js";

// Fetch notifications for a user
export const getNotifications = async (req, res) => {
    try {
        // Check if req.user exists (user is authenticated)
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        // Fetch notifications for the authenticated user
        const notifications = await Notification.find({ userId: req.user._id })
            .populate('senderId', 'profilePic username') // Populate sender's info
            .populate('postId', 'title imageUrl User') // Populate post's info (make sure fields exist in Post model)
            .sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ error: "An error occurred while fetching notifications." });
    }
};

// Mark a notification as read
export const markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if req.user exists (user is authenticated)
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        res.status(200).json(notification);
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ error: "An error occurred while updating the notification." });
    }
};
