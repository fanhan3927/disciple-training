import { describe, expect, it } from "vitest";
import {
  canModerateDiscussion,
  canReadPrayer,
  getCurrentCohortWeek,
  isPrayerVisible,
} from "@/features/discussions/authorization";

describe("M4 discussion authorization", () => {
  it("allows only the author or a same-group leader to moderate", () => {
    expect(canModerateDiscussion({ authorId: "bob", actorId: "bob", actorIsLeader: false, groupId: "a", actorGroupId: "a" })).toBe(true);
    expect(canModerateDiscussion({ authorId: "bob", actorId: "alice", actorIsLeader: true, groupId: "a", actorGroupId: "a" })).toBe(true);
    expect(canModerateDiscussion({ authorId: "bob", actorId: "carol", actorIsLeader: true, groupId: "a", actorGroupId: "b" })).toBe(false);
  });

  it("keeps prayer visibility explicit", () => {
    expect(canReadPrayer({ visibility: "private", authorId: "bob", actorId: "alice", actorIsLeader: true })).toBe(false);
    expect(canReadPrayer({ visibility: "private", authorId: "bob", actorId: "bob", actorIsLeader: false })).toBe(true);
    expect(canReadPrayer({ visibility: "leader_only", authorId: "bob", actorId: "alice", actorIsLeader: true })).toBe(true);
    expect(canReadPrayer({ visibility: "group", authorId: "bob", actorId: "carol", actorIsLeader: false, isActiveMember: false })).toBe(false);
  });

  it("filters ended and expired prayers", () => {
    const now = new Date("2026-08-18T00:00:00.000Z");
    expect(isPrayerVisible({ status: "open", expiresAt: "2026-08-19T00:00:00.000Z" }, now)).toBe(true);
    expect(isPrayerVisible({ status: "ended", expiresAt: null }, now)).toBe(false);
    expect(isPrayerVisible({ status: "open", expiresAt: "2026-08-17T00:00:00.000Z" }, now)).toBe(false);
  });

  it("caps the displayed cohort week at four", () => {
    expect(getCurrentCohortWeek("2026-08-17", new Date("2026-08-17T10:00:00.000Z"))).toBe(1);
    expect(getCurrentCohortWeek("2026-08-17", new Date("2026-08-31T10:00:00.000Z"))).toBe(3);
    expect(getCurrentCohortWeek("2026-08-17", new Date("2026-09-30T10:00:00.000Z"))).toBe(4);
  });
});
