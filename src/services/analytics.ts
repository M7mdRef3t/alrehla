import { isUserMode } from "../config/appEnv";
import { runtimeEnv } from "../config/runtimeEnv";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { getHref } from "./navigation";
import { getDocumentOrNull, getWindowOrNull, isClientRuntime } from "./clientRuntime";
import { supabase, isSupabaseReady, isSupabaseAbortError, safeGetSession } from "./supabaseClient";
import { getStoredLeadAttribution, getStoredUtmParams } from "./marketingAttribution";

type AnalyticsValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsValue>;

// Circuit breaker: disable Supabase INSERT after first RLS/permission error
let supabaseTrackingEnabled = true;

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
  if (runtimeEnv.isDev && !areMetaEventsEnabled()) return;
  if (windowRef.__dawayirMetaPixelScriptLoaded) return;

  if (!windowRef.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (typeof fbq.callMethod === "function") {
        fbq.callMethod(...args);
        return;
      }
      fbq.queue = fbq.queue || [];
      fbq.queue.push(args);
    }) as FbqFn;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    windowRef.fbq = fbq;
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
  options?: { bypassConsent?: boolean }
): void {
  const bypassConsent = options?.bypassConsent === true;
  if (!isClientRuntime() || !areMetaEventsEnabled()) return;
  if (runtimeEnv.isDev && !areMetaEventsEnabled()) return;
  if (!bypassConsent && !runtimeEnv.isProd && !isAnalyticsEnabled()) return; // Allow dev if enabled, but check consent if not bypass anyway
  if (!bypassConsent && !isAnalyticsEnabled()) return;
  const safeParams = sanitizeAnalyticsParams(params);
  const windowRef = getWindowOrNull();
  if (windowRef?.fbq) {
    windowRef.fbq("track", eventName, safeParams ?? {});
  }
}

export function initAnalytics(): void {
  if (!isClientRuntime()) return;
  if (!isUserMode || !isAnalyticsEnabled()) return;

  ensureGtag();
  ensureMetaPixel();

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
  if (!isAnalyticsEnabled()) return;

  sendGtagEvent("page_view", {
    page_title: pageName,
    page_location: getHref()
  });
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

  trackEvent(AnalyticsEvents.LANDING_VIEW, safeParams);
  sendMetaEvent("ViewContent", safeParams, { bypassConsent: true });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  if (!isClientRuntime()) return;

  // P0-3: Auto-inject lead attribution so every event carries lead_id + UTM
  // getStoredLeadAttribution() reads from localStorage — set when user arrives via personalized URL
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

  if (isSupabaseReady && supabase && supabaseTrackingEnabled) {
    const windowRef = getWindowOrNull();
    const isMobile = windowRef ? windowRef.matchMedia("(max-width: 768px)").matches : false;
    const deviceContext = {
      device_type: isMobile ? "mobile" : "desktop",
      screen_width: windowRef?.innerWidth,
      platform: windowRef?.navigator?.platform
    };

    safeGetSession().then((session) => {
      if (!session) {
        return; // GUARD: If no session, we cannot track routing events in Supabase due to RLS.
      }
      
      supabase!
        .from("routing_events")
        .insert({
          event_type: eventName,
          user_id: session?.user?.id || null,
          lead_id: leadAttr?.lead_id || null,
          lead_source: leadAttr?.lead_source || null,
          utm_source: utm?.utm_source || null,
          utm_medium: utm?.utm_medium || null,
          utm_campaign: utm?.utm_campaign || null,
          payload: { ...deviceContext, ...(safeParams || {}) },
          occurred_at: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error && !isSupabaseAbortError(error)) {
            // RLS or permission errors → disable for rest of session to stop console spam
            const status = (error as any).status;
            if (error.code === "42501" || error.code === "42P01" || status === 401) {
              supabaseTrackingEnabled = false;
            }
            if (runtimeEnv.isDev) {
              console.warn(`[Analytics] Internal track failed: ${eventName}`, error);
            }
          }
        });
    }).catch((err: unknown) => {
      if (!isSupabaseAbortError(err) && runtimeEnv.isDev) {
        console.warn(`[Analytics] getSession failed for ${eventName}`, err);
      }
    });
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

  SURVEY_OPENED: "survey_opened",
  SURVEY_COMPLETED: "survey_completed",
  SURVEY_QUESTION_ANSWERED: "survey_question_answered"
} as const;

export function trackLead(params?: Record<string, AnalyticsValue | null | undefined>): void {
  const safeParams = sanitizeAnalyticsParams(params);
  trackEvent(AnalyticsEvents.LEAD_FORM_SUBMITTED, safeParams);
  sendGtagEvent("generate_lead", safeParams);

  const googleAdsSendTo = getGoogleAdsSendTo();
  if (googleAdsSendTo) {
    sendGtagEvent("conversion", { ...(safeParams ?? {}), send_to: googleAdsSendTo });
  }

  sendMetaEvent("Lead", safeParams, { bypassConsent: true });
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
  loaded?: boolean;
  version?: string;
  callMethod?: (...args: unknown[]) => void;
};

type ClarityFn = ((...args: unknown[]) => void) & {
  q?: unknown[][];
};
