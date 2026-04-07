import { runtimeEnv } from "@/config/runtimeEnv";

type ConsoleMethod = "log" | "warn" | "error";

function shouldSilence(message: unknown): boolean {
  if (!runtimeEnv.isDev) return false;
  if (typeof message !== "string") return false;

  return (
    message.includes("[STRESS TEST]") ||
    message.includes("Auto Health Check started") ||
    message.includes("Weekly Revenue Analysis started") ||
    message.includes("Emotional Pricing Engine started") ||
    message.includes("Telegram Bot not configured") ||
    message.includes("[Telegram Bot Disabled]") ||
    message.includes("Sovereign Override") ||
    message.includes("Health check complete") ||
    message.includes("Running health check") ||
    message.includes("Running weekly revenue analysis") ||
    message.includes("Running daily emotional check")
  );
}

export function aiLog(method: ConsoleMethod, ...args: unknown[]): void {
  const [first] = args;
  if (shouldSilence(first)) return;
  console[method](...args);
}

