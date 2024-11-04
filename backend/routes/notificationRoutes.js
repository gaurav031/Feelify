import express from 'express';
import protectRoute from '../middlewares/protectRoute.js';
import { getNotifications, markAsRead } from '../controllers/NotificationController.js';

const router = express.Router();

// Route to get notifications
router.get('/', protectRoute, getNotifications);

// Route to mark a notification as read
router.put('/:id', protectRoute, markAsRead);

export default router;