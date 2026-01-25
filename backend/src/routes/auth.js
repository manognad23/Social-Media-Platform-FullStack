import bcrypt from "bcryptjs";
import express from "express";
import { z } from "zod";

import { asyncHandler } from "../lib/asyncHandler.js";
import { signToken } from "../lib/jwt.js";
import { User } from "../models/User.js";

export const authRouter = express.Router();

const registerSchema = z.object({
  username: z.string().min(2).max(30),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, email, password } = registerSchema.parse(req.body);
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const role = "user";
    const user = await User.create({ username, email, passwordHash, role });
    const token = signToken({ userId: user._id.toString() });
    res.json({
      token,
      user: pickUser(user),
    });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Optional: promote admins by email list.
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (adminEmails.includes(user.email) && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = signToken({ userId: user._id.toString() });
    res.json({
      token,
      user: pickUser(user),
    });
  })
);

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  adminSecret: z.string().min(1),
});

authRouter.post(
  "/admin/login",
  asyncHandler(async (req, res) => {
    const { email, password, adminSecret } = adminLoginSchema.parse(req.body);
    const expectedSecret = process.env.ADMIN_SECRET || "admin_secret_change_me";
    
    if (adminSecret !== expectedSecret) {
      return res.status(401).json({ error: "Invalid admin secret key. Check your .env file for ADMIN_SECRET." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found with this email." });

    if (user.role !== "admin") {
      return res.status(403).json({ 
        error: "This account is not an admin. Add your email to ADMIN_EMAILS in .env and login normally first, or set role to 'admin' in database." 
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Incorrect password." });

    const token = signToken({ userId: user._id.toString() });
    res.json({
      token,
      user: pickUser(user),
    });
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

