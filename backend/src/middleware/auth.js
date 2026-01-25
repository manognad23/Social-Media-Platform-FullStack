import { verifyToken } from "../lib/jwt.js";
import { User } from "../models/User.js";

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    req.user = user;
    next();
  } catch (e) {
    e.status = e.status || 401;
    next(e);
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== "admin") {
    const err = new Error("Forbidden");
    err.status = 403;
    return next(err);
  }
  next();
}

