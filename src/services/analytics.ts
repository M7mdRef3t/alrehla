import { isUserMode } from "@/config/appEnv";
import { runtimeEnv } from "@/config/runtimeEnv";
import Clarity from "@microsoft/clarity";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { getHref } from "./navigation";
import { getDocumentOrNull, getWindowOrNull, isClientRuntime } from "./clientRuntime";
import { supabase } from "./supabaseClient";
import { getStoredLeadAttribution, getStoredUtmParams } from "./marketingAttribution";
import { EcosystemSyncService } from "./ecosystem";
import { identifyUser } from "./monitoring";
import {
  buildAnalyticsEnvelope,
  buildIdentityLinkedEnvelope,
  buildPageViewEnvelope
} from "@/domains/analytics/contracts";

type AnalyticsValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsValue>;



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
  
  // Script loaded check
  if (windowRef.__dawayirMetaPixelScriptLoaded) return;

  // Prevent Meta Pixel from firing on localhost to avoid console error spam
  // "unavailable on this website due to it's traffic permission settings"
  if (windowRef.location.hostname === "localhost" || windowRef.location.hostname === "127.0.0.1") {
    return;
  }

  if (!windowRef.fbq) {
    /**
     * Official Meta Pixel Bootstrap (Logic Aligned)
     * We use a function that correctly captures arguments and pushes to a queue.
     * fbevents.js explicitly checks for .callMethod, .queue, .version, and .loaded.
     */
    const n = function(...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        (n.queue = n.queue || []).push(args);
      }
      return 0;
    } as any;

    if (!windowRef._fbq) windowRef._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    windowRef.fbq = n;
  }

  // Inject script
  loadScriptOnce("dawayir-meta-pixel-script", "https://connect.facebook.net/en_US/fbevents.js");

  // Initialize once per session/pixel
  if (!windowRef.__dawayirMetaPixelInitialized) {
    windowRef.fbq?.("init", pixelId);
    windowRef.__dawayirMetaPixelInitialized = true;
  }

  windowRef.__dawayirMetaPixelScriptLoaded = true;
}

export function sendGtagEvent(eventName: string, params?: Record<string, AnalyticsValue | null | undefined>): void {
  if (!isClientRuntime() || !isAnalyticsEnabled()) return;
  const safeParams = sanitizeAnalyticsParams(params);
  const windowRef = getWindowOrNull();
  if (windowRef?.gtag) {
    windowRef.gtag("event", eventName, safeParams);
  }
}

