import express from "express";
import {
  getUserProfile,
  searchUser,
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
  googleAuth,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPasswordWithOTP,
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/profile/:query", getUserProfile);
router.get("/search", searchUser);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.get("/followers/:id", protectRoute, getFollowers);
router.get("/following/:id", protectRoute, getFollowing);

router.post("/signup/otp", sendSignupOTP);
router.post("/signup", verifyOTPAndSignup);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/google-auth", googleAuth);

// Password reset routes - fixed order and naming
router.post("/send-password-reset-otp", sendPasswordResetOTP);
router.post("/verify-password-reset-otp", verifyPasswordResetOTP);
router.post("/reset-password-with-otp", resetPasswordWithOTP);

router.post("/follow/:id", protectRoute, followUnFollowUser);
router.put("/update/:id", protectRoute, updateUser);
router.put("/freeze", protectRoute, freezeAccount);

export default router;