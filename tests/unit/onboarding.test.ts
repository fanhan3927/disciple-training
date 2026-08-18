import { describe, expect, it } from "vitest";
import { getOnboardingStatus } from "@/features/auth/onboarding";

describe("getOnboardingStatus", () => {
  it("blocks users without adult confirmation and required consents", () => {
    const status = getOnboardingStatus(null, []);

    expect(status.completed).toBe(false);
    expect(status.adultConfirmed).toBe(false);
    expect(status.missingConsents).toEqual(["terms", "privacy", "sensitive_data"]);
  });

  it("allows users only when adult confirmation and all required consents are active", () => {
    const status = getOnboardingStatus(
      { adult_confirmed_at: "2026-07-30T00:00:00.000Z" },
      [
        { consent_type: "terms", revoked_at: null },
        { consent_type: "privacy", revoked_at: null },
        { consent_type: "sensitive_data", revoked_at: null },
        { consent_type: "marketing", revoked_at: "2026-07-30T00:00:00.000Z" },
      ],
    );

    expect(status.completed).toBe(true);
    expect(status.missingConsents).toEqual([]);
  });

  it("treats revoked required consents as missing", () => {
    const status = getOnboardingStatus(
      { adult_confirmed_at: "2026-07-30T00:00:00.000Z" },
      [
        { consent_type: "terms", revoked_at: null },
        { consent_type: "privacy", revoked_at: "2026-07-30T00:00:00.000Z" },
        { consent_type: "sensitive_data", revoked_at: null },
      ],
    );

    expect(status.completed).toBe(false);
    expect(status.missingConsents).toEqual(["privacy"]);
  });
});
