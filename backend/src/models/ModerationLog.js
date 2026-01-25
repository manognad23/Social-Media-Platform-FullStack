import mongoose from "mongoose";

const ModerationLogSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ["post", "comment", "profile"], required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    reason: { type: String, default: "" }, // e.g. "create_post", "create_comment", "admin_action"
    inputSummary: { type: String, default: "" }, // truncated text / URL reference
    flagged: { type: Boolean, default: false, index: true },
    categories: { type: Object, default: {} },
    scores: { type: Object, default: {} },
    action: { type: String, enum: ["allow", "flag", "remove", "restore"], required: true },
    provider: { type: String, default: "openai" },
    raw: { type: Object, default: {} },
  },
  { timestamps: true }
);

ModerationLogSchema.index({ createdAt: -1 });

export const ModerationLog = mongoose.model("ModerationLog", ModerationLogSchema);

