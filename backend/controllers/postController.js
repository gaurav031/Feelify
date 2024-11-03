import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
    try {
        const { postedBy, text } = req.body; // Do not destructure img and video from req.body
        let img, video; // Initialize variables

        if (!postedBy || !text) {
            return res.status(400).json({ error: "Postedby and text fields are required" });
        }

        const user = await User.findById(postedBy);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
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
        // Change: Removed specific error message
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

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // Unlike post
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            res.status(200).json({ message: "Post unliked successfully" });
        } else {
            // Like post
            post.likes.push(userId);
            await post.save();
            res.status(200).json({ message: "Post liked successfully" });
        }
    } catch (err) {
        // Change: Removed specific error message
        res.status(500).json({ error: "An error occurred" });
    }
};

const replyToPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;
        const userProfilePic = req.user.profilePic;
        const username = req.user.username;

        if (!text) {
            return res.status(400).json({ error: "Text field is required" });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const reply = { userId, text, userProfilePic, username };

        post.replies.push(reply);
        await post.save();

        res.status(200).json(reply);
    } catch (err) {
        // Change: Removed specific error message
        res.status(500).json({ error: "An error occurred" });
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

        const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({ createdAt: -1 });

        res.status(200).json(feedPosts);
    } catch (err) {
        // Change: Removed specific error message
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
