import { runtimeEnv } from "../config/runtimeEnv";

type LogTarget = Pick<Console, "warn">;

interface StartupJobsOptions {
  enabled: boolean;
  logger?: LogTarget;
}

async function runStartupJob<TModule>(
  loader: () => Promise<TModule>,
  onLoaded: (module: TModule) => void,
  successMessage: string,
  failureMessage: string,
  logger: LogTarget
): Promise<void> {
  try {
    const mod = await loader();
    onLoaded(mod);
    logger.warn(successMessage);
  } catch (err) {
    logger.warn(failureMessage, err);
  }
}

export function startAutonomousStartupJobs({ enabled, logger = console }: StartupJobsOptions): void {
  if (!enabled || typeof window === "undefined") return;
  if (runtimeEnv.isDev) return;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. Health Check (Immediate)
  void runStartupJob(
    () => import("../ai/autoHealthCheck"),
    (mod) => mod.startAutoHealthCheck(),
    "Auto Health Check started",
    "Health Check init failed:",
    logger
  );

  // 1.5 Sovereign Override (Immediate - Critical)
  void runStartupJob(
    () => import("../ai/sovereignOverride"),
    (mod) => mod.checkSovereignOverride(),
    "Sovereign Override Check completed",
    "Sovereign Override check failed:",
    logger
  );

  // 2. Revenue Automation (Delay 1.5s)
  void sleep(1500).then(() => 
    runStartupJob(
      () => import("../ai/revenueAutomation"),
      (mod) => mod.startWeeklyRevenueAnalysis(),
      "Weekly Revenue Analysis started",
      "Revenue automation init failed:",
      logger
    )
  );

  // 3. Emotional Pricing (Delay 3s)
  void sleep(3000).then(() => 
    runStartupJob(
      () => import("../ai/emotionalPricingEngine"),
      (mod) => mod.startDailyEmotionalCheck(),
      "Emotional Pricing Engine started",
      "Emotional Pricing init failed:",
      logger
    )
  );

  // 4. Telegram & Notifications (Delay 4.5s)
  void sleep(4500).then(() => 
    runStartupJob(
      () => import("../services/telegramBot"),
      (mod) => {
        mod.scheduleTelegramReports();
        void mod.telegramBot.notifySystemStartup();
      },
      "Telegram Bot connected",
      "Telegram Bot init failed:",
      logger
    )
  );

  // 5. Consciousness Theme (Delay 6s)
  // This one is visual, let's keep it later to avoid initial layout shifts
  void sleep(6000).then(() => 
    runStartupJob(
      () => import("../ai/consciousnessThemeEngine"),
      (mod) => mod.startConsciousnessTheme(),
      "Consciousness Theme Engine started",
      "Consciousness Theme init failed:",
      logger
    )
  );
}
