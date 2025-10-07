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
	searchPosts,
	repostPost,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
import multer from 'multer';

// FIX: Use memory storage for Vercel (read-only file system)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.get("/:id", getPost);
router.get("/user/:username", getUserPosts);
router.post("/create", upload.fields([{ name: 'img', maxCount: 1 }, { name: 'video', maxCount: 1 }]), protectRoute, createPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
router.get("/search", protectRoute, searchPosts);
router.post("/repost", protectRoute, repostPost);

export default router;