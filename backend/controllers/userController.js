import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

// Configure nodemailer
const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ Email credentials are missing");
        return null;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        return transporter;
    } catch (error) {
        console.error("❌ Error creating transport:", error);
        return null;
    }
};

const getTransporter = () => {
    return createTransporter();
};

// Initialize Google OAuth2 Client - MOVED TO FUNCTION
let googleClient;

const initializeGoogleClient = () => {
    try {
        console.log("🔧 Initializing Google OAuth Configuration:");
        console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set");
        console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set");

        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            googleClient = new OAuth2Client(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );
            console.log("✅ Google OAuth2Client initialized successfully");
            return true;
        } else {
            console.log("❌ Google OAuth credentials missing");
            return false;
        }
    } catch (error) {
        console.error("❌ Error initializing Google OAuth2Client:", error);
        return false;
    }
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp, purpose = "verification") => {
    try {
        const transporter = getTransporter();
        if (!transporter) {
            throw new Error("Email transporter not configured");
        }

        const subject = purpose === "passwordReset" 
            ? "Your OTP for Password Reset" 
            : "Your OTP for Account Verification";

        const message = purpose === "passwordReset"
            ? "Your OTP for password reset is:"
            : "Your OTP for account verification is:";

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">${purpose === "passwordReset" ? "Password Reset" : "Account Verification"}</h2>
                    <p>${message}</p>
                    <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px; font-size: 24px;">
                        ${otp}
                    </h1>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log("OTP email sent successfully to:", email);
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error("Failed to send OTP email");
    }
};

// Get User Profile by ID or Username
const getUserProfile = async (req, res) => {
    const { query } = req.params;

    try {
        let user;

        if (mongoose.Types.ObjectId.isValid(query)) {
            user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
        } else {
            user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
        }

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Search Users by Username or Name
const searchUser = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { name: { $regex: query, $options: "i" } }
            ]
        }).select("-password -updatedAt -email");

        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        res.status(200).json(users);
    } catch (error) {
        console.error("Error in searchUser: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Send OTP for Signup
const sendSignupOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const transporter = getTransporter();
        if (!transporter) {
            return res.status(500).json({ message: "Email service is not configured properly" });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OTP.deleteOne({ email });
        await OTP.create({ email, otp, expiresAt });

        await sendOTPEmail(email, otp, "verification");

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("Error in sendSignupOTP: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Verify OTP and Signup
const verifyOTPAndSignup = async (req, res) => {
    try {
        const { name, email, username, password, otp } = req.body;

        if (!name || !email || !username || !password || !otp) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
        }

        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ email, otp });
            return res.status(400).json({ message: "OTP has expired" });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email or username" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            username: username.toLowerCase(),
            password: hashedPassword,
            isVerified: true,
        });

        await newUser.save();
        await OTP.deleteOne({ email, otp });

        generateTokenAndSetCookie(newUser._id, res);

        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            username: newUser.username,
            bio: newUser.bio,
            profilePic: newUser.profilePic,
        });
    } catch (error) {
        console.error("Error in verifyOTPAndSignup: ", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Username already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Verify Google token directly
const verifyGoogleToken = async (idToken) => {
    try {
        // Initialize Google client if not already initialized
        if (!googleClient) {
            const initialized = initializeGoogleClient();
            if (!initialized) {
                throw new Error("Google OAuth not configured");
            }
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        console.error("Error verifying Google token:", error);
        throw new Error("Invalid Google token");
    }
};

// UPDATED Google Auth - Using token instead of code
// In your userController.js - Update the googleAuth function:

const googleAuth = async (req, res) => {
    try {
        const { token, code } = req.body; // Accept both token and code

        if (!token && !code) {
            return res.status(400).json({ message: "Google token or authorization code is required" });
        }

        console.log("Starting Google authentication...");
        console.log("Token:", token ? "Provided" : "Not provided");
        console.log("Code:", code ? "Provided" : "Not provided");

        let googleUser;

        // If token is provided, verify it directly
        if (token) {
            console.log("Using token-based authentication...");
            googleUser = await verifyGoogleToken(token);
        } 
        // If code is provided, exchange it for tokens
        else if (code) {
            console.log("Using code-based authentication...");
            googleUser = await exchangeCodeForTokens(code);
        }

        if (!googleUser) {
            return res.status(400).json({ message: "Failed to authenticate with Google" });
        }
        
        const { email, name, picture, sub: googleId } = googleUser;

        if (!email || !name || !googleId) {
            return res.status(400).json({ message: "Invalid Google user data" });
        }

        console.log(`Processing Google user: ${name} (${email})`);

        // Check if user exists
        let user = await User.findOne({ 
            $or: [
                { email },
                { googleId }
            ]
        });

        if (user) {
            console.log("User found:", user.username);
            // Update user with Google info if missing
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (!user.profilePic && picture) {
                user.profilePic = picture;
            }
            await user.save();
        } else {
            console.log("Creating new user with Google...");
            // Create new user
            const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let username = baseUsername;
            let counter = 1;

            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }
            
            // Create a secure random password
            const salt = await bcrypt.genSalt(10);
            const randomPassword = await bcrypt.hash(googleId + Date.now(), salt);
            
            user = new User({
                name: name,
                email: email,
                username: username,
                googleId: googleId,
                profilePic: picture || "",
                isVerified: true,
                password: randomPassword,
            });

            await user.save();
            console.log("New user created:", username);
        }

        // Generate token and set cookie
        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            bio: user.bio,
            profilePic: user.profilePic,
            isGoogleUser: true,
        });
    } catch (error) {
        console.error("Error in googleAuth: ", error.message);
        
        if (error.message.includes("Invalid Google token")) {
            return res.status(400).json({ message: "Invalid Google token" });
        }
        
        res.status(500).json({ message: "Internal server error: " + error.message });
    }
};

