/**
 * Analytics Service - تتبع بسيط للأحداث
 * 
 * يدعم:
 * - Google Analytics 4
 * - Microsoft Clarity
 * - ContentSquare
 * - Custom events للـ debugging
 * - Opt-out للخصوصية
 */
import { isUserMode } from "../config/appEnv";
import { runtimeEnv } from "../config/runtimeEnv";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { getHref } from "./navigation";
import { getDocumentOrNull, getWindowOrNull, isClientRuntime } from "./clientRuntime";
import { supabase, isSupabaseReady } from "./supabaseClient";

// Check if analytics is enabled
function isAnalyticsEnabled(): boolean {
  const consent = getFromLocalStorage("dawayir-analytics-consent");
  return consent === "true";
}

// Get GA Measurement ID from env
function getGAMeasurementId(): string | null {
  return runtimeEnv.gaMeasurementId || null;
}

// Get Microsoft Clarity project ID from env
function getClarityProjectId(): string | null {
  return runtimeEnv.clarityProjectId || null;
}

// Get ContentSquare project ID from env
function getContentSquareProjectId(): string | null {
  return runtimeEnv.contentsquareProjectId || null;
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

// Initialize GA4
export function initAnalytics(): void {
  if (!isClientRuntime()) return;
  if (!isUserMode || !isAnalyticsEnabled()) return;
  const windowRef = getWindowOrNull();
  if (!windowRef) return;

  const measurementId = getGAMeasurementId();
  if (measurementId) {
    loadScriptOnce("dawayir-ga4-script", `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);

    // Initialize gtag
    const dataLayer = (windowRef.dataLayer = windowRef.dataLayer || []);
    function gtag(...args: unknown[]) {
      dataLayer.push(args);
    }
    gtag("js", new Date());
    gtag("config", measurementId, {
      anonymize_ip: true,
      cookie_flags: "SameSite=None;Secure"
    });

    // Store gtag function globally
    windowRef.gtag = gtag;
  }

  const clarityProjectId = getClarityProjectId();
  if (clarityProjectId) {
    if (!windowRef.clarity) {
      const clarity = ((...args: unknown[]) => {
        clarity.q = clarity.q || [];
        clarity.q.push(args);
      }) as ClarityFn;
      windowRef.clarity = clarity;
    }

    loadScriptOnce(
      "dawayir-clarity-script",
      `https://www.clarity.ms/tag/${clarityProjectId}`
    );
  }

  const contentSquareProjectId = getContentSquareProjectId();
  if (contentSquareProjectId) {
    loadScriptOnce(
      "dawayir-contentsquare-script",
      `https://t.contentsquare.net/uxa/${contentSquareProjectId}.js`
    );
  }
}

// Track page view
export function trackPageView(pageName: string): void {
  if (!isClientRuntime()) return;
  if (!isAnalyticsEnabled()) return;

  const windowRef = getWindowOrNull();
  if (windowRef?.gtag) {
    windowRef.gtag("event", "page_view", {
      page_title: pageName,
      page_location: getHref()
    });
  }

}

// Track custom event
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!isClientRuntime()) return;

  // GA4/External tracking requires consent
  if (isAnalyticsEnabled()) {
    const windowRef = getWindowOrNull();
    if (windowRef?.gtag) {
      windowRef.gtag("event", eventName, params);
    }
  }

  // Internal tracking - Zero Friction (Non-blocking)
  if (isSupabaseReady && supabase) {
    const windowRef = getWindowOrNull();
    const isMobile = windowRef ? windowRef.matchMedia("(max-width: 768px)").matches : false;
    const deviceContext = {
      device_type: isMobile ? 'mobile' : 'desktop',
      screen_width: windowRef?.innerWidth,
      platform: windowRef?.navigator?.platform
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      supabase!.from('routing_events').insert({
        event_type: eventName,
        user_id: session?.user?.id || null, // null means guest
        payload: { ...deviceContext, ...(params || {}) },
        occurred_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error && runtimeEnv.isDev) {
          console.warn(`[Analytics] Internal track failed: ${eventName}`, error);
        }
      });
    });
  }
}

// Predefined events
export const AnalyticsEvents = {
  // Navigation
  PAGE_VIEW: "page_view",
  LANDING_VIEW: "landing_view",
  CTA_CLICK: "cta_click",
  SANCTUARY_LOADED: "sanctuary_loaded",
  FIRST_PULSE_SUBMITTED: "first_pulse_submitted",

  // Journey events
  JOURNEY_STARTED: "journey_started",
  GOAL_SELECTED: "goal_selected",
  PERSON_ADDED: "person_added",
  BASELINE_COMPLETED: "baseline_completed",

  // Conversion (micro-commitment)
  MICRO_COMPASS_OPENED: "micro_compass_opened",
  MICRO_COMPASS_COMPLETED: "micro_compass_completed",
  AUTH_GOOGLE_CLICKED: "auth_google_clicked",
  AUTH_MODAL_SHOWN: "auth_modal_shown",
  AUTH_COMPLETED: "auth_completed",
  MERGE_SUCCESS: "merge_success",

  // Feature usage
  BREATHING_USED: "breathing_exercise_used",
  EMERGENCY_USED: "emergency_button_used",
  LIBRARY_OPENED: "library_opened",
  EXPORT_DATA: "data_exported",
  AI_ATTEMPT_GUEST: "ai_attempt_guest",

  // Tactical Features (Phase 2 & 3)
  NOISE_SILENCING_OPENED: "noise_silencing_opened",
  SHIELD_SELECTOR_OPENED: "shield_selector_opened",
  RADAR_SHIELD_OPENED: "radar_shield_opened",
  THOUGHT_SNIPER_OPENED: "thought_sniper_opened",
  FASTING_CAPSULE_OPENED: "fasting_capsule_opened",
  INNER_COURT_OPENED: "inner_court_opened",

  // Engagement
  TRAINING_COMPLETED: "training_completed",
  STEP_COMPLETED: "recovery_step_completed",
  AI_CHAT_USED: "ai_chat_used",

  // Consent events
  CONSENT_GIVEN: "consent_given",
  CONSENT_DENIED: "consent_denied",

  // Behavioral signals
  HESITATION: "hesitation",
  HESITATION_HEARTBEAT: "hesitation_heartbeat"
} as const;

// Analytics consent management
export function setAnalyticsConsent(consent: boolean): void {
  setInLocalStorage("dawayir-analytics-consent", String(consent));

  if (consent) {
    initAnalytics();
  }
}

export function getAnalyticsConsent(): boolean {
  return getFromLocalStorage("dawayir-analytics-consent") === "true";
}

// Extend window type for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    clarity?: ClarityFn;
  }
}

type ClarityFn = ((...args: unknown[]) => void) & {
  q?: unknown[][];
};
