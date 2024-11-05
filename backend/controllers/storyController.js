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
    const userId= req.user._id;
    const { mediaType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File is required to create a story" });
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
    });

    await newStory.save();
    return res.status(201).json(newStory);
  } catch (error) {
    console.error('Error creating story:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all stories
const getAllStory = async (req, res) => {
  try {
    const stories = await Story.find()
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    return res.status(200).json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export { createStory, getAllStory };
