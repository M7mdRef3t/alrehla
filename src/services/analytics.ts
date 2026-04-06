import { isUserMode } from "../config/appEnv";
import { runtimeEnv } from "../config/runtimeEnv";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { getHref } from "./navigation";
import { getDocumentOrNull, getWindowOrNull, isClientRuntime } from "./clientRuntime";
import { supabase } from "./supabaseClient";
import { getStoredLeadAttribution, getStoredUtmParams } from "./marketingAttribution";

type AnalyticsValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsValue>;

// Circuit breaker: disable Supabase INSERT after first RLS/permission error
let supabaseTrackingEnabled = true;

// In-memory cache to prevent safeGetSession blocking inside telemetry
let inMemoryUserId: string | null = null;
if (isClientRuntime() && supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    inMemoryUserId = session?.user?.id || null;
  });
}

function isAnalyticsEnabled(): boolean {
  return getFromLocalStorage("dawayir-analytics-consent") === "true";
}

function getGAMeasurementId(): string | null {
  return runtimeEnv.gaMeasurementId || null;
}

function getGoogleAdsId(): string | null {
  return runtimeEnv.googleAdsId || null;
}

function getGoogleAdsLabel(): string | null {
  return runtimeEnv.googleAdsLabel || null;
}

function getGoogleAdsSendTo(): string | null {
  const adsId = getGoogleAdsId();
  const adsLabel = getGoogleAdsLabel();
  return adsId && adsLabel ? `${adsId}/${adsLabel}` : null;
}

function getMetaPixelId(): string | null {
  return runtimeEnv.metaPixelId || null;
}

function areMetaEventsEnabled(): boolean {
  return runtimeEnv.enableMetaEvents && Boolean(getMetaPixelId());
}

function getClarityProjectId(): string | null {
  return runtimeEnv.clarityProjectId || null;
}

function getContentSquareProjectId(): string | null {
  return runtimeEnv.contentsquareProjectId || null;
}

function getGtagBootstrapId(): string | null {
  return getGAMeasurementId() || getGoogleAdsId();
}

function sanitizeAnalyticsParams(
  params?: Record<string, AnalyticsValue | null | undefined>
): AnalyticsParams | undefined {
  if (!params) return undefined;

  const safeEntries = Object.entries(params).filter(([, value]) => {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  }) as Array<[string, AnalyticsValue]>;

  if (safeEntries.length === 0) return undefined;
  return Object.fromEntries(safeEntries);
}

function loadScriptOnce(scriptId: string, src: string): void {
  const documentRef = getDocumentOrNull();
  if (!documentRef) return;
  if (documentRef.getElementById(scriptId)) return;

  const script = documentRef.createElement("script");
  script.id = scriptId;
  script.async = true;
  script.src = src;
  documentRef.head.appendChild(script);
}

function ensureGtag(): void {
  const windowRef = getWindowOrNull();
  if (!windowRef) return;

  const bootstrapId = getGtagBootstrapId();
  if (!bootstrapId) return;

  loadScriptOnce("dawayir-gtag-script", `https://www.googletagmanager.com/gtag/js?id=${bootstrapId}`);

  if (!windowRef.gtag) {
    const dataLayer = (windowRef.dataLayer = windowRef.dataLayer || []);
    windowRef.gtag = (...args: unknown[]) => {
      dataLayer.push(args);
    };
    windowRef.gtag("js", new Date());
  }

  const measurementId = getGAMeasurementId();
  if (measurementId) {
    windowRef.gtag("config", measurementId, {
      anonymize_ip: true,
      cookie_flags: "SameSite=None;Secure"
    });
  }

  const googleAdsId = getGoogleAdsId();
  if (googleAdsId) {
    windowRef.gtag("config", googleAdsId);
  }
}

