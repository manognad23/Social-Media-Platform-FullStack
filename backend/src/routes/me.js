import express from "express";
import { z } from "zod";

import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const meRouter = express.Router();

meRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: pickUser(req.user) });
  })
);

const updateSchema = z.object({
  username: z.string().min(2).max(30).optional(),
  bio: z.string().max(280).optional(),
  aboutMe: z.string().max(1000).optional(),
  avatarUrl: z.string().url().or(z.literal("")).optional(),
});

meRouter.put(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const patch = updateSchema.parse(req.body);
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "Not found" });

    if (typeof patch.username !== "undefined") user.username = patch.username;
    if (typeof patch.bio !== "undefined") user.bio = patch.bio;
    if (typeof patch.aboutMe !== "undefined") user.aboutMe = patch.aboutMe;
    if (typeof patch.avatarUrl !== "undefined") user.avatarUrl = patch.avatarUrl;
    await user.save();

    res.json({ user: pickUser(user) });
  })
);

function pickUser(u) {
  return {
    id: u._id.toString(),
    username: u.username,
    email: u.email,
    bio: u.bio || "",
    aboutMe: u.aboutMe || "",
    avatarUrl: u.avatarUrl || "",
    role: u.role,
  };
}

