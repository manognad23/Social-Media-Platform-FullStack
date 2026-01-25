import express from "express";
import { z } from "zod";

import { asyncHandler } from "../lib/asyncHandler.js";
import { runModeration } from "../lib/moderation.js";
import { requireAuth } from "../middleware/auth.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";
import { ModerationLog } from "../models/ModerationLog.js";
import { User } from "../models/User.js";

export const postsRouter = express.Router();

postsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = { status: "visible" };

    const posts = await Post.find(query).sort({ createdAt: -1 }).limit(50).lean();
    const postIds = posts.map((p) => p._id);
    
    // Get all comments first
    const comments = await Comment.find({ postId: { $in: postIds }, status: "visible" }).sort({ createdAt: 1 }).lean();
    
    // Collect ALL user IDs from both posts AND comments
    const postAuthorIds = posts.map((p) => p.authorId.toString());
    const commentAuthorIds = comments.map((c) => c.authorId.toString());
    const allUserIds = [...new Set([...postAuthorIds, ...commentAuthorIds])];
    
    // Fetch all users (both post and comment authors)
    const users = await User.find({ _id: { $in: allUserIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), { id: u._id.toString(), username: u.username, avatarUrl: u.avatarUrl || "" }]));

    // Map comments to posts
    const commentsByPost = new Map();
    for (const c of comments) {
      const pid = c.postId.toString();
      if (!commentsByPost.has(pid)) commentsByPost.set(pid, []);
      const commentAuthor = userMap.get(c.authorId.toString());
      if (commentAuthor) {
        commentsByPost.get(pid).push({
          id: c._id.toString(),
          text: c.text,
          createdAt: c.createdAt,
          author: commentAuthor,
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
        author: userMap.get(p.authorId.toString()) || { id: p.authorId.toString(), username: "Unknown", avatarUrl: "" },
        comments: commentsByPost.get(p._id.toString()) || [],
      })),
    });
  })
);

const createPostSchema = z.object({
  text: z.string().max(4000).optional().default(""),
  imageUrl: z.string().url().optional().or(z.literal("")),
  imagePublicId: z.string().optional().default(""),
});

postsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { text, imageUrl, imagePublicId } = createPostSchema.parse(req.body);

    const mod = await runModeration({ text, imageUrl });
    const status = mod.flagged ? "flagged" : "visible";

    const post = await Post.create({
      authorId: req.user._id,
      text: text || "",
      image: imageUrl ? { url: imageUrl, publicId: imagePublicId || "" } : { url: "", publicId: "" },
      status,
      moderation: { flagged: mod.flagged, categories: mod.categories, scores: mod.scores, provider: mod.provider },
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

const createCommentSchema = z.object({
  text: z.string().min(1).max(2000),
});

postsRouter.post(
  "/:postId/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { text } = createCommentSchema.parse(req.body);

    const post = await Post.findById(postId).lean();
    if (!post || post.status === "removed") return res.status(404).json({ error: "Post not found" });

    const mod = await runModeration({ text, imageUrl: "" });
    const status = mod.flagged ? "flagged" : "visible";

    const comment = await Comment.create({
      postId,
      authorId: req.user._id,
      text,
      status,
      moderation: { flagged: mod.flagged, categories: mod.categories, scores: mod.scores, provider: mod.provider },
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

// Get user's posts
postsRouter.get(
  "/user/:userId",
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const posts = await Post.find({ authorId: userId, status: "visible" })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    const postIds = posts.map((p) => p._id);
    
    // Get all comments first
    const comments = await Comment.find({ postId: { $in: postIds }, status: "visible" }).sort({ createdAt: 1 }).lean();
    
    // Collect ALL user IDs from both posts AND comments
    const postAuthorIds = posts.map((p) => p.authorId.toString());
    const commentAuthorIds = comments.map((c) => c.authorId.toString());
    const allUserIds = [...new Set([...postAuthorIds, ...commentAuthorIds])];
    
    // Fetch all users (both post and comment authors)
    const users = await User.find({ _id: { $in: allUserIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), { id: u._id.toString(), username: u.username, avatarUrl: u.avatarUrl || "" }]));
    
    // Map comments to posts
    const commentsByPost = new Map();
    for (const c of comments) {
      const pid = c.postId.toString();
      if (!commentsByPost.has(pid)) commentsByPost.set(pid, []);
      const commentAuthor = userMap.get(c.authorId.toString());
      if (commentAuthor) {
        commentsByPost.get(pid).push({
          id: c._id.toString(),
          text: c.text,
          createdAt: c.createdAt,
          author: commentAuthor,
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
        author: userMap.get(p.authorId.toString()) || { id: p.authorId.toString(), username: "Unknown", avatarUrl: "" },
        comments: commentsByPost.get(p._id.toString()) || [],
      })),
    });
  })
);

// Delete post (only by author)
postsRouter.delete(
  "/:postId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    
    if (!post) return res.status(404).json({ error: "Post not found" });
    
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    post.status = "removed";
    await post.save();

    res.json({ ok: true });
  })
);