// ALTERNATIVE: Exchange code for tokens (if you want to keep code flow)
const exchangeCodeForTokens = async (code) => {
    try {
        // Initialize Google client if not already initialized
        if (!googleClient) {
            const initialized = initializeGoogleClient();
            if (!initialized) {
                throw new Error("Google OAuth not configured");
            }
        }

        console.log("Exchanging code for tokens...");
        
        const { tokens } = await googleClient.getToken({
            code: code,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'postmessage'
        });
        
        console.log("Tokens received successfully");
        
        // Verify the ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        console.error("Error exchanging code:", error);
        throw new Error("Failed to exchange code for tokens: " + error.message);
    }
};

// Alternative Google Auth with code (if you prefer this approach)
const googleAuthWithCode = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        console.log("Starting Google authentication with code...");

        const googleUser = await exchangeCodeForTokens(code);
        
        const { email, name, picture, sub: googleId } = googleUser;

        if (!email || !name || !googleId) {
            return res.status(400).json({ message: "Invalid Google user data" });
        }

        console.log(`Processing Google user: ${name} (${email})`);

        let user = await User.findOne({ 
            $or: [
                { email },
                { googleId }
            ]
        });

        if (user) {
            console.log("User found:", user.username);
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (!user.profilePic && picture) {
                user.profilePic = picture;
            }
            await user.save();
        } else {
            console.log("Creating new user with Google...");
            const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let username = baseUsername;
            let counter = 1;

            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }
            
            const salt = await bcrypt.genSalt(10);
            const randomPassword = await bcrypt.hash(googleId + Date.now(), salt);
            
            user = new User({
                name: name,
                email: email,
                username: username,
                googleId: googleId,
                profilePic: picture || "",
                isVerified: true,
                password: randomPassword,
            });

            await user.save();
            console.log("New user created:", username);
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            bio: user.bio,
            profilePic: user.profilePic,
            isGoogleUser: true,
        });
    } catch (error) {
        console.error("Error in googleAuthWithCode: ", error.message);
        res.status(500).json({ message: "Internal server error: " + error.message });
    }
};