export function sendMetaEvent(
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

  const windowRef = getWindowOrNull();
  const documentRef = getDocumentOrNull();
  const isMobile = windowRef ? windowRef.matchMedia("(max-width: 768px)").matches : false;

  const pageViewPayload = buildPageViewEnvelope({
    client_event_id: generateUUID(),
    anonymous_id: getOrCreateAnonymousId(),
    session_id: getOrCreateSessionId(),
    lead_id: getStoredLeadAttribution()?.lead_id || null,
    lead_source: getStoredLeadAttribution()?.lead_source || null,
    utm_source: getStoredUtmParams()?.utm_source || null,
    utm_medium: getStoredUtmParams()?.utm_medium || null,
    utm_campaign: getStoredUtmParams()?.utm_campaign || null,
    payload: {
      page_title: pageName,
      pathname: windowRef?.location?.pathname || null,
      page_location: getHref(),
      referrer: documentRef?.referrer || null,
      device_type: isMobile ? "mobile" : "desktop",
      screen_width: windowRef?.innerWidth,
      viewport_height: windowRef?.innerHeight
    }
  });

  if (pageViewPayload) {
    void sendAnalyticsEnvelope(pageViewPayload);
    sendMetaEvent("PageView", {}, { bypassConsent: true, client_event_id: pageViewPayload.client_event_id ?? undefined });
  } else {
    void sendInternalAnalytics("page_view", {
    page_title: pageName,
    page_location: getHref()
    });
    const fallback_event_id = generateUUID();
    sendMetaEvent("PageView", {}, { bypassConsent: true, client_event_id: fallback_event_id });
  }

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

export function generateUUID(): string {
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

/**
 * Capture Microsoft Clarity Session ID if available.
 * Returns the short ID used in Clarity URLs: https://clarity.microsoft.com/projects/.../sessions/{shortId}
 */
export function getClaritySessionId(): string | null {
  const windowRef = getWindowOrNull() as any;
  if (!windowRef) return null;

  // Pattern 1: Official Metadata Callback (Best if already fired)
  // Since we need this synchronously for event tagging, we check the global queue or cookies
  
  // Pattern 2: Cookie extraction (Most reliable synchronous way)
  try {
    const documentRef = getDocumentOrNull();
    if (documentRef) {
      const match = documentRef.cookie.match(/_clsk=([^;]+)/);
      if (match) {
        // _clsk format: [sessionid]|[timestamp]|[sequence]|[pageid]|[etc]
        return match[1].split("|")[0];
      }
    }
  } catch (e) {
    // Cookie access denied
  }

  return null;
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
  const clarity_session_id = getClaritySessionId();
  
  const client_event_id = typeof params?.client_event_id === "string"
    ? params.client_event_id
    : generateUUID();

  const isMobile = windowRef ? windowRef.matchMedia("(max-width: 768px)").matches : false;
  const safeParams = sanitizeAnalyticsParams(params);

  const telemetryPayload = buildAnalyticsEnvelope({
    event_type: eventName,
    client_event_id,
    anonymous_id,
    session_id,
    lead_id: leadAttr?.lead_id || null,
    lead_source: leadAttr?.lead_source || null,
    utm_source: utm?.utm_source || null,
    utm_medium: utm?.utm_medium || null,
    utm_campaign: utm?.utm_campaign || null,
    payload: {
      ...(safeParams || {}),
      ...(clarity_session_id ? { clarity_session_id } : {}),
      pathname: windowRef?.location?.pathname || null,
      page_location: getHref(),
      referrer: documentRef?.referrer || null,
      device_type: isMobile ? "mobile" : "desktop",
      screen_width: windowRef?.innerWidth || null,
      viewport_height: windowRef?.innerHeight || null
    }
  });

  if (!telemetryPayload) {
    if (runtimeEnv.isDev) {
      console.warn(`[Analytics] Invalid internal payload blocked: ${eventName}`, params);
    }
    return;
  }

  const body = JSON.stringify(telemetryPayload);

  try {
    await sendAnalyticsEnvelope(telemetryPayload);
  } catch (error) {
    if (runtimeEnv.isDev) {
      console.warn(`[Analytics] Internal send failed: ${eventName}`, error);
    }
  }
}

let _analyticsEnvelopeQueue: any[] = [];
let _analyticsEnvelopeTimer: ReturnType<typeof setTimeout> | null = null;

async function sendAnalyticsEnvelope(envelope: ReturnType<typeof buildAnalyticsEnvelope> extends infer T ? Exclude<T, null> : never): Promise<void> {
  // Instead of sending immediately, push to a batch queue to mitigate 429 Too Many Requests
  _analyticsEnvelopeQueue.push(envelope);

  if (_analyticsEnvelopeTimer === null) {
    _analyticsEnvelopeTimer = setTimeout(() => {
      const batch = [..._analyticsEnvelopeQueue];
      _analyticsEnvelopeQueue = [];
      _analyticsEnvelopeTimer = null;

      // Grouping them into one bulk call or just sending the last one to save network?
      // For now, let's just send them individually but throttled, 
      // or if it's too much, just send the latest one if it's identical type, but to be safe:
      // Since the backend handles individual payloads, we will send them sequentially with a small delay
      // or just send the most recent one to prevent flooding
      if (batch.length > 0) {
        // Send only the first and last of a large batch to prevent 429, or send all if small
        const toSend = batch.length > 3 ? [batch[0], batch[batch.length - 1]] : batch;
        
        toSend.forEach((env, i) => {
          setTimeout(() => {
            fetch("/api/analytics", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(env),
              keepalive: true,
              credentials: "same-origin"
            }).catch(e => console.warn("Analytics flush error:", e));
          }, i * 300); // Stagger by 300ms
        });
      }
    }, 1000); // 1-second debounce window
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
    
    // 3) Forward to Microsoft Clarity for Smart Events & Funnels
    try {
      Clarity.event(eventName);
      
      // Professional Behavioral Tagging
      if (safeParams?.product) Clarity.setTag("recommended_product", String(safeParams.product));
      if (safeParams?.step_number) Clarity.setTag("diagnosis_step", String(safeParams.step_number));
      if (safeParams?.tier) Clarity.setTag("conversion_tier", String(safeParams.tier));
      
      // Engagement Anchors
      if (eventName === AnalyticsEvents.MIZAN_VIEW) Clarity.setTag("user_intent", "mizan_exploration");
      if (eventName === AnalyticsEvents.WIRD_VIEW) Clarity.setTag("user_intent", "wird_ritual");
      if (eventName === AnalyticsEvents.PAYMENT_PROOF_SUBMITTED) {
        Clarity.setTag("revenue_intent", "high");
        Clarity.setTag("payment_method", String(safeParams?.method || "unknown"));
      }

      // Sync Internal Session with Clarity
      const internalSession = getOrCreateSessionId();
      Clarity.setTag("dawayir_session", internalSession);
    } catch (e) {
      // Clarity non-critical
    }
  }

  // --- 3) Ecosystem Synchronization ---
  // Any significant event tracked in Dawayir should ping the Hub
  if (eventName === AnalyticsEvents.BASELINE_COMPLETED || eventName === AnalyticsEvents.NODE_ADDED) {
      EcosystemSyncService.updateSatelliteMetrics('dawayir', {
          last_activity_event: eventName,
          last_activity_time: new Date().toISOString()
      });
  }
}

export async function trackIdentityLinked(userId: string): Promise<void> {
  const anonymous_id = getOrCreateAnonymousId();
  const session_id = getOrCreateSessionId();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let authenticatedUserId: string | null = null;

  if (supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      authenticatedUserId = sessionData?.session?.user?.id ?? null;

      if (sessionData?.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }
    } catch (error) {
      if (runtimeEnv.isDev) {
        console.warn("[Analytics] Failed to read auth session for identity link", error);
      }
    }
  }

  if (runtimeEnv.isDev && authenticatedUserId && authenticatedUserId !== userId) {
    console.warn("[Analytics] trackIdentityLinked called with mismatched user id", {
      expected: authenticatedUserId,
      received: userId
    });
  }
  
  // 0) Identity Linking for Monitoring (Sentry / Clarity)
  identifyUser(userId);
  
  // 1) Internal Telemetry Link (API)
  const identityPayload = buildIdentityLinkedEnvelope({
    client_event_id: generateUUID(),
    anonymous_id,
    session_id
  });

  if (!identityPayload) {
    if (runtimeEnv.isDev) {
      console.warn("[Analytics] Invalid identity_linked payload blocked");
    }
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers,
    body: JSON.stringify(identityPayload),
    keepalive: true,
    credentials: "same-origin"
  }).catch((err) => {
    if (runtimeEnv.isDev) {
      console.warn("[Analytics] Internal telemetry link failed", err);
    }
  });

  // 2) Database Bridge Link (Supabase RPC) — only call if session is confirmed active
  if (supabase) {
    try {
      if (authenticatedUserId) {
        const { data: rpcRes, error } = await supabase.rpc("link_anonymous_to_user", {
          p_anonymous_id: anonymous_id
        });
        
        if (runtimeEnv.isDev) {
          if (error) console.error("[Analytics] RPC Link Error:", error);
          // console.log('[Analytics] Identity Link Result:', rpcRes);
        }
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
  ONBOARDING_STEP_COMPLETE: "onboarding_step_complete",
  ACTIVATION_VIEWED: "activation_viewed",
  PAYMENT_INTENT_SUBMITTED: "payment_intent_submitted",
  GATE_QUALIFIED: "gate_qualified",
  PAYMENT_PROOF_SUBMITTED: "payment_proof_submitted",
  ACTIVATION_UNLOCKED: "activation_unlocked",

  AUTH_GOOGLE_CLICKED: "auth_google_clicked",
  AUTH_PHONE_CLICKED: "auth_phone_clicked",
  AUTH_PHONE_OTP_SENT: "auth_phone_otp_sent",
  AUTH_PHONE_OTP_VERIFIED: "auth_phone_otp_verified",
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

  // --- AI Content Studio ---
  AI_STUDIO_OPENED: "ai_studio_opened",
  AI_STUDIO_GENERATED: "ai_studio_generated",
  AI_STUDIO_COPIED: "ai_studio_copied",
  AI_STUDIO_HISTORY_NAVIGATED: "ai_studio_history_navigated",

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

  // --- Payment Funnel Diagnostics (ARD-9) ---
  PAYMENT_METHOD_SELECTED: "payment_method_selected",
  PAYMENT_NUMBER_COPIED: "payment_number_copied",
  WHATSAPP_SUPPORT_CLICKED: "whatsapp_support_clicked",

  // --- External Attribution Persistence ---
  EXTERNAL_ID_SYNCED: "external_id_synced",

  // --- Mizan & Wird Instrumentation ---
  MIZAN_VIEW: "mizan_view",
  WIRD_VIEW: "wird_view",
  WIRD_MODE_CHANGE: "wird_mode_change",
  WIRD_RITUAL_COMPLETE: "wird_ritual_complete",
  WIRD_INTENTION_SAVE: "wird_intention_save",
  WIRD_GRATITUDE_SAVE: "wird_gratitude_save",

  // ─── Diagnosis & Conversion ────────────────
  DIAGNOSIS_VIEW: "diagnosis_view",
  DIAGNOSIS_STEP_COMPLETE: "diagnosis_step_complete",
  DIAGNOSIS_RESULT_VIEW: "diagnosis_result_view",
  CONVERSION_OFFER_VIEW: "conversion_offer_view",
  CONVERSION_OFFER_CLICKED: "conversion_offer_clicked",

  // ─── Onboarding Funnel ────────────────

  // ─── Professional Hardening (Phase 2) ────────────────
  SYSTEM_ERROR: "system_error",
  AHA_MOMENT: "aha_moment",
} as const;

/**
 * Persists the client_event_id for cross-component attribution (e.g. Onboarding -> Payment)
 */
export function setStoredClientEventId(id: string): void {
  setInLocalStorage("dawayir-client-event-id", id);
}

/**
 * Retrieves the persisted client_event_id
 */
export function getStoredClientEventId(): string | null {
  return getFromLocalStorage("dawayir-client-event-id");
}

function resolveEventId(params?: Record<string, AnalyticsValue | null | undefined>): string {
  return (params?.client_event_id as string) || getStoredClientEventId() || generateUUID();
}

export function trackLead(params?: Record<string, AnalyticsValue | null | undefined>): void {
  const safeParams = sanitizeAnalyticsParams(params);
  // trackEvent(AnalyticsEvents.LEAD_FORM_SUBMITTED, safeParams);
  sendGtagEvent("generate_lead", safeParams);

  const googleAdsSendTo = getGoogleAdsSendTo();
  if (googleAdsSendTo) {
    sendGtagEvent("conversion", { ...(safeParams ?? {}), send_to: googleAdsSendTo });
  }

  const client_event_id = resolveEventId(params);
  sendMetaEvent("Lead", safeParams, { bypassConsent: true, client_event_id });
}

/**
 * Fired when onboarding survey is finished (non-conversion, just state)
 */
export function trackOnboardingCompleted(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  const client_event_id = resolveEventId(params);
  trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, { ...safeParams, client_event_id });
  // We do NOT send Meta CompleteRegistration here anymore to keep it for actual revenue
}

export function trackCompleteRegistration(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  const client_event_id = resolveEventId(params);
  
  // P0: Restore internal parity so this shows up in Sovereign Funnel
  trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, { ...safeParams, client_event_id });
  
  sendGtagEvent("sign_up", safeParams);

  // Meta standard CompleteRegistration (Revenue-generating according to business logic)
  sendMetaEvent("CompleteRegistration", safeParams, { 
    bypassConsent: true, 
    client_event_id 
  });
}

