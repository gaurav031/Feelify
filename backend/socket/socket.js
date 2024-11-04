import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Adjust this as necessary
        methods: ["GET", "POST"],
    },
});

const userSocketMap = {}; // Mapping of userId to socketId

// Helper function to get a recipient's socket ID
export const getRecipientSocketId = (recipientId) => userSocketMap[recipientId];

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    const userId = socket.handshake.query.userId;

    // Add the connected user to userSocketMap
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
        io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Broadcast online users
    }

    // Mark messages as seen
    socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
        try {
            await Message.updateMany({ conversationId, seen: false }, { $set: { seen: true } });
            await Conversation.updateOne({ _id: conversationId }, { $set: { "lastMessage.seen": true } });
            io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
        } catch (error) {
            console.log("Error marking messages as seen:", error);
        }
    });

    // Handle like event
    socket.on("likeComment", async ({ commentId, postId, userId }) => {
        try {
            const post = await Post.findById(postId).populate("postedBy");
            if (post && post.postedBy) {
                const recipientId = post.postedBy._id.toString();
                const recipientSocketId = userSocketMap[recipientId];

                // Notify the post's author about the like if they are online
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("postLiked", {
                        postId,
                        userId,
                    });
                }
            }
        } catch (error) {
            console.error("Error processing like:", error);
        }
    });

    // Handle comment event
    socket.on("addComment", async ({ postId, userId, commentText }) => {
        try {
            const post = await Post.findById(postId).populate("postedBy");
            if (post && post.postedBy) {
                const recipientId = post.postedBy._id.toString();
                const recipientSocketId = userSocketMap[recipientId];

                // Notify the post's author about the new comment if they are online
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("commentAdded", {
                        postId,
                        userId,
                        commentText,
                    });
                }
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    });

    // Handle follow event
    socket.on("followUser", async ({ userId, followerId }) => {
        try {
            const followedUser = await User.findById(userId);
            if (followedUser) {
                const recipientSocketId = userSocketMap[userId];

                // Notify the user about the new follower if they are online
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("userFollowed", {
                        userId,
                        followerId,
                    });
                }
            }
        } catch (error) {
            console.error("Error following user:", error);
        }
    });

    // Handle socket disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Remove the socket ID from userSocketMap
        for (const [id, socketId] of Object.entries(userSocketMap)) {
            if (socketId === socket.id) {
                delete userSocketMap[id];
                break;
            }
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Update online users
    });
});

export { io, server, app };
