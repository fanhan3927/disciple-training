import { describe, expect, it } from "vitest";
import {
  canManageGroup,
  canManageMembership,
  canReadGroup,
  canUseInvitation,
  type MembershipSnapshot,
} from "@/features/groups/permissions";

const aliceA: MembershipSnapshot = {
  group_id: "group-a",
  user_id: "alice",
  role: "leader",
  status: "active",
};
const aliceB: MembershipSnapshot = {
  group_id: "group-b",
  user_id: "alice",
  role: "member",
  status: "active",
};
const bobA: MembershipSnapshot = {
  group_id: "group-a",
  user_id: "bob",
  role: "member",
  status: "active",
};
const carolB: MembershipSnapshot = {
  group_id: "group-b",
  user_id: "carol",
  role: "leader",
  status: "active",
};

describe("group permission matrix", () => {
  it("allows Alice to manage A but not B", () => {
    expect(canManageGroup(aliceA)).toBe(true);
    expect(canManageGroup(aliceB)).toBe(false);
  });

  it("prevents cross-group reads for Carol and Dave", () => {
    const memberships = [aliceA, aliceB, bobA, carolB];

    expect(canReadGroup("carol", "group-a", memberships)).toBe(false);
    expect(canReadGroup("dave", "group-a", memberships)).toBe(false);
    expect(canReadGroup("bob", "group-a", memberships)).toBe(true);
  });

  it("prevents members from managing other members", () => {
    expect(canManageMembership(bobA, aliceA, 1)).toBe(false);
  });

  it("prevents removing the only active leader from an active group", () => {
    expect(canManageMembership(aliceA, aliceA, 1)).toBe(false);
    expect(canManageMembership(aliceA, bobA, 1)).toBe(true);
  });
});

describe("canUseInvitation", () => {
  it("rejects revoked, expired, or exhausted invitations", () => {
    const now = new Date("2026-07-30T00:00:00.000Z");

    expect(
      canUseInvitation(
        {
          expires_at: "2026-07-31T00:00:00.000Z",
          max_uses: 1,
          use_count: 0,
          revoked_at: null,
        },
        now,
      ),
    ).toBe(true);
    expect(
      canUseInvitation(
        {
          expires_at: "2026-07-29T00:00:00.000Z",
          max_uses: 1,
          use_count: 0,
          revoked_at: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      canUseInvitation(
        {
          expires_at: "2026-07-31T00:00:00.000Z",
          max_uses: 1,
          use_count: 1,
          revoked_at: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      canUseInvitation(
        {
          expires_at: "2026-07-31T00:00:00.000Z",
          max_uses: 1,
          use_count: 0,
          revoked_at: "2026-07-30T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });
});
