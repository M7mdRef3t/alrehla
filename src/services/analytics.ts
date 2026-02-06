/**
 * Analytics Service - تتبع بسيط للأحداث
 * 
 * يدعم:
 * - Google Analytics 4
 * - Custom events للـ debugging
 * - Opt-out للخصوصية
 */

// Check if analytics is enabled
function isAnalyticsEnabled(): boolean {
  const consent = localStorage.getItem("dawayir-analytics-consent");
  return consent === "true";
}

// Get GA Measurement ID from env
function getGAMeasurementId(): string | null {
  return import.meta.env.VITE_GA_MEASUREMENT_ID || null;
}

// Initialize GA4
export function initAnalytics(): void {
  const measurementId = getGAMeasurementId();
  if (!measurementId || !isAnalyticsEnabled()) return;

  // Load gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", measurementId, {
    anonymize_ip: true,
    cookie_flags: "SameSite=None;Secure"
  });

  // Store gtag function globally
  window.gtag = gtag;
}

// Track page view
export function trackPageView(pageName: string): void {
  if (!isAnalyticsEnabled()) return;
  
  if (window.gtag) {
    window.gtag("event", "page_view", {
      page_title: pageName,
      page_location: window.location.href
    });
  }
  
  // Dev logging
  if (import.meta.env.DEV) {
    console.warn(`[Analytics] Page: ${pageName}`);
  }
}

// Track custom event
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!isAnalyticsEnabled()) return;
  
  if (window.gtag) {
    window.gtag("event", eventName, params);
  }
  
  // Dev logging
  if (import.meta.env.DEV) {
    console.warn(`[Analytics] Event: ${eventName}`, params);
  }
}

// Predefined events
export const AnalyticsEvents = {
  // Journey events
  JOURNEY_STARTED: "journey_started",
  GOAL_SELECTED: "goal_selected",
  PERSON_ADDED: "person_added",
  BASELINE_COMPLETED: "baseline_completed",
  
  // Feature usage
  BREATHING_USED: "breathing_exercise_used",
  EMERGENCY_USED: "emergency_button_used",
  LIBRARY_OPENED: "library_opened",
  EXPORT_DATA: "data_exported",
  
  // Engagement
  TRAINING_COMPLETED: "training_completed",
  STEP_COMPLETED: "recovery_step_completed",
  AI_CHAT_USED: "ai_chat_used"
} as const;

// Analytics consent management
export function setAnalyticsConsent(consent: boolean): void {
  localStorage.setItem("dawayir-analytics-consent", String(consent));
  
  if (consent) {
    initAnalytics();
  }
}

export function getAnalyticsConsent(): boolean {
  return localStorage.getItem("dawayir-analytics-consent") === "true";
}

// Extend window type for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
