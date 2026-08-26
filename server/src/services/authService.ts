import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";

function sanitizeUser(user: any) {
  return {
    id: String(user.id),
    email: user.email,
    createdAt: user.createdAt,
  };
}

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET is not set in .env", 500);
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ||
    "7d") as unknown as jwt.SignOptions["expiresIn"];
  return jwt.sign({ id: userId }, secret, { expiresIn });
}

export async function register(email: string, password: string) {
  // 409 = conflict: a user with this email already exists.
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("This email is already registered", 409);
  }

  const user = await User.create({ email, password });

  const token = signToken(String(user.id));

  return { token, user: sanitizeUser(user) };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(String(user.id));

  return { token, user: sanitizeUser(user) };
}

// ---- GET CURRENT USER (used by GET /api/v1/auth/me) ----
export async function getUserById(id: string) {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return sanitizeUser(user);
}
