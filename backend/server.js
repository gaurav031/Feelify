import cron from "cron";
import http from "http"; // Use the http module for http requests
import path from "path";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import { createServer } from "http"; // Import the createServer function
import { Server } from "socket.io"; // Import the Server class from socket.io

dotenv.config();
const app = express(); // Create an instance of express
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// Connect to the database
connectDB().then(() => {
    console.log("Database connected successfully");
}).catch(err => {
    console.error("Database connection failed:", err);
});

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create HTTP server and Socket.io instance
const server = createServer(app); // Create the server with the express app
const io = new Server(server); // Initialize Socket.io with the HTTP server

// Middleware to attach Socket.io instance to the request object
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middleware setup
app.use(express.json({ limit: "50mb" })); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data in the req.body
app.use(cookieParser()); // Cookie parser middleware

// Set up routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stories", storyRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    // React app
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend ", "dist", "index.html"));
    });
}

// Cron job setup
const URL = process.env.PRODUCTION_URL || "http://localhost:3000"; // Use environment variable for production URL
const job = new cron.CronJob("*/14 * * * *", function () {
    http.get(URL, (res) => {
        if (res.statusCode === 200) {
            console.log("GET request sent successfully");
        } else {
            console.log("GET request failed", res.statusCode);
        }
    }).on("error", (e) => {
        console.error("Error while sending request", e);
    });
});

// Start the cron job
job.start();

// Listen on the specified port
server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));