function ensureMetaPixel(): void {
  const windowRef = getWindowOrNull();
  const pixelId = getMetaPixelId();
  if (!windowRef || !pixelId || !areMetaEventsEnabled()) return;
  if (runtimeEnv.isDev && !getMetaPixelId()) return;
  if (windowRef.__dawayirMetaPixelScriptLoaded) return;

  if (!windowRef.fbq) {
    // Standard Meta Pixel bootstrap stub — must match the official snippet exactly.
    // fbevents.js checks for fbq existence on load; if it finds a non-standard stub
    // it emits the "conflicting versions" warning.
    const n = ((...args: unknown[]) => {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        (n.queue ??= []).push(args);
      }
    }) as FbqFn;
    n.push = n as unknown as (...args: unknown[]) => number;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    windowRef.fbq = n;
    if (!(windowRef as unknown as Record<string, unknown>)._fbq) {
      (windowRef as unknown as Record<string, unknown>)._fbq = n;
    }
  }

  loadScriptOnce("dawayir-meta-pixel-script", "https://connect.facebook.net/en_US/fbevents.js");

  if (!windowRef.__dawayirMetaPixelInitialized) {
    windowRef.fbq("init", pixelId);
    windowRef.__dawayirMetaPixelInitialized = true;
  }

  windowRef.__dawayirMetaPixelScriptLoaded = true;
}

function sendGtagEvent(eventName: string, params?: Record<string, AnalyticsValue | null | undefined>): void {
  if (!isClientRuntime() || !isAnalyticsEnabled()) return;
  const safeParams = sanitizeAnalyticsParams(params);
  const windowRef = getWindowOrNull();
  if (windowRef?.gtag) {
    windowRef.gtag("event", eventName, safeParams);
  }
}

function sendMetaEvent(
  eventName: string,
  params?: Record<string, AnalyticsValue | null | undefined>,
  options?: { bypassConsent?: boolean; client_event_id?: string }
): void {
  // P0: Always ensure Meta Pixel is initialized before sending ANY event
  ensureMetaPixel();

  // If bypassConsent is true, we allow the event even if the user hasn't explicitly accepted.
  // This is used for crucial top-of-funnel tracking (ViewContent, Lead) in Meta Ads.
  if (!options?.bypassConsent && !isAnalyticsEnabled()) {
    return;
  }
  
  const safeParams = sanitizeAnalyticsParams(params);
  const windowRef = getWindowOrNull();
  if (windowRef?.fbq) {
    const metaParams = {
      ...(safeParams ?? {}),
      ...(options?.client_event_id ? { external_id: options.client_event_id, event_id: options.client_event_id } : {})
    };
    windowRef.fbq("track", eventName, metaParams);
  }
}

export function initAnalytics(): void {
  if (!isClientRuntime()) return;
  
  // P0: Always ensure Meta Pixel is initialized for basic tracking (PageView/ViewContent)
  // regardless of full analytics consent, as long as Meta events are enabled.
  if (areMetaEventsEnabled()) {
    ensureMetaPixel();
  }

  if (!isUserMode || !isAnalyticsEnabled()) return;

  ensureGtag();

  const windowRef = getWindowOrNull();
  if (!windowRef) return;

  const clarityProjectId = getClarityProjectId();
  if (clarityProjectId) {
    if (!windowRef.clarity) {
      const clarity = ((...args: unknown[]) => {
        clarity.q = clarity.q || [];
        clarity.q.push(args);
      }) as ClarityFn;
      windowRef.clarity = clarity;
    }

    loadScriptOnce("dawayir-clarity-script", `https://www.clarity.ms/tag/${clarityProjectId}`);
  }

  const contentSquareProjectId = getContentSquareProjectId();
  if (contentSquareProjectId) {
    loadScriptOnce(
      "dawayir-contentsquare-script",
      `https://t.contentsquare.net/uxa/${contentSquareProjectId}.js`
    );
  }
}

export function trackPageView(pageName: string): void {
  if (!isClientRuntime()) return;

  void sendInternalAnalytics("page_view", {
    page_title: pageName,
    page_location: getHref()
  });

  if (isAnalyticsEnabled()) {
    sendGtagEvent("page_view", {
      page_title: pageName,
      page_location: getHref()
    });
  }
}

export function trackLandingView(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  if (!isClientRuntime()) return;

  const safeParams = sanitizeAnalyticsParams({
    content_name: "alrehla_landing",
    content_category: "landing",
    ...(params ?? {})
  });

  // P0: Ensure Meta Pixel is initialized before firing ViewContent
  ensureMetaPixel();

  const client_event_id = generateUUID();
  trackEvent(AnalyticsEvents.LANDING_VIEW, { ...safeParams, client_event_id });
  sendMetaEvent("ViewContent", safeParams, { bypassConsent: true, client_event_id });
}

