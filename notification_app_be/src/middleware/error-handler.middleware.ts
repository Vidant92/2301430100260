import { Request, Response, NextFunction } from "express";
import { Log } from "../utils/logger";

export async function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  await Log(
    "backend",
    "fatal",
    "middleware",
    `Unhandled error on ${req.method} ${req.path}: ${err.message}`
  );
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
}
