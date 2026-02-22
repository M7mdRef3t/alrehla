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

  void runStartupJob(
    () => import("../../ai/autoHealthCheck"),
    (mod) => mod.startAutoHealthCheck(),
    "Auto Health Check started",
    "Health Check init failed:",
    logger
  );

  void runStartupJob(
    () => import("../../ai/revenueAutomation"),
    (mod) => mod.startWeeklyRevenueAnalysis(),
    "Weekly Revenue Analysis started",
    "Revenue automation init failed:",
    logger
  );

  void runStartupJob(
    () => import("../../ai/emotionalPricingEngine"),
    (mod) => mod.startDailyEmotionalCheck(),
    "Emotional Pricing Engine started",
    "Emotional Pricing init failed:",
    logger
  );

  void runStartupJob(
    () => import("../../services/telegramBot"),
    (mod) => {
      mod.scheduleTelegramReports();
      void mod.telegramBot.notifySystemStartup();
    },
    "Telegram Bot connected",
    "Telegram Bot init failed:",
    logger
  );

  void runStartupJob(
    () => import("../../ai/consciousnessThemeEngine"),
    (mod) => mod.startConsciousnessTheme(),
    "Consciousness Theme Engine started",
    "Consciousness Theme init failed:",
    logger
  );
}
