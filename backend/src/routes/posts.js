import express from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";

import { asyncHandler } from "../lib/asyncHandler.js";
import { runModeration } from "../lib/moderation.js";
import { requireAuth } from "../middleware/auth.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";
import { ModerationLog } from "../models/ModerationLog.js";
import { User } from "../models/User.js";

export const postsRouter = express.Router();

/* ------------------------------------------------------------------ */
/* RATE LIMITER (protects AI moderation + prevents spam)               */
/* ------------------------------------------------------------------ */
const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 posts/comments per minute per user
  standardHeaders: true,
  legacyHeaders: false,
});

/* ------------------------------------------------------------------ */
/* GET FEED                                                           */
/* ------------------------------------------------------------------ */
postsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const posts = await Post.find({ status: "visible" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const postIds = posts.map((p) => p._id);

    const comments = await Comment.find({
      postId: { $in: postIds },
      status: "visible",
    })
      .sort({ createdAt: 1 })
      .lean();

    const allUserIds = [
      ...new Set([
        ...posts.map((p) => p.authorId.toString()),
        ...comments.map((c) => c.authorId.toString()),
      ]),
    ];

    const users = await User.find({ _id: { $in: allUserIds } }).lean();
    const userMap = new Map(
      users.map((u) => [
        u._id.toString(),
        { id: u._id.toString(), username: u.username, avatarUrl: u.avatarUrl || "" },
      ])
    );

    const commentsByPost = new Map();
    for (const c of comments) {
      const pid = c.postId.toString();
      if (!commentsByPost.has(pid)) commentsByPost.set(pid, []);
      const author = userMap.get(c.authorId.toString());
      if (author) {
        commentsByPost.get(pid).push({
          id: c._id.toString(),
          text: c.text,
          createdAt: c.createdAt,
          author,
        });
      }
    }

    res.json({
      posts: posts.map((p) => ({
        id: p._id.toString(),
        text: p.text,
        image: p.image?.url ? { url: p.image.url } : null,
        status: p.status,
        createdAt: p.createdAt,
        author:
          userMap.get(p.authorId.toString()) || {
            id: p.authorId.toString(),
            username: "Unknown",
            avatarUrl: "",
          },
        comments: commentsByPost.get(p._id.toString()) || [],
      })),
    });
  })
);

/* ------------------------------------------------------------------ */
/* CREATE POST                                                        */
/* ------------------------------------------------------------------ */
const createPostSchema = z.object({
  text: z.string().max(4000).optional().default(""),
  imageUrl: z.string().url().optional().or(z.literal("")),
  imagePublicId: z.string().optional().default(""),
});

postsRouter.post(
  "/",
  requireAuth,
  postLimiter,
  asyncHandler(async (req, res) => {
    const { text, imageUrl, imagePublicId } = createPostSchema.parse(req.body);

    let mod;
    try {
      mod = await runModeration({ text, imageUrl });
    } catch (err) {
      console.error("Moderation failed:", err.message);
      mod = {
        flagged: false,
        categories: {},
        scores: {},
        provider: "unavailable",
        inputSummary: "",
        raw: null,
      };
    }

    const post = await Post.create({
      authorId: req.user._id,
      text,
      image: imageUrl
        ? { url: imageUrl, publicId: imagePublicId || "" }
        : { url: "", publicId: "" },
      status: mod.flagged ? "flagged" : "visible",
      moderation: mod,
    });

    await ModerationLog.create({
      targetType: "post",
      targetId: post._id,
      actorUserId: req.user._id,
      reason: "create_post",
      inputSummary: mod.inputSummary,
      flagged: mod.flagged,
      categories: mod.categories,
      scores: mod.scores,
      action: mod.flagged ? "flag" : "allow",
      provider: mod.provider,
      raw: mod.raw,
    });

    res.json({
      post: {
        id: post._id.toString(),
        status: post.status,
      },
    });
  })
);

/* ------------------------------------------------------------------ */
/* CREATE COMMENT                                                     */
/* ------------------------------------------------------------------ */
const createCommentSchema = z.object({
  text: z.string().min(1).max(2000),
});

postsRouter.post(
  "/:postId/comments",
  requireAuth,
  postLimiter,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { text } = createCommentSchema.parse(req.body);

    const post = await Post.findById(postId).lean();
    if (!post || post.status === "removed") {
      return res.status(404).json({ error: "Post not found" });
    }

    let mod;
    try {
      mod = await runModeration({ text, imageUrl: "" });
    } catch (err) {
      console.error("Moderation failed:", err.message);
      mod = {
        flagged: false,
        categories: {},
        scores: {},
        provider: "unavailable",
        inputSummary: "",
        raw: null,
      };
    }

    const comment = await Comment.create({
      postId,
      authorId: req.user._id,
      text,
      status: mod.flagged ? "flagged" : "visible",
      moderation: mod,
    });

    await ModerationLog.create({
      targetType: "comment",
      targetId: comment._id,
      actorUserId: req.user._id,
      reason: "create_comment",
      inputSummary: mod.inputSummary,
      flagged: mod.flagged,
      categories: mod.categories,
      scores: mod.scores,
      action: mod.flagged ? "flag" : "allow",
      provider: mod.provider,
      raw: mod.raw,
    });

    res.json({
      comment: {
        id: comment._id.toString(),
        status: comment.status,
      },
    });
  })
);

/* ------------------------------------------------------------------ */
/* DELETE POST                                                        */
/* ------------------------------------------------------------------ */
postsRouter.delete(
  "/:postId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }

    post.status = "removed";
    await post.save();

    res.json({ ok: true });
  })
);