export function trackPaymentProofSubmitted(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  const client_event_id = resolveEventId(params);

  // P0: This is the critical commitment event for the admin dashboard
  trackEvent(AnalyticsEvents.PAYMENT_PROOF_SUBMITTED, { ...safeParams, client_event_id });

  sendGtagEvent("payment_proof_submitted", safeParams);

  // For Meta, we treat this as a solid commitment (Purchase intent)
  sendMetaEvent("Purchase", {
    ...safeParams,
    currency: safeParams?.currency || "USD",
    value: safeParams?.value || 0,
    content_name: safeParams?.content_name || "Dawayir Premium"
  }, { bypassConsent: true, client_event_id });
}

export function trackCheckoutViewed(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  trackEvent(AnalyticsEvents.ACTIVATION_VIEWED, safeParams);
  const client_event_id = resolveEventId(params);
  sendMetaEvent("ViewContent", safeParams, { client_event_id });
}

export function trackAddPaymentInfo(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  trackEvent("add_payment_info", safeParams);
  const client_event_id = resolveEventId(params);
  sendMetaEvent("AddPaymentInfo", safeParams, { client_event_id });
}

export function trackActivationUnlocked(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  trackEvent(AnalyticsEvents.ACTIVATION_UNLOCKED, safeParams);
  const client_event_id = resolveEventId(params);
  sendMetaEvent("InitiateCheckout", safeParams, { client_event_id });
}

