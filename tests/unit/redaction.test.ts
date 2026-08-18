import { describe, expect, it } from "vitest";
import { redactLogMetadata } from "@/lib/privacy/redaction";

describe("redactLogMetadata", () => {
  it("removes sensitive body and credential fields from log metadata", () => {
    expect(
      redactLogMetadata({
        route: "/api/groups/group_123/home",
        email: "person@example.com",
        prayerBody: "private text",
        apiKey: "secret",
        status: 200,
      }),
    ).toEqual({
      route: "/api/groups/group_123/home",
      email: "[REDACTED]",
      prayerBody: "[REDACTED]",
      apiKey: "[REDACTED]",
      status: 200,
    });
  });
});
