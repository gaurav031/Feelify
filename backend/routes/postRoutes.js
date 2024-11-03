// postRoutes.js
import express from "express";
import {
	createPost,
	deletePost,
	getPost,
	likeUnlikePost,
	replyToPost,
	getFeedPosts,
	getUserPosts,
	searchPosts, // Import the new search function
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";

import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.get("/:id", getPost);
router.get("/user/:username", getUserPosts);
router.post("/create",upload.fields([{ name: 'img', maxCount: 1 }, { name: 'video', maxCount: 1 }]), protectRoute, createPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
router.get("/search", protectRoute, searchPosts); // Add this line for search

export default router;