export const ANALYTICS_ANON_KEY = "alrehla_anonymous_id";
export const ANALYTICS_SESSION_KEY = "alrehla_session_id";

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "anon_" + Math.random().toString(36).substring(2, 15);
}

export function getOrCreateAnonymousId(): string {
  if (!isClientRuntime()) return "";
  let id = getFromLocalStorage(ANALYTICS_ANON_KEY);
  if (!id) {
    id = generateUUID();
    setInLocalStorage(ANALYTICS_ANON_KEY, id);
  }
  return id;
}

export function getOrCreateSessionId(): string {
  const windowRef = getWindowOrNull();
  if (!windowRef) return generateUUID();

  let id = windowRef.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
  if (!id) {
    id = generateUUID();
    windowRef.sessionStorage.setItem(ANALYTICS_SESSION_KEY, id);
  }
  return id;
}

async function sendInternalAnalytics(
  eventName: string,
  params?: Record<string, AnalyticsValue | null | undefined>
): Promise<void> {
  if (!isClientRuntime()) return;

  const windowRef = getWindowOrNull();
  const documentRef = getDocumentOrNull();

  const leadAttr = getStoredLeadAttribution();
  const utm = getStoredUtmParams();

  const anonymous_id = getOrCreateAnonymousId();
  const session_id = getOrCreateSessionId();
  const client_event_id = generateUUID();

  const isMobile = windowRef ? windowRef.matchMedia("(max-width: 768px)").matches : false;
  const safeParams = sanitizeAnalyticsParams(params);

  const telemetryPayload = {
    event_type: eventName,
    client_event_id,
    anonymous_id,
    session_id,
    user_id: inMemoryUserId || null, // Synchronous enrichment, no blocking config
    lead_id: leadAttr?.lead_id || null,
    lead_source: leadAttr?.lead_source || null,
    utm_source: utm?.utm_source || null,
    utm_medium: utm?.utm_medium || null,
    utm_campaign: utm?.utm_campaign || null,
    occurred_at: new Date().toISOString(),
    payload: {
      ...(safeParams || {}),
      pathname: windowRef?.location?.pathname || null,
      page_location: getHref(),
      referrer: documentRef?.referrer || null,
      device_type: isMobile ? "mobile" : "desktop",
      screen_width: windowRef?.innerWidth,
      viewport_height: windowRef?.innerHeight
    }
  };

  const body = JSON.stringify(telemetryPayload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin"
    });
  } catch (error) {
    if (runtimeEnv.isDev) {
      console.warn(`[Analytics] Internal send failed: ${eventName}`, error);
    }
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  if (!isClientRuntime()) return;

  // 1) Internal telemetry always fires unconstrained by consent
  const client_event_id = (params?.client_event_id as string) || generateUUID();
  void sendInternalAnalytics(eventName, { ...params, client_event_id });

  // 2) Third-party only by policy/consent. (We enrich here manually for third-parties)
  const leadAttr = getStoredLeadAttribution();
  const utm = getStoredUtmParams();
  const attributionProps: Record<string, AnalyticsValue> = {};
  if (leadAttr?.lead_id) attributionProps.lead_id = leadAttr.lead_id;
  if (leadAttr?.lead_source) attributionProps.lead_source = leadAttr.lead_source;
  if (utm?.utm_source) attributionProps.utm_source = utm.utm_source;
  if (utm?.utm_campaign) attributionProps.utm_campaign = utm.utm_campaign;
  if (utm?.utm_medium) attributionProps.utm_medium = utm.utm_medium;

  const enrichedParams = Object.keys(attributionProps).length > 0
    ? { ...attributionProps, ...(params ?? {}) }
    : params;

  const safeParams = sanitizeAnalyticsParams(enrichedParams);

  if (isAnalyticsEnabled()) {
    const windowRef = getWindowOrNull();
    if (windowRef?.gtag) {
      windowRef.gtag("event", eventName, safeParams);
    }
  }
}

