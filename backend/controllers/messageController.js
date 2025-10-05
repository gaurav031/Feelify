import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";

// Send a new message
async function sendMessage(req, res) {
  try {
    const { recipientId, message } = req.body;
    let { img } = req.body;
    const senderId = req.user._id;

    // Find or create a conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        lastMessage: {
          text: message,
          sender: senderId,
        },
        lastMessageAt: new Date(),
      });
      await conversation.save();
    }

    // Upload image to Cloudinary if provided
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    // Create a new message
    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      text: message,
      img: img || "",
    });

    await newMessage.save();

    // Update conversation's last message
    conversation.lastMessage = {
      text: message,
      sender: senderId,
    };
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit the new message to the recipient
    const recipientSocketId = getRecipientSocketId(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "An error occurred while sending the message." });
  }
}

// Get messages for a conversation
async function getMessages(req, res) {
  const { otherUserId } = req.params;
  const userId = req.user._id;
  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "An error occurred while retrieving messages." });
  }
}

// Get all conversations for the current user
async function getConversations(req, res) {
  const userId = req.user._id;
  try {
    const conversations = await Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .populate({
        path: "participants",
        select: "username profilePic",
      });

    // Remove the current user from the participants array
    conversations.forEach((conversation) => {
      conversation.participants = conversation.participants.filter(
        (participant) => participant._id.toString() !== userId.toString()
      );
    });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({ error: "An error occurred while retrieving conversations." });
  }
}

export { sendMessage, getMessages, getConversations };