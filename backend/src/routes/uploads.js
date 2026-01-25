import express from "express";
import multer from "multer";

import { asyncHandler } from "../lib/asyncHandler.js";
import { initCloudinary } from "../lib/cloudinary.js";
import { requireAuth } from "../middleware/auth.js";

export const uploadsRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

uploadsRouter.post(
  "/image",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ 
        error: "Image uploads are not configured. Please add Cloudinary credentials to .env file or post without an image." 
      });
    }
    
    if (!req.file) return res.status(400).json({ error: "Missing image file" });
    const cloudinary = initCloudinary();

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "spotmies", resource_type: "image" },
        (err, out) => (err ? reject(err) : resolve(out))
      );
      stream.end(req.file.buffer);
    });

    res.json({
      image: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  })
);

