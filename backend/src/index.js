import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import { connectDb } from "./lib/db.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { uploadsRouter } from "./routes/uploads.js";
import { postsRouter } from "./routes/posts.js";
import { adminRouter } from "./routes/admin.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

/* -------------------- CORS -------------------- */
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // allow all for now
    },
    credentials: true,
  })
);

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

/* -------------------- HEALTH CHECK -------------------- */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/admin", adminRouter);

/* -------------------- ERROR HANDLER -------------------- */
app.use(errorHandler);

/* -------------------- DATABASE -------------------- */
await connectDb(process.env.MONGO_URI || "mongodb://localhost:27017/spotmies");

/* -------------------- EXPORT (IMPORTANT FOR VERCEL) -------------------- */
export default app;
