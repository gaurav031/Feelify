import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { createStory, deleteStory, getAllStory, getStoryViews, viewStory } from "../controllers/storyController.js";
import multer from "multer";
import { searchUser } from "../controllers/userController.js";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post('/create', protectRoute, upload.single('media'), createStory);
router.get('/getall', protectRoute, getAllStory);
router.get("/search", searchUser);
// Route to delete a story
router.delete('/:storyId', protectRoute, deleteStory);

// Route to mark a story as viewed
router.post('/:storyId/view', protectRoute, viewStory);
router.get('/:storyId/getviews',protectRoute, getStoryViews);

export default router;