export async function trackIdentityLinked(userId: string): Promise<void> {
  const anonymous_id = getOrCreateAnonymousId();
  
  // 1) Internal Telemetry Link (API)
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "identity_linked",
      client_event_id: generateUUID(),
      anonymous_id,
      session_id: getOrCreateSessionId(),
      user_id: userId,
      occurred_at: new Date().toISOString(),
      payload: {}
    }),
    keepalive: true,
    credentials: "same-origin"
  });

  // 2) Database Bridge Link (Supabase RPC) — only call if session is confirmed active
  if (supabase) {
    try {
      // Verify we have an active session before calling SECURITY DEFINER function
      // to prevent 400 errors when auth.uid() is null due to timing
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        await supabase.rpc("link_anonymous_to_user", {
          p_anonymous_id: anonymous_id
        });
      }
    } catch (error) {
      if (runtimeEnv.isDev) {
        console.warn("[Analytics] Database identity bridge failed", error);
      }
    }
  }
}

export const AnalyticsEvents = {
  PAGE_VIEW: "page_view",
  MICRO_COMPASS_OPENED: "micro_compass_opened",
  MICRO_COMPASS_COMPLETED: "micro_compass_completed",
  LANDING_VIEW: "landing_view",
  CTA_CLICK: "cta_click",
  SANCTUARY_LOADED: "sanctuary_loaded",
  FIRST_PULSE_SUBMITTED: "first_pulse_submitted",

  JOURNEY_STARTED: "journey_started",
  GOAL_SELECTED: "goal_selected",
  PERSON_ADDED: "person_added",
  BASELINE_COMPLETED: "baseline_completed",
  NODE_ADDED: "node_added",
  AI_CHAT_USED: "ai_chat_used",
  BREATHING_OPENED: "breathing_opened",
  EMERGENCY_OPENED: "emergency_opened",

  // --- Consciousness Architecture (v1.0) Events ---
  SHADOW_PULSE_SNAPSHOT: "shadow_pulse_snapshot",
  PUNITIVE_FEEDBACK_GIVEN: "punitive_feedback_given",
  MUTEX_LOCK_ACTIVE: "mutex_lock_active",

  LEAD_FORM_SUBMITTED: "lead_form_submitted",
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ACTIVATION_VIEWED: "activation_viewed",
  PAYMENT_INTENT_SUBMITTED: "payment_intent_submitted",

  AUTH_GOOGLE_CLICKED: "auth_google_clicked",
  AUTH_MODAL_SHOWN: "auth_modal_shown",
  AUTH_COMPLETED: "auth_completed",
  MERGE_SUCCESS: "merge_success",

  BREATHING_USED: "breathing_exercise_used",
  EMERGENCY_USED: "emergency_button_used",
  LIBRARY_OPENED: "library_opened",
  EXPORT_DATA: "data_exported",
  AI_ATTEMPT_GUEST: "ai_attempt_guest",

  NOISE_SILENCING_OPENED: "noise_silencing_opened",
  SHIELD_SELECTOR_OPENED: "shield_selector_opened",
  RADAR_SHIELD_OPENED: "radar_shield_opened",
  THOUGHT_SNIPER_OPENED: "thought_sniper_opened",
  FASTING_CAPSULE_OPENED: "fasting_capsule_opened",
  INNER_COURT_OPENED: "inner_court_opened",

  TRAINING_COMPLETED: "training_completed",
  STEP_COMPLETED: "recovery_step_completed",

  CONSENT_GIVEN: "consent_given",
  CONSENT_DENIED: "consent_denied",

  HESITATION: "hesitation",
  HESITATION_HEARTBEAT: "hesitation_heartbeat",

  SURVEY_QUESTION_ANSWERED: "survey_question_answered",
  PREMIUM_UPGRADE_VIEWED: "premium_upgrade_viewed",

  // --- Weather Forecast Funnel (Viral Loop V2) ---
  WEATHER_LANDING_VIEW: "weather_landing_view",
  WEATHER_START_CLICKED: "weather_start_clicked",
  WEATHER_Q1_VIEW: "weather_q1_view",
  WEATHER_Q1_ANSWERED: "weather_q1_answered",
  WEATHER_Q2_VIEW: "weather_q2_view",
  WEATHER_Q2_ANSWERED: "weather_q2_answered",
  WEATHER_Q3_VIEW: "weather_q3_view",
  WEATHER_Q3_ANSWERED: "weather_q3_answered",
  WEATHER_RESULT_VIEW: "weather_result_view",
  WEATHER_SHARE_CLICKED: "weather_share_clicked",
  WEATHER_SHARE_COMPLETED: "weather_share_completed",
  WEATHER_SHARE_FAILED: "weather_share_failed",
  WEATHER_ONBOARDING_CLICKED: "weather_onboarding_clicked",
  WEATHER_WHATSAPP_CLICKED: "weather_whatsapp_clicked",
} as const;

