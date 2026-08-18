import type { PrayerStatus, PrayerVisibility } from "@/lib/supabase/database.types";

export function canModerateDiscussion(input: {
  authorId: string;
  actorId: string;
  actorIsLeader: boolean;
  groupId: string;
  actorGroupId: string;
}): boolean {
  return input.groupId === input.actorGroupId && (input.authorId === input.actorId || input.actorIsLeader);
}

export function canReadPrayer(input: {
  visibility: PrayerVisibility;
  authorId: string;
  actorId: string;
  actorIsLeader: boolean;
  isActiveMember?: boolean;
}): boolean {
  if (input.visibility === "private") {
    return input.authorId === input.actorId;
  }

  if (input.visibility === "leader_only") {
    return input.actorIsLeader;
  }

  return input.isActiveMember ?? true;
}

export function isPrayerVisible(
  input: { status: PrayerStatus; expiresAt: string | null },
  now = new Date(),
): boolean {
  if (input.status === "ended") {
    return false;
  }

  return input.expiresAt === null || Date.parse(input.expiresAt) > now.getTime();
}

export function getCurrentCohortWeek(startsOn: string, now = new Date()): number {
  const start = Date.parse(`${startsOn}T00:00:00.000Z`);
  if (!Number.isFinite(start) || now.getTime() <= start) {
    return 1;
  }

  return Math.min(4, Math.floor((now.getTime() - start) / (7 * 24 * 60 * 60 * 1000)) + 1);
}
