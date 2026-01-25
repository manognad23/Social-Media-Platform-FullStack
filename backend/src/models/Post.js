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

const PostSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, default: "", maxlength: 4000 },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    status: { type: String, enum: ["visible", "flagged", "removed"], default: "visible", index: true },
    moderation: { type: ModerationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });

export const Post = mongoose.model("Post", PostSchema);

