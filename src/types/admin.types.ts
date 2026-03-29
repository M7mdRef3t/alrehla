export interface OpsInsights {
  generatedAt: string;
  totals: {
    profiles: number;
    userState: number;
    eventsTotal: number;
    mapsTotal: number;
    sessions30d: number;
  };
  activity: {
    events1d: number;
    events7d: number;
    events30d: number;
  };
  comparisons: {
    events1dDelta: number;
    events7dDelta: number;
  };
  journey: {
    nodeAdded: number;
    pathStarted: number;
    taskCompleted: number;
  };
  tracking: {
    identified: number;
    anonymous: number;
    identifiedRate: number;
  };
  segments: {
    byMode: Array<{ key: string; count: number }>;
    byChannel: Array<{ key: string; count: number }>;
    byDevice: Array<{ key: string; count: number }>;
  };
  cohort: {
    newSessions30d: number;
    retained7d: number;
    retained30d: number;
    activationRate: number;
  };
  funnel: {
    landingViewed: number;
    startClicked: number;
    addPersonOpened: number;
    addPersonDone: number;
    startPathCTA: number;
  };
  alerts: Array<{
    level: "critical" | "warning" | "info";
    code: string;
    title: string;
    metric: number;
    threshold: number;
  }>;
}

export interface ExecutiveReport {
  generatedAt: string;
  kpis: {
    events24h: number;
    pathStarted24h: number;
    nodesAdded24h: number;
    mapsTotal: number;
    addPersonCompletionRate: number;
    retention7d: number;
    startRate?: number;
    pulseCompletionRate?: number;
    conversionRate?: number;
    premiumUsersCount?: number;
  };
  attribution: {
    topSources: Array<{ key: string; count: number }>;
    topMediums: Array<{ key: string; count: number }>;
    topCampaigns: Array<{ key: string; count: number }>;
    installClicked: number;
  };
  reliability: {
    status: "healthy" | "warning";
    alerts: string[];
  };
  recommendedActions: string[];
  consciousRevenue?: {
    averageConsciousnessLevel: number;
    revenueSignal: number;
    alignmentScore: number;
    status: "strong" | "watch" | "critical";
    note: string;
  };
}

export interface SystemHealthReport {
  generatedAt: string;
  status: "healthy" | "degraded";
  probe: {
    supabaseReachable: boolean;
    supabaseProbeMs: number;
  };
  api: {
    uptimeSec: number;
    requests: number;
    errors: number;
    errorRate: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    lastErrorAt: string | null;
  };
}

export interface SecuritySignalsReport {
  generatedAt: string;
  status: "healthy" | "warning" | "critical";
  config: {
    adminSecretStrong: boolean;
    serviceRoleConfigured: boolean;
    secureTransportConfigured: boolean;
  };
  metrics: {
    authFailed15m: number;
    authRateLimited15m: number;
    adminErrors15m: number;
  };
  incidents: Array<{
    action: string;
    createdAt: string;
    payload: Record<string, unknown>;
  }>;
  warnings: string[];
}

export interface WeeklyReport {
  windowDays?: 7 | 14 | 30;
  from: string;
  to: string;
  totalEvents: number;
  uniqueSessions: number;
  typeCounts: Record<string, number>;
  dailySeries: Array<{ date: string; count: number }>;
  topSessions: Array<{ sessionId: string; total: number }>;
  affiliate?: {
    linkExposed: number;
    linkClicked: number;
    ctr: number;
    topDomains: Array<{
      domain: string;
      exposed: number;
      clicked: number;
      ctr: number;
    }>;
    variants?: Array<{
      variant: string;
      exposed: number;
      clicked: number;
      ctr: number;
    }>;
    topMissions?: Array<{
      missionKey: string;
      missionLabel: string;
      ring: string;
      exposed: number;
      clicked: number;
      ctr: number;
    }>;
  };
  conversionFunnel?: {
    landingViewed: number;
    ctaFreeClicked: number;
    ctaActivationClicked: number;
    activationPageViewed: number;
    paymentSuccess: number;
    paymentFailed: number;
    freeCtaRatePct: number;
    activationIntentRatePct: number;
    activationViewRatePct: number;
    paymentSuccessRatePct: number;
  };
  funnelDailySeries?: Array<{
    date: string;
    landingViewed: number;
    ctaFreeClicked: number;
    ctaActivationClicked: number;
    activationPageViewed: number;
    paymentSuccess: number;
    paymentFailed: number;
    paymentSuccessRatePct: number;
  }>;
  oneDecision?: {
    code: string;
    title: string;
    action: string;
    metric: string;
  };
  gate7?: {
    windowHours: number;
    pathStarted48h: number;
    trafficEvents48h?: number;
    trafficSessions48h?: number;
    trafficBaselineMet?: boolean;
    minEvents48h?: number;
    minSessions48h?: number;
    status: "ok" | "critical";
    code: string;
  };
  consciousRevenue?: {
    averageConsciousnessLevel: number;
    revenueSignal: number;
    alignmentScore: number;
    status: "strong" | "watch" | "critical";
    note: string;
  };
}

export interface CronReportResponse {
  ok: boolean;
  period: "daily" | "weekly";
  generatedAt?: string;
  reportGeneratedAt?: string | null;
}
