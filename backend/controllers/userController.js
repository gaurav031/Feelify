import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";

const getUserProfile = async (req, res) => {
    // Extract query from request parameters
    const { query } = req.params;

    try {
        let user;

        // Check if query is a valid ObjectId or username
        const isObjectId = mongoose.Types.ObjectId.isValid(query);

        // Create query object based on the type of query
        const queryObject = isObjectId ? { _id: query } : { username: query };

        // Fetch the user, excluding password and updatedAt fields
        user = await User.findOne(queryObject).select("-password -updatedAt");

        // If user is not found, return a 404 status code with an empty JSON object
        if (!user) {
            return res.status(404).json({});
        }

        // Return the user profile
        return res.status(200).json(user);
    } catch (err) {
        // Return a 500 status code with an empty JSON object
        return res.status(500).json({});
    }
};
const searchUser = async (req, res) => {
    try {
        // Extract search query from the request query parameters
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Perform a case-insensitive search for users by `username` or `name`
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } }, // Case-insensitive search for username
                { name: { $regex: query, $options: "i" } }      // Case-insensitive search for name
            ]
        }).select("-password -updatedAt -email"); // Exclude sensitive fields

        // Check if users were found and return appropriate response
        if (!users.length) {
            return res.status(404).json({ message: "No users found" });
        }

        // Return the search results
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in searchUser: ", error.message); // Log the error
        res.status(500).json({ message: "Internal server error" });
    }
};




const signupUser = async (req, res) => {
	try {
		const { name, email, username, password } = req.body;
		const user = await User.findOne({ $or: [{ email }, { username }] });

		if (user) {
			return res.status(400).send(); // Do not send error message
		}
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			name,
			email,
			username,
			password: hashedPassword,
		});
		await newUser.save();

		if (newUser) {
			generateTokenAndSetCookie(newUser._id, res);

			res.status(201).json({
				_id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				username: newUser.username,
				bio: newUser.bio,
				profilePic: newUser.profilePic,
			});
		} else {
			res.status(400).send(); // Do not send error message
		}
	} catch (err) {
		console.log("Error in signupUser: ", err.message); // Log error
		res.status(500).send(); // Do not send error message
	}
};

const loginUser = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) return res.status(400).send(); // Do not send error message

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
		console.log("Error in loginUser: ", error.message); // Log error
		res.status(500).send(); // Do not send error message
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

const followUnFollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (id === req.user._id.toString()) {
            return res.status(400).send(); // User cannot follow themselves
        }

        const [userToModify, currentUser] = await Promise.all([
            User.findById(id),
            User.findById(req.user._id)
        ]);

        // Check if users exist and have required fields
        if (!userToModify || !userToModify.username || !currentUser || !currentUser.username) {
            console.error("User validation failed: Missing username or user not found");
            return res.status(404).json({ message: "User not found or missing username" });
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // Unfollow the user
            userToModify.followers.pull(req.user._id);
            currentUser.following.pull(id);
            await Promise.all([userToModify.save(), currentUser.save()]);

            res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // Follow the user
            userToModify.followers.push(req.user._id);
            currentUser.following.push(id);
            await Promise.all([userToModify.save(), currentUser.save()]);

            // Create a notification for the user being followed
            const newNotification = new Notification({
                userId: userToModify._id,
                senderId: req.user._id,
                type: 'follow',
                message: `${req.user.name} started following you.`,
            });
            await newNotification.save();

            // Emit a socket event to notify the user being followed
            if (req.io) {
                req.io.to(userToModify._id.toString()).emit("userFollowed", {
                    userId: req.user._id,
                    message: `${req.user.name} started following you.`,
                });
            }

            res.status(200).json({ message: "User followed successfully" });
        }
    } catch (err) {
        console.error("Error in followUnFollowUser:", err);
        res.status(500).send(); // Internal server error without exposing details
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
		// exclude the current user from suggested users array and exclude users that current user is already following
		const userId = req.user._id;

		const usersFollowedByYou = await User.findById(userId).select("following");

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
		const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message); // Log error
		res.status(500).send(); // Do not send error message
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
};
