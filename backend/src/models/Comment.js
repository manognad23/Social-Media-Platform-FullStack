import mongoose from "mongoose";

const ModerationSchema = new mongoose.Schema(
  {
    flagged: { type: Boolean, default: false },
    categories: { type: Object, default: {} },
    scores: { type: Object, default: {} },
    provider: { type: String, default: "openai" },
  },
  { _id: false }
);

const CommentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["visible", "flagged", "removed"], default: "visible", index: true },
    moderation: { type: ModerationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

CommentSchema.index({ createdAt: 1 });

export const Comment = mongoose.model("Comment", CommentSchema);

