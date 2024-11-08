import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";

// Get User Profile by ID or Username
const getUserProfile = async (req, res) => {
	// We will fetch user profile either with username or userId
	// query is either username or userId
	const { query } = req.params;

	try {
		let user;

		// query is userId
		if (mongoose.Types.ObjectId.isValid(query)) {
			user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
		} else {
			// query is username
			user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
		}

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getUserProfile: ", err.message);
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
// Sign up a New User
const signupUser = async (req, res) => {
	try {
		const { name, email, username, password } = req.body;

		// Check if user already exists with the same email or username
		const existingUser = await User.findOne({ $or: [{ email }, { username }] });
		if (existingUser) {
			return res.status(400).json({ message: "User already exists" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			name,
			email,
			username,
			password: hashedPassword
		});

		await newUser.save();

		generateTokenAndSetCookie(newUser._id, res);

		res.status(201).json({
			_id: newUser._id,
			name: newUser.name,
			email: newUser.email,
			username: newUser.username,
			bio: newUser.bio,
			profilePic: newUser.profilePic,
		});
	} catch (err) {
		console.error("Error in signupUser: ", err.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Login User
const loginUser = async (req, res) => {
	try {
		const { username, password } = req.body;

		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const isPasswordCorrect = await bcrypt.compare(password, user.password);
		if (!isPasswordCorrect) {
			return res.status(400).json({ error: "Incorrect password" });
		}

		// If the account is frozen, unfreeze it upon successful login
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
			// Unfollow the user
			userToModify.followers.pull(currentUserId);
			currentUser.following.pull(id);
		} else {
			// Follow the user
			userToModify.followers.push(currentUserId);
			currentUser.following.push(id);

			// Create a follow notification
			const newNotification = new Notification({
				userId: userToModify._id,
				senderId: currentUserId,
				type: "follow",
				message: `${currentUser.name} started following you.`,
			});
			await newNotification.save();

			// Emit a socket event
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
		console.log("Error in logoutUser: ", err.message); // Log error
		res.status(500).send(); // Do not send error message
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
		if (!user) return res.status(400).send(); // Do not send error message

		if (req.params.id !== userId.toString())
			return res.status(400).send(); // Do not send error message

		if (password) {
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

		// Find all posts that this user replied and update username and userProfilePic fields
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

		// password should be null in response
		user.password = null;

		res.status(200).json(user);
	} catch (err) {
		console.log("Error in updateUser: ", err.message); // Log error
		res.status(500).send(); // Do not send error message
	}
};

const getSuggestedUsers = async (req, res) => {
	try {
		// Ensure the user is authenticated
		if (!req.user || !req.user._id) {
			return res.status(401).json({ error: "User not authenticated" });
		}

		const userId = req.user._id;

		// Get the list of users that the current user is following
		const usersFollowedByYou = await User.findById(userId).select("following");

		if (!usersFollowedByYou) {
			return res.status(404).json({ error: "User not found" });
		}

		// Get 10 random users who are not the current user
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

		// Filter out users that the current user is already following
		const filteredUsers = users.filter(
			(user) => !usersFollowedByYou.following.includes(user._id)
		);

		// Get the first 4 suggested users
		const suggestedUsers = filteredUsers.slice(0, 4);

		// Remove sensitive information like password before sending the response
		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message); // Log the error for debugging
		res.status(500).send(); // Send generic error response
	}
};

const freezeAccount = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(400).send(); // Do not send error message
		}

		user.isFrozen = true;
		await user.save();

		res.status(200).json({ success: true });
	} catch (error) {
		console.log("Error in freezeAccount: ", error.message); // Log error
		res.status(500).send(); // Do not send error message
	}
};

export {
	signupUser,
	loginUser,
	logoutUser,
	followUnFollowUser,
	updateUser,
	getUserProfile,
	getSuggestedUsers,
	freezeAccount,
	searchUser,
	getFollowers,
	getFollowing,
};
