import { Request, Response, NextFunction } from "express";
import { Log } from "../utils/logger";

export async function validateCreateNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { title, message, type } = req.body;
  const errors: string[] = [];

  if (!title || typeof title !== "string" || title.trim() === "") {
    errors.push("title field missing or empty");
  }
  if (!message || typeof message !== "string" || message.trim() === "") {
    errors.push("message field missing or empty");
  }
  if (!type || typeof type !== "string" || type.trim() === "") {
    errors.push("type field missing or empty");
  }

  if (errors.length > 0) {
    await Log("backend", "warn", "handler", `Validation failed: ${errors.join(", ")}`);
    res.status(400).json({ success: false, errors });
    return;
  }

  next();
}
