import express, { json, NextFunction, Request, Response } from "express";
import authRouter from "./routes/authRoutes.js";
import linkRouter from "./routes/linkRoutes.js";
import AppError from "./utils/appError.js";

const app = express();

app.use(json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use("/api/v1/auth", authRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "success",
    data: { message: "Highlights_App API is running" },
  });
});

app.use("/api/v1/links", linkRouter);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});


app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {

  if (err?.name === "ValidationError") {
    const messages = Object.values(err.errors ?? {}).map((e: any) => e.message);
    return res.status(400).json({
      status: "fail",
      message: messages.join(". ") || "Invalid input",
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      status: "fail",
      message: "This email is already registered",
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Something went wrong";

  if (statusCode === 500) {
    console.error("ERROR 💥", err);
  }

  res.status(statusCode).json({
    status: err.status || "error",
    message,
  });
});

export default app;