export function trackInitiateCheckout(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  trackEvent(AnalyticsEvents.PAYMENT_INTENT_SUBMITTED, safeParams);
  const client_event_id = resolveEventId(params);

  sendGtagEvent("begin_activation", safeParams);
  sendMetaEvent("InitiateCheckout", safeParams, { client_event_id });
}

export function trackPaymentMethodSelected(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  const client_event_id = resolveEventId(params);
  trackEvent(AnalyticsEvents.PAYMENT_METHOD_SELECTED, { ...safeParams, client_event_id });
}

export function trackPaymentNumberCopied(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  const client_event_id = resolveEventId(params);
  trackEvent(AnalyticsEvents.PAYMENT_NUMBER_COPIED, { ...safeParams, client_event_id });
}

export function trackWhatsAppSupportClicked(
  params?: Record<string, AnalyticsValue | null | undefined>
): void {
  const safeParams = sanitizeAnalyticsParams(params);
  const client_event_id = resolveEventId(params);
  trackEvent(AnalyticsEvents.WHATSAPP_SUPPORT_CLICKED, { ...safeParams, client_event_id });
}

/**
 * Tracks a critical JavaScript or Runtime error, linking it to Clarity recordings.
 */
export function trackError(error: Error | string, metadata?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  trackEvent(AnalyticsEvents.SYSTEM_ERROR, {
    error_message: message,
    error_stack: stack,
    ...metadata
  });

  // System Architect: Link mechanical failure to behavioral context
  if (isClientRuntime()) {
    try {
      Clarity.setTag("has_error", "true");
    } catch (e) { /* non-critical */ }
  }
}

/**
 * Tracks the "Aha! Moment" (First Spark / Value Delivery)
 */
export function trackAhaMoment(kind: string, metadata?: Record<string, unknown>): void {
  trackEvent(AnalyticsEvents.AHA_MOMENT, {
    aha_kind: kind,
    ...metadata
  });
}

/**
 * Specifically tags sessions with high revenue intent (cliking payment/premium)
 */
export function trackRevenueIntent(tier: string = "premium"): void {
  trackEvent(AnalyticsEvents.PREMIUM_UPGRADE_VIEWED, { tier });
  
  if (isClientRuntime()) {
    try {
      Clarity.setTag("revenue_intent", "high");
    } catch (e) { /* non-critical */ }
  }
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
    _fbq?: FbqFn;
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
