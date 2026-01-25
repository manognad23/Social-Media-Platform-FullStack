import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, default: "", maxlength: 280 },
    aboutMe: { type: String, default: "", maxlength: 1000 },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 });

export const User = mongoose.model("User", UserSchema);

