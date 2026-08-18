"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthContext } from "@/features/auth/queries";
import { reportSchema, rightsRequestSchema } from "./validation";

function requireAdmin() { const admin = createSupabaseAdminClient(); if (!admin) redirect("/groups?error=config"); return admin; }
async function requireUser() { const context = await getAuthContext(); if (!context.user) redirect("/login"); return context.user.id; }
async function requireGroupMember(groupId: string, userId: string) { const admin = requireAdmin(); const { data } = await admin.from("group_memberships").select("status").eq("group_id", groupId).eq("user_id", userId).maybeSingle(); if (!data || data.status !== "active") redirect("/groups?error=forbidden"); }

async function assertReportTarget(groupId: string, targetType: "post" | "comment" | "prayer" | "member" | "group", targetId: string) {
  const admin = requireAdmin();
  if (targetType === "group") {
    if (targetId !== groupId) redirect(`/groups/${groupId}?error=forbidden`);
    return;
  }
  if (targetType === "member") {
    const { data } = await admin.from("group_memberships").select("user_id").eq("group_id", groupId).eq("user_id", targetId).maybeSingle();
    if (!data) redirect(`/groups/${groupId}?error=forbidden`);
    return;
  }
  if (targetType === "post") {
    const { data } = await admin.from("group_posts").select("id").eq("id", targetId).eq("group_id", groupId).maybeSingle();
    if (!data) redirect(`/groups/${groupId}?error=forbidden`);
    return;
  }
  if (targetType === "prayer") {
    const { data } = await admin.from("prayer_requests").select("id").eq("id", targetId).eq("group_id", groupId).maybeSingle();
    if (!data) redirect(`/groups/${groupId}?error=forbidden`);
    return;
  }
  const { data: comment } = await admin.from("comments").select("post_id").eq("id", targetId).maybeSingle();
  const { data: post } = comment ? await admin.from("group_posts").select("id").eq("id", comment.post_id).eq("group_id", groupId).maybeSingle() : { data: null };
  if (!post) redirect(`/groups/${groupId}?error=forbidden`);
}

export async function createReportAction(formData: FormData) {
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/groups?error=invalid");
  const userId = await requireUser(); const admin = requireAdmin(); await requireGroupMember(parsed.data.groupId, userId);
  await assertReportTarget(parsed.data.groupId, parsed.data.targetType, parsed.data.targetId);
  const { count } = await admin.from("reports").select("id", { count: "exact", head: true }).eq("reporter_id", userId).gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if ((count ?? 0) >= 10) redirect(`/groups/${parsed.data.groupId}?error=rate-limit`);
  const { error } = await admin.from("reports").insert({ reporter_id: userId, group_id: parsed.data.groupId, target_type: parsed.data.targetType, target_id: parsed.data.targetId, category: parsed.data.category, details: parsed.data.details ?? "" });
  redirect(`/groups/${parsed.data.groupId}?${error ? "error=save" : "message=report-created"}`);
}

export async function requestDataExportAction(formData: FormData) {
  if (!rightsRequestSchema.safeParse(Object.fromEntries(formData)).success) redirect("/settings/privacy?error=required");
  const userId = await requireUser(); const admin = requireAdmin(); const { data: existing } = await admin.from("data_export_requests").select("id").eq("user_id", userId).in("status", ["requested", "processing"]).maybeSingle();
  if (!existing) await admin.from("data_export_requests").insert({ user_id: userId });
  redirect("/settings/privacy?message=export-requested");
}

export async function requestAccountDeletionAction(formData: FormData) {
  if (!rightsRequestSchema.safeParse(Object.fromEntries(formData)).success) redirect("/settings/privacy?error=required");
  const userId = await requireUser(); const admin = requireAdmin(); const { data: existing } = await admin.from("account_deletion_requests").select("id").eq("user_id", userId).in("status", ["requested", "processing"]).maybeSingle();
  if (!existing) await admin.from("account_deletion_requests").insert({ user_id: userId });
  redirect("/settings/privacy?message=deletion-requested");
}
