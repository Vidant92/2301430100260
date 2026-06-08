import { Request, Response, NextFunction } from "express";
import { Log } from "../utils/logger";

export async function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await Log(
    "backend",
    "info",
    "middleware",
    `${req.method} ${req.path} - IP: ${req.ip}`
  );
  next();
}
