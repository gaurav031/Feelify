import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
  try {
    // Extract the token from cookies
    const token = req.cookies.jwt;

    // If there's no token, return Unauthorized response
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user associated with the token
    const user = await User.findById(decoded.userId).select("-password");

    // If user not found, return Unauthorized
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to the request object
    req.user = user;

    // Proceed to the next middleware
    next();
  } catch (err) {
    // Check if the error is due to token expiration
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }

    // Log the error and send a generic server error response
    console.error("Error in protectRoute: ", err.message);
    res.status(500).json({ message: "An error occurred, please try again." });
  }
};

export default protectRoute;
