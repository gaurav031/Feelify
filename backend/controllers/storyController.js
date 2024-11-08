import multer from "multer";
import Story from "../models/storyModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

// Multer setup for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('media');

// Create a story
const createStory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mediaType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File is required to create a story" });
    }

    // Validate media type
    if (mediaType !== 'image' && mediaType !== 'video') {
      return res.status(400).json({ error: "Invalid media type" });
    }

    // Upload media to Cloudinary from memory
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: mediaType === 'video' ? 'video' : 'image' },
        (error, result) => {
          if (error) reject(new Error("Cloudinary upload failed"));
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const mediaUrl = uploadResult.secure_url;

    // Create a new story
    const newStory = new Story({
      user: userId,
      mediaUrl,
      mediaType,
      viewedBy: [],  // Initially empty, will be populated when someone views the story
      viewCount: 0,  // Initialize view count
    });

    await newStory.save();
    return res.status(201).json(newStory);
  } catch (error) {
    console.error('Error creating story:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all stories from followed users
const getAllStory = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming req.user is available through authentication middleware

    // Fetch the current user to get the list of followed users
    const currentUser = await User.findById(userId).select('following');
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the list of followed user IDs and add the current user ID to include their own stories
    const followedUserIds = [...currentUser.following, userId];

    // Fetch stories from the followed users and the current user
    const stories = await Story.find({
      user: { $in: followedUserIds },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },  // Last 24 hours
    })
      .populate('user', 'username profilePic')  // Populate user data
      .sort({ createdAt: -1 });

    return res.status(200).json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a story
const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    // Find the story to delete
    const story = await Story.findOne({ _id: storyId, user: userId });
    if (!story) {
      return res.status(404).json({ error: 'Story not found or you are not authorized to delete this story' });
    }

    // Delete media from Cloudinary (if it exists)
    const publicId = story.mediaUrl.split("/").pop().split(".")[0];  // Assuming the URL contains the public ID
    await cloudinary.uploader.destroy(publicId);

    // Delete the story from the database
    await Story.deleteOne({ _id: storyId });

    return res.status(200).json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// View a story
const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id; // Assumes req.user._id is populated by middleware

    // Find the story
    const story = await Story.findById(storyId).populate('viewedBy', 'username profilePic');
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Check if the user has already viewed the story
    const hasViewed = story.viewedBy.some(viewer => viewer._id.toString() === userId.toString());
    
    if (!hasViewed) {
      // Add userId to the viewedBy array and increment the viewCount only once
      story.viewedBy.push({ _id: userId });
      story.viewCount += 1;
      await story.save();
    }

    // Return updated viewers list and view count
    return res.status(200).json({
      message: 'Story marked as viewed',
      viewers: story.viewedBy,
      viewCount: story.viewCount
    });
  } catch (error) {
    console.error('Error viewing story:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get views for a story
const getStoryViews = async (req, res) => {
  try {
    const { storyId } = req.params; // Get the storyId from the request parameters
    const userId = req.user._id; // Get the logged-in user ID from the request

    // Find the story by ID and populate the 'viewedBy' field with user details
    const story = await Story.findById(storyId).populate('viewedBy', 'username name profilePic');

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Return the list of users who have viewed the story
    return res.status(200).json({ viewers: story.viewedBy });
  } catch (error) {
    console.error('Error fetching story views:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export { createStory, getAllStory, deleteStory, viewStory, getStoryViews };
