import type { GroupRole, MembershipStatus } from "@/lib/supabase/database.types";

export type MembershipSnapshot = {
  group_id: string;
  user_id: string;
  role: GroupRole;
  status: MembershipStatus;
};

export function isActiveMember(membership: MembershipSnapshot | null | undefined): boolean {
  return membership?.status === "active";
}

export function isLeaderRole(role: GroupRole): boolean {
  return role === "leader" || role === "co_leader";
}

export function canManageGroup(membership: MembershipSnapshot | null | undefined): boolean {
  return Boolean(membership && isActiveMember(membership) && isLeaderRole(membership.role));
}

export function canReadGroup(userId: string, groupId: string, memberships: MembershipSnapshot[]): boolean {
  return memberships.some(
    (membership) =>
      membership.user_id === userId &&
      membership.group_id === groupId &&
      membership.status === "active",
  );
}

export function canManageMembership(
  actor: MembershipSnapshot | null | undefined,
  target: MembershipSnapshot,
  activeLeaderCount: number,
): boolean {
  if (!canManageGroup(actor)) {
    return false;
  }

  if (isLeaderRole(target.role) && target.status === "active" && activeLeaderCount <= 1) {
    return false;
  }

  return actor?.group_id === target.group_id;
}

export type InvitationSnapshot = {
  expires_at: string;
  max_uses: number;
  use_count: number;
  revoked_at: string | null;
};

export function canUseInvitation(invitation: InvitationSnapshot, now = new Date()): boolean {
  return (
    invitation.revoked_at === null &&
    new Date(invitation.expires_at).getTime() > now.getTime() &&
    invitation.use_count < invitation.max_uses
  );
}
