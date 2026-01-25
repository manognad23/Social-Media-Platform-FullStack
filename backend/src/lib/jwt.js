import jwt from "jsonwebtoken";

export function signToken(payload) {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.verify(token, secret);
}

