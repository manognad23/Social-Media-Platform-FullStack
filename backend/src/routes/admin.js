import express from "express";
import { z } from "zod";

import { asyncHandler } from "../lib/asyncHandler.js";
import { sendModerationRemovalEmail } from "../lib/mailer.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";
import { ModerationLog } from "../models/ModerationLog.js";
import { User } from "../models/User.js";

export const adminRouter = express.Router();

adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

adminRouter.get(
  "/flagged",
  asyncHandler(async (_req, res) => {
    const flaggedPosts = await Post.find({ status: "flagged" }).sort({ createdAt: -1 }).limit(50).lean();
    const flaggedComments = await Comment.find({ status: "flagged" }).sort({ createdAt: -1 }).limit(100).lean();

    const userIds = [
      ...new Set([
        ...flaggedPosts.map((p) => p.authorId.toString()),
        ...flaggedComments.map((c) => c.authorId.toString()),
      ]),
    ];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), { id: u._id.toString(), username: u.username, email: u.email }]));

    res.json({
      posts: flaggedPosts.map((p) => ({
        id: p._id.toString(),
        text: p.text,
        imageUrl: p.image?.url || "",
        createdAt: p.createdAt,
        author: userMap.get(p.authorId.toString()) || { id: p.authorId.toString(), username: "Unknown", email: "" },
        moderation: p.moderation || {},
      })),
      comments: flaggedComments.map((c) => ({
        id: c._id.toString(),
        postId: c.postId.toString(),
        text: c.text,
        createdAt: c.createdAt,
        author: userMap.get(c.authorId.toString()) || { id: c.authorId.toString(), username: "Unknown", email: "" },
        moderation: c.moderation || {},
      })),
    });
  })
);

adminRouter.get(
  "/logs",
  asyncHandler(async (_req, res) => {
    const logs = await ModerationLog.find({}).sort({ createdAt: -1 }).limit(200).lean();
    res.json({
      logs: logs.map((l) => ({
        id: l._id.toString(),
        targetType: l.targetType,
        targetId: l.targetId.toString(),
        actorUserId: l.actorUserId ? l.actorUserId.toString() : null,
        reason: l.reason,
        flagged: l.flagged,
        action: l.action,
        inputSummary: l.inputSummary,
        categories: l.categories,
        scores: l.scores,
        createdAt: l.createdAt,
      })),
    });
  })
);

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const flaggedPosts = await Post.countDocuments({ status: "flagged" });
    const flaggedComments = await Comment.countDocuments({ status: "flagged" });
    const visiblePosts = await Post.countDocuments({ status: "visible" });
    const removedPosts = await Post.countDocuments({ status: "removed" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Posts by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const postsByDay = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Users by day (last 30 days)
    const usersByDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Posts by status
    const postsByStatus = await Post.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentPosts = await Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentComments = await Comment.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      totals: {
        users: totalUsers,
        posts: totalPosts,
        comments: totalComments,
        admins: totalAdmins,
      },
      moderation: {
        flaggedPosts,
        flaggedComments,
        visiblePosts,
        removedPosts,
      },
      recent: {
        posts: recentPosts,
        users: recentUsers,
        comments: recentComments,
      },
      charts: {
        postsByDay: postsByDay.map((item) => ({ date: item._id, count: item.count })),
        usersByDay: usersByDay.map((item) => ({ date: item._id, count: item.count })),
        postsByStatus: postsByStatus.map((item) => ({ status: item._id, count: item.count })),
      },
    });
  })
);

const moderateSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
  action: z.enum(["remove", "restore"]),
});

adminRouter.post(
  "/moderate",
  asyncHandler(async (req, res) => {
    const { targetType, targetId, action } = moderateSchema.parse(req.body);

    const desiredStatus = action === "remove" ? "removed" : "visible";
    const reason = "admin_action";

    if (targetType === "post") {
      const post = await Post.findById(targetId);
      if (!post) return res.status(404).json({ error: "Not found" });
      post.status = desiredStatus;
      await post.save();

      // Send email notification if admin removed this post
      if (action === "remove") {
        const author = await User.findById(post.authorId);
        if (author?.email) {
          await sendModerationRemovalEmail({
            to: author.email,
            username: author.username,
            targetType: "post",
            reason: "Your post violated our community guidelines",
          });
        }
      }

      await ModerationLog.create({
        targetType: "post",
        targetId: post._id,
        actorUserId: req.user._id,
        reason,
        inputSummary: "",
        flagged: post.moderation?.flagged || false,
        categories: post.moderation?.categories || {},
        scores: post.moderation?.scores || {},
        action: action === "remove" ? "remove" : "restore",
        provider: post.moderation?.provider || "openai",
        raw: {},
      });
    } else {
      const comment = await Comment.findById(targetId);
      if (!comment) return res.status(404).json({ error: "Not found" });
      comment.status = desiredStatus;
      await comment.save();

      // Send email notification if admin removed this comment
      if (action === "remove") {
        const author = await User.findById(comment.authorId);
        if (author?.email) {
          await sendModerationRemovalEmail({
            to: author.email,
            username: author.username,
            targetType: "comment",
            reason: "Your comment violated our community guidelines",
          });
        }
      }

      await ModerationLog.create({
        targetType: "comment",
        targetId: comment._id,
        actorUserId: req.user._id,
        reason,
        inputSummary: "",
        flagged: comment.moderation?.flagged || false,
        categories: comment.moderation?.categories || {},
        scores: comment.moderation?.scores || {},
        action: action === "remove" ? "remove" : "restore",
        provider: comment.moderation?.provider || "openai",
        raw: {},
      });
    }

    res.json({ ok: true });
  })
);
