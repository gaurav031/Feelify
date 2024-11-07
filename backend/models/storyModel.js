import mongoose from "mongoose";

const storySchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video'] },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewCount: { type: Number, default: 0 }, // New field to track viewers
  },
  { timestamps: true }
);

const Story = mongoose.model("Story", storySchema);
export default Story;
