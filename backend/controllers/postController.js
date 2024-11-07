import Notification from "../models/notificationModel.js";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
    try {
        const { postedBy, text } = req.body; // Do not destructure img and video from req.body
        let img, video; // Initialize variables

        // if (!postedBy || !text) {
        //     return res.status(400).json({ error: "Postedby and text fields are required" });
        // }

        const user = await User.findById(postedBy);
        if (!user) {
            return res.status(404).json({ error: "User  not found" });
        }

        if (user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized to create post" });
        }

        const maxLength = 500;
        if (text.length > maxLength) {
            return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
        }

        // Handle image upload if present
        if (req.files && req.files.img) {
            const uploadedResponse = await cloudinary.uploader.upload(req.files.img[0].path);
            img = uploadedResponse.secure_url;
        }

        // Handle video upload if present
        if (req.files && req.files.video) {
            const uploadedResponse = await cloudinary.uploader.upload(req.files.video[0].path, {
                resource_type: "video", // Specify the resource type as video
            });
            video = uploadedResponse.secure_url;
        }

        const newPost = new Post({ postedBy, text, img, video }); // Include img and video in the post model
        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ error: "An error occurred" });
        console.log(err);
    }
};

const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json(post);
    } catch (err) {
        // Change: Removed specific error message
        res.status(500).json({ error: "An error occurred" });
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

        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        // Change: Removed specific error message
        res.status(500).json({ error: "An error occurred" });
    }
};

const likeUnlikePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user._id;

        // Attempt to find the post and check if it exists
        const post = await Post.findById(postId).populate('postedBy');
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Check if user has already liked the post
        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // Remove user's like from the post
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
            await post.save();

            res.status(200).json({ message: "Post unliked successfully" });
        } else {
            // Add user's like to the post
            post.likes.push(userId);
            await post.save();

            // Notify the post owner if the liker is not the owner
            if (post.postedBy && !post.postedBy._id.equals(userId)) {
                const newNotification = new Notification({
                    userId: post.postedBy._id,
                    senderId: userId,
                    username:`${req.user.name}.`,
                    type: 'like',
                    postId: post._id,
                    message: `${req.user.name} liked your post.`,
                });

                // Check if req.io is defined
                if (req.io) {
                    // Save notification and emit socket event in parallel
                    await Promise.all([
                        newNotification.save(),
                        req.io.to(post.postedBy._id.toString()).emit("postLiked", {
                            postId: post._id,
                            userId,
                            username:`${req.user.name}.`,
                            message: "Your post was liked!",
                        })
                    ]);
                } else {
                    await newNotification.save(); // Save notification if socket.io is not available
                }
            }

            res.status(200).json({ message: "Post liked successfully" });
        }
    } catch (err) {
        console.error("Error in likeUnlikePost:", err);

        // Check if it's a specific error and respond accordingly
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

        // Validate input
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: "Text field is required and cannot be empty." });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found." });
        }

        const { profilePic: userProfilePic, username } = req.user;

        // Create reply and push it to post replies
        const reply = { userId, text, userProfilePic, username };
        post.replies.push(reply);
        await post.save();

        // Only notify the post owner if the reply is from a different user
        if (post.postedBy._id.toString() !== userId.toString()) {
            const newNotification = new Notification({
                userId: post.postedBy._id,
                senderId: userId,
                type: 'comment',
                postId: post._id,
                message: `${req.user.name} replied to your post.`,
            });

            if (req.io) {
                await Promise.all([
                    newNotification.save(),
                    req.io.to(post.postedBy._id.toString()).emit("postReplied", {
                        postId: post._id,
                        userId,
                        message: `${req.user.name} replied to your post.`,
                    }),
                ]);
            } else {
                console.error("Socket.io instance is not available in request.");
                await newNotification.save(); // Save notification even if socket is not available
            }
        }

        return res.status(200).json(reply);
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
            return res.status(404).json({ error: "User  not found" });
        }

        const following = user.following;

        // Get all video posts (whether or not the user is following the creator)
        const videoPosts = await Post.find({
            video: { $exists: true }, 
        })
        .populate('postedBy', 'profilePic username') // Populate user data
        .sort({ createdAt: -1 });

        // Get image and text posts from the users the current user is following
        const feedPosts = await Post.find({
            postedBy: { $in: following },  // Only posts from followed users
            video: { $exists: false }       // Ensure it's not a video post
        })
        .populate('postedBy', 'profilePic username') // Populate user data
        .sort({ createdAt: -1 });

        // Combine the video posts and the followed posts
        const allPosts = [...videoPosts, ...feedPosts];

        res.status(200).json(allPosts);
    } catch (err) {
        res.status(500).json({ error: "An error occurred" });
    }
};


const getUserPosts = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (error) {
        // Change: Removed specific error message
        res.status(500).json({ error: "An error occurred" });
    }
};

const searchPosts = async (req, res) => {
    try {
        const { query } = req.query; // Get the search query from request
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        const posts = await Post.find({
            text: { $regex: query, $options: "i" }, // Search for the query in the text field (case insensitive)
        }).sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (err) {
        // Change: Removed specific error message
        res.status(500).json({ error: "An error occurred" });
    }
};



export { createPost, getPost, deletePost, likeUnlikePost, replyToPost, getFeedPosts, getUserPosts, searchPosts };