export function trackLead(params?: Record<string, AnalyticsValue | null | undefined>): void {
  const safeParams = sanitizeAnalyticsParams(params);
  trackEvent(AnalyticsEvents.LEAD_FORM_SUBMITTED, safeParams);
  sendGtagEvent("generate_lead", safeParams);

  const googleAdsSendTo = getGoogleAdsSendTo();
  if (googleAdsSendTo) {
    sendGtagEvent("conversion", { ...(safeParams ?? {}), send_to: googleAdsSendTo });
  }

  const client_event_id = (params?.client_event_id as string) || generateUUID();
  sendMetaEvent("Lead", safeParams, { bypassConsent: true, client_event_id });
}

export function trackCompleteRegistration(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, safeParams);
  sendGtagEvent("sign_up", safeParams);
  sendMetaEvent("CompleteRegistration", safeParams, { bypassConsent: true });
}

export function trackCheckoutViewed(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  trackEvent(AnalyticsEvents.ACTIVATION_VIEWED, safeParams);
  sendMetaEvent("ViewContent", safeParams);
}

export function trackInitiateCheckout(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  trackEvent(AnalyticsEvents.PAYMENT_INTENT_SUBMITTED, safeParams);
  sendGtagEvent("begin_activation", safeParams);
  sendMetaEvent("InitiateCheckout", safeParams);
}

export function setAnalyticsConsent(consent: boolean): void {
  setInLocalStorage("dawayir-analytics-consent", String(consent));

  if (consent) {
    initAnalytics();
  }
}

export function getAnalyticsConsent(): boolean {
  return getFromLocalStorage("dawayir-analytics-consent") === "true";
}

export function getAnalyticsDiagnostics(context: string = "analytics") {
  const windowRef = getWindowOrNull();
  return {
    context,
    userMode: isUserMode,
    analyticsConsent: getAnalyticsConsent(),
    metaPixelIdPresent: Boolean(getMetaPixelId()),
    metaEventsEnabled: areMetaEventsEnabled(),
    fbqPresent: Boolean(windowRef?.fbq),
    fbqInitialized: Boolean(windowRef?.__dawayirMetaPixelInitialized),
    fbqScriptLoaded: Boolean(windowRef?.__dawayirMetaPixelScriptLoaded),
    gtagPresent: Boolean(windowRef?.gtag)
  };
}

export function logAnalyticsDiagnostics(context: string = "analytics"): void {
  if (!runtimeEnv.isDev || !isClientRuntime()) return;
  if (!runtimeEnv.supabaseUrl || !runtimeEnv.supabaseAnonKey) return;
  const diagnostics = getAnalyticsDiagnostics(context);
  console.table(diagnostics);
}

declare global {
  interface Window {
    __dawayirMetaPixelInitialized?: boolean;
    __dawayirMetaPixelScriptLoaded?: boolean;
    dataLayer: unknown[];
    fbq?: FbqFn;
    gtag?: (...args: unknown[]) => void;
    clarity?: ClarityFn;
  }
}

type FbqFn = ((...args: unknown[]) => void) & {
  queue?: unknown[][];
  push?: (...args: unknown[]) => number;
  loaded?: boolean;
  version?: string;
  callMethod?: (...args: unknown[]) => void;
};

type ClarityFn = ((...args: unknown[]) => void) & {
  q?: unknown[][];
};
