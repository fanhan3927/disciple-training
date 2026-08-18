import { describe, expect, it } from "vitest";
import { getRequiredConsentTypes, legalDocuments } from "@/lib/legal-documents";

describe("legalDocuments", () => {
  it("uses versioned sha256 hashes for every M1 legal document", () => {
    expect(legalDocuments.length).toBeGreaterThanOrEqual(7);

    for (const document of legalDocuments) {
      expect(document.version).toBe("2026-07-30.m1");
      expect(document.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    }
  });

  it("keeps marketing consent outside required onboarding consents", () => {
    expect(getRequiredConsentTypes()).toEqual(["privacy", "terms", "sensitive_data"]);
  });
});
