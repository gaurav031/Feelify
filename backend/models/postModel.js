import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Corrected reference
      required: true,
    },
    text: {
      type: String,
      maxLength: 500,
    },
    img: {
      type: String,
    },
    video: {
      type: String,
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User", // Corrected reference
      default: [],
    },
    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Corrected reference
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        userProfilePic: {
          type: String,
        },
        username: {
          type: String,
        },
      },
    ],
    repostOf: { // New field to track reposts
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
