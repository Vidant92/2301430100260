import axios from "axios";
import { config } from "../config";

type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type PackageName =
  | "cache" | "controller" | "cron_job" | "db" | "domain"
  | "handler" | "repository" | "route" | "service"
  | "auth" | "config" | "middleware" | "utils";

export async function Log(
  stack: Stack,
  level: Level,
  packageName: PackageName,
  message: string
): Promise<void> {
  // Always console log
  console.log(`[${stack.toUpperCase()}][${level.toUpperCase()}][${packageName}] ${message}`);

  if (!config.logApiUrl) return;

  try {
    await axios.post(
      config.logApiUrl,
      { stack, level, package: packageName, message },
      {
        headers: {
          "Content-Type": "application/json",
          ...(config.accessToken
            ? { Authorization: `Bearer ${config.accessToken}` }
            : {}),
        },
        timeout: 5000,
      }
    );
  } catch (err) {
    // Graceful failure — log to console but don't crash
    console.error("[logger] Failed to send log to API:", (err as Error).message);
  }
}
