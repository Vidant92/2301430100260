import axios from "axios";

type Stack = "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type PackageName =
  | "api" | "component" | "hook" | "page" | "state" | "style"
  | "auth" | "config" | "middleware" | "utils";

export async function Log(
  stack: Stack,
  level: Level,
  packageName: PackageName,
  message: string
): Promise<void> {
  console.log(`[${stack.toUpperCase()}][${level.toUpperCase()}][${packageName}] ${message}`);

  const apiUrl = import.meta.env.VITE_LOG_API_URL as string | undefined;
  const token = import.meta.env.VITE_ACCESS_TOKEN as string | undefined;

  if (!apiUrl) return;

  try {
    await axios.post(
      apiUrl,
      { stack, level, package: packageName, message },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 5000,
      }
    );
  } catch {
    // Graceful failure
  }
}
