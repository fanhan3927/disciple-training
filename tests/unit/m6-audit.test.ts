import { describe, expect, it } from "vitest";
import { sanitizeAuditMetadata } from "@/features/safety/audit";

describe("M6 audit redaction", () => {
  it("removes private正文 fields before an audit event is written", () => {
    expect(sanitizeAuditMetadata({ action: "read_case", body: "secret", private_text: "secret", target: "case" })).toEqual({ action: "read_case", target: "case" });
  });
});
