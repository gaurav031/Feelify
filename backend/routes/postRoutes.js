import express from "express";
import multer from "multer";
import protectRoute from "../middlewares/protectRoute.js";
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

// ✅ Use memoryStorage for Vercel (read-only FS)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const router = express.Router();

// Routes
router.get("/feed", protectRoute, getFeedPosts);
router.get("/:id", getPost);
router.get("/user/:username", getUserPosts);
router.post(
  "/create",
  protectRoute,
  upload.fields([
    { name: "img", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  createPost
);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
router.get("/search", protectRoute, searchPosts);
router.post("/repost", protectRoute, repostPost);

export default router;
