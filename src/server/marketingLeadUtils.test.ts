import { describe, expect, it } from "vitest";
import { dedupeMarketingLeadInputs, normalizeMarketingLeadPayload } from "./marketingLeadUtils";

describe("normalizeMarketingLeadPayload", () => {
  it("normalizes lead metadata for manual imports", () => {
    const normalized = normalizeMarketingLeadPayload(
      {
        email: "  TEST@Example.com ",
        phone: "+20 100 200 3000",
        name: "  Mohamed  ",
        source: " meta_form ",
        sourceType: "manual_import",
        campaign: "energy_map_eg_v1",
        note: " interested ",
        status: "qualified",
        lastContactedAt: "2026-03-19T10:00:00.000Z"
      },
      "website"
    );

    expect(normalized).toMatchObject({
      email: "test@example.com",
      phone: "201002003000",
      name: "Mohamed",
      source: "meta_form",
      sourceType: "manual_import",
      campaign: "energy_map_eg_v1",
      note: "interested",
      status: "qualified",
      lastContactedAt: "2026-03-19T10:00:00.000Z"
    });
  });

  it("rejects invalid emails", () => {
    expect(normalizeMarketingLeadPayload({ email: "bad-email" }, "website")).toBeNull();
  });

  it("accepts phone-only leads", () => {
    const normalized = normalizeMarketingLeadPayload(
      {
        phone: "01002003000",
        source: "onboarding",
        sourceType: "website",
        status: "engaged"
      },
      "website"
    );

    expect(normalized).toMatchObject({
      email: null,
      phone: "201002003000",
      phoneNormalized: "201002003000",
      phoneRaw: "01002003000",
      source: "onboarding",
      sourceType: "website",
      status: "engaged"
    });
  });
});

describe("dedupeMarketingLeadInputs", () => {
  it("keeps the last lead per email", () => {
    const first = normalizeMarketingLeadPayload({ email: "first@example.com", source: "landing" }, "website");
    const second = normalizeMarketingLeadPayload({ email: "first@example.com", source: "meta" }, "manual_import");

    const deduped = dedupeMarketingLeadInputs([first!, second!]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.source).toBe("meta");
    expect(deduped[0]?.sourceType).toBe("manual_import");
  });
});
