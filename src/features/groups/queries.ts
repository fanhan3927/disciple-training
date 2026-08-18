import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getAuthContext, requireUser } from "@/features/auth/queries";
import { getOnboardingStatus } from "@/features/auth/onboarding";
import { hashInvitationToken } from "./token";
import { canUseInvitation } from "./permissions";

type Group = Database["public"]["Tables"]["groups"]["Row"];
type Membership = Database["public"]["Tables"]["group_memberships"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type UserGroup = Group & {
  membership: Pick<Membership, "role" | "status" | "accepted_covenant_at">;
};

export type GroupMember = Membership & {
  profile: Pick<Profile, "display_name" | "timezone" | "locale"> | null;
};

export type InvitationPreview = {
  status: "valid" | "invalid" | "config";
  groupName?: string;
  groupTimezone?: string;
  roleToGrant?: string;
  expiresAt?: string;
  leaderDisplayName?: string;
};

export async function requireOnboardedUser() {
  const context = await requireUser();

  if (!context.configured) {
    return context;
  }

  if (!context.user) {
    redirect("/login");
  }

  const onboarding = getOnboardingStatus(context.profile, context.consents);

  if (!onboarding.completed) {
    redirect(onboarding.adultConfirmed ? "/settings/privacy" : "/settings/profile");
  }

  return { ...context, onboarding };
}

export async function listUserGroups(): Promise<UserGroup[]> {
  const context = await requireOnboardedUser();

  if (!context.configured || !context.user) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data: memberships } = await supabase
    .from("group_memberships")
    .select("group_id,role,status,accepted_covenant_at")
    .eq("user_id", context.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const groupIds = (memberships ?? []).map((membership) => membership.group_id);
  const { data: groups } = groupIds.length
    ? await supabase.from("groups").select("*").in("id", groupIds)
    : { data: [] };

  const groupsById = new Map((groups ?? []).map((group) => [group.id, group]));

  return (memberships ?? [])
    .map((membership) => {
      const group = groupsById.get(membership.group_id);
      return group
        ? {
            ...group,
            membership: {
              role: membership.role,
              status: membership.status,
              accepted_covenant_at: membership.accepted_covenant_at,
            },
          }
        : null;
    })
    .filter((group): group is UserGroup => group !== null);
}

export async function getGroupForCurrentUser(groupId: string): Promise<UserGroup | null> {
  const context = await requireOnboardedUser();

  if (!context.configured || !context.user) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role,status,accepted_covenant_at")
    .eq("group_id", groupId)
    .eq("user_id", context.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    return null;
  }

  const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();

  if (!group) {
    return null;
  }

  return {
    ...group,
    membership: {
      role: membership.role,
      status: membership.status,
      accepted_covenant_at: membership.accepted_covenant_at,
    },
  };
}

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const group = await getGroupForCurrentUser(groupId);
  if (!group) {
    redirect("/groups?error=not-found");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return [];
  }

  const { data: memberships } = await admin
    .from("group_memberships")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  const userIds = (memberships ?? []).map((membership) => membership.user_id);
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("user_id,display_name,timezone,locale").in("user_id", userIds)
    : { data: [] };

  const profilesByUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));

  return (memberships ?? []).map((membership) => ({
    ...membership,
    profile: profilesByUserId.get(membership.user_id) ?? null,
  }));
}

export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { status: "config" };
  }

  const tokenHash = hashInvitationToken(token);
  const { data: invitation } = await admin
    .from("group_invitations")
    .select("group_id,role_to_grant,expires_at,max_uses,use_count,revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invitation || !canUseInvitation(invitation)) {
    return { status: "invalid" };
  }

  const { data: group } = await admin
    .from("groups")
    .select("name,timezone,created_by")
    .eq("id", invitation.group_id)
    .maybeSingle();

  const creatorId = group?.created_by;
  const { data: leaderProfile } = creatorId
    ? await admin.from("profiles").select("display_name").eq("user_id", creatorId).maybeSingle()
    : { data: null };

  return {
    status: "valid",
    groupName: group?.name ?? "受邀小组",
    groupTimezone: group?.timezone ?? "Asia/Shanghai",
    roleToGrant: invitation.role_to_grant,
    expiresAt: invitation.expires_at,
    leaderDisplayName: leaderProfile?.display_name || "Leader",
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const context = await getAuthContext();
  return context.user?.id ?? null;
}
