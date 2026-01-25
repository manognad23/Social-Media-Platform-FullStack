import cors from "cors";
import dotenv from "dotenv";
import express from "express";
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

// CORS
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:5173"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);

// ✅ connect DB once
await connectDb(process.env.MONGO_URI);

export default app;
