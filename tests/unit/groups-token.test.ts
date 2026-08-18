import { describe, expect, it } from "vitest";
import { createInvitationToken, hashInvitationToken } from "@/features/groups/token";

describe("invitation token handling", () => {
  it("creates URL-safe tokens and stores only sha256 hashes", () => {
    const token = createInvitationToken();
    const hash = hashInvitationToken(token);

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).not.toContain("sha256:");
    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(hash).not.toContain(token);
  });
});
