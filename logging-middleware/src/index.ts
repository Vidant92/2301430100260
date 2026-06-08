import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Stack = "backend" | "frontend";

export type Level = "debug" | "info" | "warn" | "error" | "fatal";

export type BackendPackage =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service";

export type FrontendPackage =
  | "api"
  | "component"
  | "hook"
  | "page"
  | "state"
  | "style";

export type SharedPackage = "auth" | "config" | "middleware" | "utils";

export type PackageName = BackendPackage | FrontendPackage | SharedPackage;

// ─── Constants ───────────────────────────────────────────────────────────────

const VALID_STACKS: Stack[] = ["backend", "frontend"];

const VALID_LEVELS: Level[] = ["debug", "info", "warn", "error", "fatal"];

const BACKEND_PACKAGES: BackendPackage[] = [
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
];

const FRONTEND_PACKAGES: FrontendPackage[] = [
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
];

const SHARED_PACKAGES: SharedPackage[] = [
  "auth",
  "config",
  "middleware",
  "utils",
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateParams(
  stack: string,
  level: string,
  packageName: string,
  message: string
): void {
  if (!VALID_STACKS.includes(stack as Stack)) {
    throw new Error(
      `Invalid stack: "${stack}". Must be one of: ${VALID_STACKS.join(", ")}`
    );
  }

  if (!VALID_LEVELS.includes(level as Level)) {
    throw new Error(
      `Invalid level: "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`
    );
  }

  const allowedPackages: string[] =
    stack === "backend"
      ? [...BACKEND_PACKAGES, ...SHARED_PACKAGES]
      : [...FRONTEND_PACKAGES, ...SHARED_PACKAGES];

  if (!allowedPackages.includes(packageName)) {
    throw new Error(
      `Invalid package "${packageName}" for stack "${stack}". Allowed: ${allowedPackages.join(", ")}`
    );
  }

  if (!message || typeof message !== "string" || message.trim() === "") {
    throw new Error("Message must be a non-empty string");
  }
}

// ─── Get config from environment ─────────────────────────────────────────────

function getConfig(): { apiUrl: string; accessToken: string } {
  // Works in Node.js (backend) and Vite (frontend via import.meta.env)
  let apiUrl = "";
  let accessToken = "";

  try {
    // Node.js / backend
    if (typeof process !== "undefined" && process.env) {
      apiUrl = process.env.LOG_API_URL || "";
      accessToken = process.env.ACCESS_TOKEN || "";
    }
  } catch {
    // ignore
  }

  try {
    // Vite frontend
    if (
      typeof import.meta !== "undefined" &&
      (import.meta as any).env
    ) {
      const env = (import.meta as any).env;
      apiUrl = apiUrl || env.VITE_LOG_API_URL || "";
      accessToken = accessToken || env.VITE_ACCESS_TOKEN || "";
    }
  } catch {
    // ignore
  }

  return { apiUrl, accessToken };
}

// ─── Log Response Type ────────────────────────────────────────────────────────

export interface LogResponse {
  success: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

// ─── Main Log Function ────────────────────────────────────────────────────────

export async function Log(
  stack: Stack,
  level: Level,
  packageName: PackageName,
  message: string
): Promise<LogResponse> {
  try {
    validateParams(stack, level, packageName, message);
  } catch (validationError: unknown) {
    const errMsg =
      validationError instanceof Error
        ? validationError.message
        : "Validation failed";
    console.error(`[logging-middleware] Validation error: ${errMsg}`);
    return { success: false, error: errMsg };
  }

  const { apiUrl, accessToken } = getConfig();

  if (!apiUrl) {
    console.warn(
      "[logging-middleware] LOG_API_URL not set. Logging to console only."
    );
    console.log(
      `[${stack.toUpperCase()}][${level.toUpperCase()}][${packageName}] ${message}`
    );
    return { success: true, data: { console: true } };
  }

  const payload = {
    stack,
    level,
    package: packageName,
    message,
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      timeout: 5000,
    });

    return { success: true, status: response.status, data: response.data };
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Unknown error calling log API";
    console.error(`[logging-middleware] API call failed: ${errMsg}`);
    // Graceful failure — don't crash the caller
    return { success: false, error: errMsg };
  }
}

export default Log;
