import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { createStory, getAllStory } from "../controllers/storyController.js";
import multer from "multer";
import { searchUser } from "../controllers/userController.js";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post('/create', protectRoute, upload.single('media'), createStory);
router.get('/getall', protectRoute, getAllStory);
router.get("/search", searchUser);

export default router;
