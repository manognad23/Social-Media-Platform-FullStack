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

// CORS configuration
const allowedOrigins = process.env.CLIENT_ORIGIN 
  ? process.env.CLIENT_ORIGIN.split(',').map(origin => origin.trim())
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now - restrict in production
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 5000;

await connectDb(process.env.MONGO_URI || "mongodb://localhost:27017/spotmies");
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

