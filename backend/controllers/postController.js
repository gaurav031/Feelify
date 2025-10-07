import Notification from "../models/notificationModel.js";
import Post from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/userModel.js";

const createPost = async (req, res) => {
    try {
        const { postedBy, text } = req.body;
        let img, video;

        // if (!postedBy || !text) {
        //     return res.status(400).json({ error: "Postedby and text fields are required" });
        // }

        const user = await User.findById(postedBy);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized to create post" });
        }

        const maxLength = 500;
        if (text && text.length > maxLength) {
            return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
        }

        // FIXED: Handle image upload from memory buffer
        if (req.files && req.files.img) {
            const uploadedResponse = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: "image" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(req.files.img[0].buffer);
            });
            img = uploadedResponse.secure_url;
        }

        // FIXED: Handle video upload from memory buffer
        if (req.files && req.files.video) {
            const uploadedResponse = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: "video" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(req.files.video[0].buffer);
            });
            video = uploadedResponse.secure_url;
        }

        const newPost = new Post({ postedBy, text, img, video });
        await newPost.save();
        
        // Populate the user data before sending response
        await newPost.populate('postedBy', 'username name profilePic');
        
        res.status(201).json(newPost);
    } catch (err) {
        console.error("Error in createPost:", err);
        res.status(500).json({ error: "An error occurred while creating post" });
    }
};

const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('postedBy', 'username name profilePic')
            .populate('replies.userId', 'username name profilePic');

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json(post);
    } catch (err) {
        console.error("Error fetching post:", err);
        res.status(500).json({ error: "An error occurred while fetching post" });
    }
}; 

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.postedBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized to delete post" });
        }

        // Delete image from Cloudinary if exists
        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        // Delete video from Cloudinary if exists
        if (post.video) {
            const videoId = post.video.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(videoId, { resource_type: "video" });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error("Error in deletePost:", err);
        res.status(500).json({ error: "An error occurred while deleting post" });
    }
};

const likeUnlikePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId).populate('postedBy');
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // Unlike the post
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
            await post.save();

            res.status(200).json({ message: "Post unliked successfully" });
        } else {
            // Like the post
            post.likes.push(userId);
            await post.save();

            // Notify the post owner if the liker is not the owner
            if (post.postedBy && !post.postedBy._id.equals(userId)) {
                const newNotification = new Notification({
                    userId: post.postedBy._id,
                    senderId: userId,
                    username: req.user.username,
                    type: 'like',
                    postId: post._id,
                    message: `${req.user.name} liked your post.`,
                });

                if (req.io) {
                    await Promise.all([
                        newNotification.save(),
                        req.io.to(post.postedBy._id.toString()).emit("newNotification", {
                            postId: post._id,
                            userId,
                            username: req.user.username,
                            message: `${req.user.name} liked your post.`,
                        })
                    ]);
                } else {
                    await newNotification.save();
                }
            }

            res.status(200).json({ message: "Post liked successfully" });
        }
    } catch (err) {
        console.error("Error in likeUnlikePost:", err);
        
        if (err.name === 'ValidationError') {
            res.status(400).json({ error: "Invalid data provided" });
        } else if (err.name === 'CastError') {
            res.status(400).json({ error: "Invalid post ID format" });
        } else {
            res.status(500).json({ error: "An error occurred while liking/unliking the post" });
        }
    }
};

const replyToPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: "Text field is required and cannot be empty." });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found." });
        }

        const { profilePic: userProfilePic, username } = req.user;

        const reply = { 
            userId, 
            text, 
            userProfilePic, 
            username 
        };
        
        post.replies.push(reply);
        await post.save();

        // Populate the reply user data
        const populatedPost = await Post.findById(postId)
            .populate('replies.userId', 'username name profilePic');

        // Get the last reply (the one we just added)
        const newReply = populatedPost.replies[populatedPost.replies.length - 1];

        // Notify the post owner if the reply is from a different user
        if (post.postedBy.toString() !== userId.toString()) {
            const newNotification = new Notification({
                userId: post.postedBy,
                senderId: userId,
                type: 'comment',
                postId: post._id,
                message: `${req.user.name} replied to your post.`,
            });

            if (req.io) {
                await Promise.all([
                    newNotification.save(),
                    req.io.to(post.postedBy.toString()).emit("newNotification", {
                        postId: post._id,
                        userId,
                        message: `${req.user.name} replied to your post.`,
                    }),
                ]);
            } else {
                await newNotification.save();
            }
        }

        return res.status(200).json(newReply);
    } catch (err) {
        console.error("Error in replyToPost:", err);
        res.status(500).json({ error: "Unable to process request." });
    }
};

const getFeedPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const following = user.following;

        const feedPosts = await Post.find({
            $or: [
                { postedBy: { $in: following } },
                { postedBy: userId } // Include user's own posts
            ]
        })
        .populate('postedBy', 'username name profilePic')
        .populate('replies.userId', 'username name profilePic')
        .sort({ createdAt: -1 });

        res.status(200).json(feedPosts);
    } catch (err) {
        console.error("Error fetching feed posts:", err);
        res.status(500).json({ error: "An error occurred while fetching feed posts" });
    }
};

const getUserPosts = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const posts = await Post.find({ postedBy: user._id })
            .populate('postedBy', 'username name profilePic')
            .populate('replies.userId', 'username name profilePic')
            .sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error in getUserPosts:", error);
        res.status(500).json({ error: "An error occurred while fetching user posts" });
    }
};

const searchPosts = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim() === '') {
            return res.status(400).json({ error: "Query is required" });
        }

        const posts = await Post.find({
            text: { $regex: query, $options: "i" },
        })
        .populate('postedBy', 'username name profilePic')
        .sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (err) {
        console.error("Error in searchPosts:", err);
        res.status(500).json({ error: "An error occurred while searching posts" });
    }
};

const repostPost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user._id;

        if (!postId) {
            return res.status(400).json({ error: "Post ID is required" });
        }

        const originalPost = await Post.findById(postId);
        if (!originalPost) {
            return res.status(404).json({ error: "Original post not found" });
        }

        const newRepost = new Post({
            postedBy: userId,
            text: originalPost.text,
            img: originalPost.img,
            video: originalPost.video,
            repostOf: originalPost._id,
        });

        await newRepost.save();

        const populatedPost = await Post.findById(newRepost._id)
            .populate("postedBy", "username name profilePic");
            
        res.status(201).json(populatedPost);
    } catch (err) {
        console.error("Error in repostPost:", err);
        res.status(500).json({ error: "An error occurred while reposting" });
    }
};

export { 
    repostPost, 
    createPost, 
    getPost, 
    deletePost, 
    likeUnlikePost, 
    replyToPost, 
    getFeedPosts, 
    getUserPosts, 
    searchPosts 
};