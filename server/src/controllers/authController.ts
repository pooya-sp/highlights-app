import { Request, Response } from "express";
import * as authService from "../services/authService.js";

export async function register(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  const result = await authService.register(email, password);

  res.status(201).json({
    status: "success",
    data: result,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  const result = await authService.login(email, password);

  res.status(200).json({
    status: "success",
    data: result,
  });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getUserById(req.userId as string);

  res.status(200).json({
    status: "success",
    data: { user },
  });
}
