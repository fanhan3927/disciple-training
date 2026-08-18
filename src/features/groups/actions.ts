"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_MEMBER_LIMIT, LEADER_COVENANT_VERSION } from "./constants";
import {
  groupFormSchema,
  groupIdSchema,
  groupSettingsSchema,
  invitationFormSchema,
  removeMemberSchema,
  tokenSchema,
} from "./validation";
import { createInvitationToken, hashInvitationToken } from "./token";
import { canUseInvitation } from "./permissions";

async function requireActionUser() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    redirect("/groups?error=config");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

function requireAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/groups?error=config");
  }

  return admin;
}

export async function createGroupAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = groupFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups/new?error=invalid");
  }

  const input = parsed.data;
  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({
      name: input.name,
      description: input.description,
      timezone: input.timezone,
      member_limit: input.memberLimit ?? DEFAULT_MEMBER_LIMIT,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (groupError || !group) {
    redirect("/groups/new?error=create");
  }

  const { error: membershipError } = await admin.from("group_memberships").insert({
    group_id: group.id,
    user_id: user.id,
    role: "leader",
    status: "active",
    joined_at: new Date().toISOString(),
    leader_covenant_version: LEADER_COVENANT_VERSION,
    accepted_covenant_at: new Date().toISOString(),
  });

  if (membershipError) {
    redirect("/groups/new?error=membership");
  }

  redirect(`/groups/${group.id}?message=group-created`);
}

export async function updateGroupAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = groupSettingsSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const input = parsed.data;
  await assertGroupLeader(admin, input.groupId, user.id);

  const { error } = await admin
    .from("groups")
    .update({
      name: input.name,
      description: input.description,
      timezone: input.timezone,
      member_limit: input.memberLimit,
    })
    .eq("id", input.groupId);

  if (error) {
    redirect(`/groups/${input.groupId}/settings?error=save`);
  }

  redirect(`/groups/${input.groupId}/settings?message=saved`);
}

export async function archiveGroupAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = groupIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  await assertGroupLeader(admin, parsed.data.groupId, user.id);

  const { error } = await admin
    .from("groups")
    .update({
      lifecycle_status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.groupId);

  if (error) {
    redirect(`/groups/${parsed.data.groupId}/settings?error=archive`);
  }

  redirect("/groups?message=archived");
}

export async function createInvitationAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = invitationFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const input = parsed.data;
  await assertGroupLeader(admin, input.groupId, user.id);

  const token = createInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + input.expiresHours * 60 * 60 * 1000).toISOString();

  const { error } = await admin.from("group_invitations").insert({
    group_id: input.groupId,
    token_hash: tokenHash,
    role_to_grant: input.roleToGrant,
    expires_at: expiresAt,
    max_uses: input.maxUses,
    created_by: user.id,
  });

  if (error) {
    redirect(`/groups/${input.groupId}?error=invite`);
  }

  redirect(`/groups/${input.groupId}?invite=${encodeURIComponent(token)}`);
}

export async function acceptInvitationAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const token = tokenSchema.safeParse(formData.get("token"));

  if (!token.success) {
    redirect("/groups?error=invalid-invite");
  }

  const tokenHash = hashInvitationToken(token.data);
  const { data: invitation } = await admin
    .from("group_invitations")
    .select("id,group_id,role_to_grant,expires_at,max_uses,use_count,revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invitation || !canUseInvitation(invitation)) {
    redirect("/groups?error=invalid-invite");
  }

  const { data: group } = await admin
    .from("groups")
    .select("member_limit")
    .eq("id", invitation.group_id)
    .maybeSingle();

  const { count } = await admin
    .from("group_memberships")
    .select("user_id", { count: "exact", head: true })
    .eq("group_id", invitation.group_id)
    .eq("status", "active");

  if ((count ?? 0) >= (group?.member_limit ?? DEFAULT_MEMBER_LIMIT)) {
    redirect("/groups?error=group-full");
  }

  const now = new Date().toISOString();
  const { error: membershipError } = await admin.from("group_memberships").upsert({
    group_id: invitation.group_id,
    user_id: user.id,
    role: invitation.role_to_grant,
    status: "active",
    invited_by: null,
    joined_at: now,
    left_at: null,
  });

  if (membershipError) {
    redirect("/groups?error=join");
  }

  const { error: inviteError } = await admin
    .from("group_invitations")
    .update({ use_count: invitation.use_count + 1 })
    .eq("id", invitation.id)
    .eq("use_count", invitation.use_count);

  if (inviteError) {
    redirect("/groups?error=join");
  }

  redirect(`/groups/${invitation.group_id}?message=joined`);
}

export async function revokeInvitationAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const invitationId = String(formData.get("invitationId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");

  const parsed = groupIdSchema.safeParse({ groupId });
  if (!parsed.success || !invitationId) {
    redirect("/groups?error=invalid");
  }

  await assertGroupLeader(admin, parsed.data.groupId, user.id);

  await admin
    .from("group_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("group_id", parsed.data.groupId);

  redirect(`/groups/${parsed.data.groupId}?message=invite-revoked`);
}

export async function removeMemberAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = removeMemberSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  await assertGroupLeader(admin, parsed.data.groupId, user.id);

  const { data: target } = await admin
    .from("group_memberships")
    .select("role,status")
    .eq("group_id", parsed.data.groupId)
    .eq("user_id", parsed.data.userId)
    .maybeSingle();

  if (!target) {
    redirect(`/groups/${parsed.data.groupId}/members?error=not-found`);
  }

  if (target.role === "leader" || target.role === "co_leader") {
    const { count } = await admin
      .from("group_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", parsed.data.groupId)
      .eq("status", "active")
      .in("role", ["leader", "co_leader"]);

    if ((count ?? 0) <= 1) {
      redirect(`/groups/${parsed.data.groupId}/members?error=last-leader`);
    }
  }

  await admin
    .from("group_memberships")
    .update({ status: "removed", left_at: new Date().toISOString() })
    .eq("group_id", parsed.data.groupId)
    .eq("user_id", parsed.data.userId);

  redirect(`/groups/${parsed.data.groupId}/members?message=removed`);
}

export async function leaveGroupAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = groupIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const { data: membership } = await admin
    .from("group_memberships")
    .select("role,status")
    .eq("group_id", parsed.data.groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/groups?error=not-found");
  }

  if (membership.role === "leader" || membership.role === "co_leader") {
    const { count } = await admin
      .from("group_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", parsed.data.groupId)
      .eq("status", "active")
      .in("role", ["leader", "co_leader"]);

    if ((count ?? 0) <= 1) {
      redirect(`/groups/${parsed.data.groupId}/settings?error=last-leader`);
    }
  }

  await admin
    .from("group_memberships")
    .update({ status: "left", left_at: new Date().toISOString() })
    .eq("group_id", parsed.data.groupId)
    .eq("user_id", user.id);

  redirect("/groups?message=left");
}

async function assertGroupLeader(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  groupId: string,
  userId: string,
) {
  if (!admin) {
    redirect("/groups?error=config");
  }

  const { data: membership } = await admin
    .from("group_memberships")
    .select("role,status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || membership.status !== "active" || !["leader", "co_leader"].includes(membership.role)) {
    redirect("/groups?error=forbidden");
  }
}
