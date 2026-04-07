import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/appEnv", () => ({
  isUserMode: true
}));

vi.mock("../config/runtimeEnv", () => ({
  runtimeEnv: {
    gaMeasurementId: null,
    googleAdsId: null,
    googleAdsLabel: null,
    metaPixelId: "964579425998794",
    enableMetaEvents: true,
    clarityProjectId: null,
    contentsquareProjectId: null,
    isDev: false,
    isProd: false
  }
}));

vi.mock("./supabaseClient", () => ({
  supabase: null,
  isSupabaseReady: false,
  isSupabaseAbortError: () => false,
  safeGetSession: vi.fn()
}));

vi.mock("./browserStorage", () => ({
  getFromLocalStorage: (key: string) => window.localStorage.getItem(key),
  setInLocalStorage: (key: string, value: string) => window.localStorage.setItem(key, value)
}));

vi.mock("./navigation", () => ({
  getHref: () => "http://localhost/#landing"
}));

vi.mock("./clientRuntime", () => ({
  getDocumentOrNull: () => document,
  getWindowOrNull: () => window,
  isClientRuntime: () => true
}));

vi.mock("./marketingAttribution", () => ({
  getStoredLeadAttribution: () => null,
  getStoredUtmParams: () => null
}));

describe("meta analytics tracking", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    window.sessionStorage.clear();
    delete (window as any).fbq;
    delete (window as any).gtag;
    delete (window as any).__dawayirMetaPixelInitialized;
    delete (window as any).__dawayirMetaPixelScriptLoaded;
  });

  it("fires ViewContent for landing without requiring consent", { timeout: 20000 }, async () => {
    const fbq = vi.fn();
    window.fbq = fbq as any;

    const { trackLandingView } = await import("./analytics");

    trackLandingView({ entry_variant: "default" });

    // Should call init then track
    expect(fbq).toHaveBeenCalledWith("init", "964579425998794");
    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", expect.objectContaining({
      content_name: "alrehla_landing",
      content_category: "landing",
      entry_variant: "default"
    }));
  });

  it("fires standard Lead and CompleteRegistration events through fbq without requiring consent", { timeout: 20000 }, async () => {
    const fbq = vi.fn();
    window.fbq = fbq as any;

    const { trackLead, trackCompleteRegistration } = await import("./analytics");

    trackLead({
      source: "landing",
      cta_name: "start_journey",
      destination: "full_app_boot"
    });

    trackCompleteRegistration({
      items_count: 3,
      flow: "relationship_onboarding"
    });

    expect(fbq).toHaveBeenCalledWith("init", "964579425998794");
    
    expect(fbq).toHaveBeenCalledWith("track", "Lead", expect.objectContaining({
      source: "landing",
      cta_name: "start_journey",
      destination: "full_app_boot"
    }));

    expect(fbq).toHaveBeenCalledWith("track", "CompleteRegistration", expect.objectContaining({
      items_count: 3,
      flow: "relationship_onboarding"
    }));

    expect(
      fbq.mock.calls.some(([method, eventName]) => (
        method === "trackCustom" || eventName === "SubscribedButtonClick"
      ))
    ).toBe(false);
  });
});