// Send OTP for Password Reset
const sendPasswordResetOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const transporter = getTransporter();
        if (!transporter) {
            return res.status(500).json({ message: "Email service is not configured properly" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: "If the email exists, an OTP will be sent" });
        }

        if (user.googleId && !user.password) {
            return res.status(400).json({ message: "Google account detected. Please use Google login." });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OTP.deleteOne({ email, purpose: "passwordReset" });
        await OTP.create({ email, otp, expiresAt, purpose: "passwordReset" });

        await sendOTPEmail(email, otp, "passwordReset");

        res.status(200).json({ message: "If the email exists, an OTP will be sent" });
    } catch (error) {
        console.error("Error in sendPasswordResetOTP: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Verify OTP for Password Reset
const verifyPasswordResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const otpRecord = await OTP.findOne({ 
            email, 
            otp, 
            purpose: "passwordReset" 
        });
        
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ email, otp, purpose: "passwordReset" });
            return res.status(400).json({ message: "OTP has expired" });
        }

        res.status(200).json({ 
            message: "OTP verified successfully",
            verified: true 
        });
    } catch (error) {
        console.error("Error in verifyPasswordResetOTP: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Reset Password with Verified OTP
const resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const otpRecord = await OTP.findOne({ 
            email, 
            otp, 
            purpose: "passwordReset" 
        });
        
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ email, otp, purpose: "passwordReset" });
            return res.status(400).json({ message: "OTP has expired" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (user.googleId && !user.password) {
            return res.status(400).json({ message: "Google account detected. Please use Google login." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        await OTP.deleteOne({ email, otp, purpose: "passwordReset" });

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Error in resetPasswordWithOTP: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login User
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const user = await User.findOne({ 
            $or: [
                { username: username.toLowerCase() },
                { email: username.toLowerCase() }
            ] 
        });
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.googleId && !user.password) {
            return res.status(400).json({ 
                error: "This account is linked with Google. Please login with Google." 
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ error: "Incorrect password" });
        }

        if (user.isFrozen) {
            user.isFrozen = false;
            await user.save();
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            bio: user.bio,
            profilePic: user.profilePic,
            isGoogleUser: !!user.googleId,
        });
    } catch (error) {
        console.error("Error in loginUser: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Follow or Unfollow a User
const followUnFollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id.toString();

        if (id === currentUserId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const userToModify = await User.findById(id);
        const currentUser = await User.findById(currentUserId);

        if (!userToModify || !currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            userToModify.followers.pull(currentUserId);
            currentUser.following.pull(id);
        } else {
            userToModify.followers.push(currentUserId);
            currentUser.following.push(id);

            const newNotification = new Notification({
                userId: userToModify._id,
                senderId: currentUserId,
                type: "follow",
                message: `${currentUser.name} started following you.`,
            });
            await newNotification.save();

            if (req.io) {
                req.io.to(userToModify._id.toString()).emit("userFollowed", {
                    userId: currentUserId,
                    message: `${currentUser.name} started following you.`,
                });
            }
        }

        await userToModify.save();
        await currentUser.save();

        res.status(200).json({ message: isFollowing ? "User unfollowed" : "User followed" });
    } catch (err) {
        console.error("Error in followUnFollowUser: ", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const logoutUser = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 1 });
        res.status(200).json({ message: "User logged out successfully" });
    } catch (err) {
        console.log("Error in logoutUser: ", err.message);
        res.status(500).send();
    }
};

const getFollowers = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate("followers", "name username profilePic");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user.followers);
    } catch (error) {
        console.error("Error in getFollowers: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getFollowing = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate("following", "name username profilePic");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user.following);
    } catch (error) {
        console.error("Error in getFollowing: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateUser = async (req, res) => {
    const { name, email, username, password, bio } = req.body;
    let { profilePic } = req.body;

    const userId = req.user._id;
    try {
        let user = await User.findById(userId);
        if (!user) return res.status(400).send();

        if (req.params.id !== userId.toString())
            return res.status(400).send();

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters long" });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        if (profilePic) {
            if (user.profilePic) {
                await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(profilePic);
            profilePic = uploadedResponse.secure_url;
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.username = username || user.username;
        user.profilePic = profilePic || user.profilePic;
        user.bio = bio || user.bio;

        user = await user.save();

        await Post.updateMany(
            { "replies.userId": userId },
            {
                $set: {
                    "replies.$[reply].username": user.username,
                    "replies.$[reply].userProfilePic": user.profilePic,
                },
            },
            { arrayFilters: [{ "reply.userId": userId }] }
        );

        user.password = null;

        res.status(200).json(user);
    } catch (err) {
        console.log("Error in updateUser: ", err.message);
        res.status(500).send();
    }
};

const getSuggestedUsers = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const userId = req.user._id;

        const usersFollowedByYou = await User.findById(userId).select("following");

        if (!usersFollowedByYou) {
            return res.status(404).json({ error: "User not found" });
        }

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId },
                },
            },
            {
                $sample: { size: 10 },
            },
        ]);

        const filteredUsers = users.filter(
            (user) => !usersFollowedByYou.following.includes(user._id)
        );

        const suggestedUsers = filteredUsers.slice(0, 4);
        suggestedUsers.forEach((user) => (user.password = null));

        res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Error in getSuggestedUsers: ", error.message);
        res.status(500).send();
    }
};

const freezeAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(400).send();
        }

        user.isFrozen = true;
        await user.save();

        res.status(200).json({ success: true });
    } catch (error) {
        console.log("Error in freezeAccount: ", error.message);
        res.status(500).send();
    }
};

export {
    getUserProfile,
    searchUser,
    verifyPasswordResetOTP,
    resetPasswordWithOTP,
    verifyOTPAndSignup,
    loginUser,
    logoutUser,
    followUnFollowUser,
    updateUser,
    getSuggestedUsers,
    freezeAccount,
    getFollowers,
    getFollowing,
    sendSignupOTP,
    googleAuth, // Uses token-based approach
    googleAuthWithCode, // Alternative code-based approach
    sendPasswordResetOTP,
};