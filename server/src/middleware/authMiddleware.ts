import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";

export async function protect(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("You are not logged in. Please log in first.", 401);
  }

  const token = header.split(" ")[1];

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET is not set in .env", 500);
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string };
    req.userId = decoded.id;
    next();
  } catch {
    throw new AppError("Invalid or expired token. Please log in again.", 401);
  }
}
