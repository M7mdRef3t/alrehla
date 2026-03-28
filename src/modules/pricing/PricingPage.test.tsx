import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  trackInitiateCheckout: vi.fn(),
  trackStartTrial: vi.fn(),
  trackCoachCheckout: vi.fn(),
  createCheckoutSession: vi.fn(),
  signInWithGoogleAtPath: vi.fn()
}));

vi.mock("../../services/analytics", () => ({
  trackInitiateCheckout: mocks.trackInitiateCheckout,
  trackStartTrial: mocks.trackStartTrial,
  trackCoachCheckout: mocks.trackCoachCheckout
}));

vi.mock("../../services/subscriptionManager", () => ({
  consumeEmotionalOffer: vi.fn(),
  getEmotionalOffer: () => null
}));

vi.mock("../../services/stripeIntegration", () => ({
  stripeService: {
    createCheckoutSession: mocks.createCheckoutSession
  }
}));

vi.mock("../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: {
            user: { id: "user-1" }
          }
        }
      }))
    }
  }
}));

vi.mock("../../services/authService", () => ({
  signInWithGoogleAtPath: mocks.signInWithGoogleAtPath
}));

import PricingPage from "./PricingPage";

describe("PricingPage analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCheckoutSession.mockResolvedValue({ url: "https://checkout.example.com" });
  });

  it("tracks checkout and start trial for premium purchase", async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" }
    });

    render(<PricingPage />);

    const buttons = screen.getAllByRole("button");
    const premiumButton = buttons.find((button) => button.textContent?.includes("ابدأ الخطة الشخصية"));
    expect(premiumButton).toBeTruthy();

    fireEvent.click(premiumButton as HTMLButtonElement);

    await waitFor(() => {
      expect(mocks.trackInitiateCheckout).toHaveBeenCalledWith({
        value: 4.99,
        currency: "USD",
        plan_tier: "premium"
      });
      expect(mocks.trackStartTrial).toHaveBeenCalledWith({
        value: 4.99,
        currency: "USD",
        plan_tier: "premium",
        content_name: "pricing_page_premium",
        content_category: "checkout"
      });
      expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
        userId: "user-1",
        tier: "premium"
      });
    });

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation
    });
  });

  it("tracks coach checkout separately for coach purchase", async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" }
    });

    render(<PricingPage />);

    const buttons = screen.getAllByRole("button");
    const coachButton = buttons.find((button) => button.textContent?.includes("ابدأ خطة العيادة"));
    expect(coachButton).toBeTruthy();

    fireEvent.click(coachButton as HTMLButtonElement);

    await waitFor(() => {
      expect(mocks.trackInitiateCheckout).toHaveBeenCalledWith({
        value: 49,
        currency: "USD",
        plan_tier: "coach"
      });
      expect(mocks.trackCoachCheckout).toHaveBeenCalledWith({
        value: 49,
        currency: "USD",
        plan_tier: "coach",
        content_name: "pricing_page_coach",
        content_category: "checkout"
      });
      expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
        userId: "user-1",
        tier: "coach"
      });
    });

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation
    });
  });
});
