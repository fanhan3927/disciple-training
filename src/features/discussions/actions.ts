"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthContext } from "@/features/auth/queries";
import { isLeaderRole } from "@/features/groups/permissions";
import {
  commentFormSchema,
  moderatePostSchema,
  notificationSchema,
  postFormSchema,
  prayerFormSchema,
  prayerResponseSchema,
  prayerStatusSchema,
  reactionFormSchema,
} from "./validation";

function requireAdmin() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect("/groups?error=config");
  }
  return admin;
}

async function requireActor() {
  const context = await getAuthContext();
  if (!context.user) {
    redirect("/login");
  }
  return { admin: requireAdmin(), userId: context.user.id };
}

async function requireGroupMember(groupId: string, userId: string) {
  const admin = requireAdmin();
  const { data: membership } = await admin
    .from("group_memberships")
    .select("role,status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || membership.status !== "active") {
    redirect("/groups?error=forbidden");
  }

  return membership;
}

async function enforceRateLimit(
  table: "group_posts" | "comments" | "prayer_requests",
  userId: string,
  limit: number,
  windowMinutes = 60,
) {
  const admin = requireAdmin();
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(table === "comments" ? "author_id" : "author_id", userId)
    .gte("created_at", since);

  if ((count ?? 0) >= limit) {
    redirect("/groups?error=rate-limit");
  }
}

async function notifyUsers(input: {
  userIds: string[];
  actorId: string;
  groupId: string;
  notificationType: "discussion_reply" | "prayer_response";
  postId?: string;
  commentId?: string;
  prayerRequestId?: string;
}) {
  const recipients = [...new Set(input.userIds)].filter((userId) => userId !== input.actorId);
  if (!recipients.length) {
    return;
  }

  const admin = requireAdmin();
  await admin.from("notifications").insert(
    recipients.map((userId) => ({
      user_id: userId,
      group_id: input.groupId,
      notification_type: input.notificationType,
      post_id: input.postId ?? null,
      comment_id: input.commentId ?? null,
      prayer_request_id: input.prayerRequestId ?? null,
      metadata: { kind: input.notificationType },
    })),
  );
}

export async function createPostAction(formData: FormData) {
  const parsed = postFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const { admin, userId } = await requireActor();
  await requireGroupMember(parsed.data.groupId, userId);
  await enforceRateLimit("group_posts", userId, 20);

  const { error } = await admin.from("group_posts").insert({
    group_id: parsed.data.groupId,
    author_id: userId,
    week_number: parsed.data.weekNumber ?? null,
    title: parsed.data.title,
    body: parsed.data.body,
  });
  redirect(`/groups/${parsed.data.groupId}/discussion?${error ? "error=save" : "message=post-created"}`);
}

export async function createCommentAction(formData: FormData) {
  const parsed = commentFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const { admin, userId } = await requireActor();
  await requireGroupMember(parsed.data.groupId, userId);
  await enforceRateLimit("comments", userId, 60);
  const { data: post } = await admin
    .from("group_posts")
    .select("id,group_id,status,author_id")
    .eq("id", parsed.data.postId)
    .eq("group_id", parsed.data.groupId)
    .maybeSingle();

  if (!post || post.status !== "active") {
    redirect(`/groups/${parsed.data.groupId}/discussion?error=forbidden`);
  }

  const { data: comment, error } = await admin
    .from("comments")
    .insert({ post_id: post.id, author_id: userId, body: parsed.data.body })
    .select("id")
    .maybeSingle();
  if (!error && comment) {
    await notifyUsers({
      userIds: [post.author_id],
      actorId: userId,
      groupId: parsed.data.groupId,
      notificationType: "discussion_reply",
      postId: post.id,
      commentId: comment.id,
    });
  }
  redirect(`/groups/${parsed.data.groupId}/discussion?${error ? "error=save" : "message=comment-created"}`);
}

export async function toggleReactionAction(formData: FormData) {
  const parsed = reactionFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const { admin, userId } = await requireActor();
  await requireGroupMember(parsed.data.groupId, userId);
  const targetColumn = parsed.data.targetType === "post" ? "post_id" : "comment_id";
  if (parsed.data.targetType === "post") {
    const { data: target } = await admin.from("group_posts").select("id,status,group_id").eq("id", parsed.data.targetId).maybeSingle();
    if (!target || target.status !== "active" || target.group_id !== parsed.data.groupId) {
      redirect(`/groups/${parsed.data.groupId}/discussion?error=forbidden`);
    }
  } else {
    const { data: target } = await admin.from("comments").select("id,status,post_id").eq("id", parsed.data.targetId).maybeSingle();
    const { data: parentPost } = target
      ? await admin.from("group_posts").select("group_id,status").eq("id", target.post_id).maybeSingle()
      : { data: null };
    if (!target || target.status !== "active" || !parentPost || parentPost.status !== "active" || parentPost.group_id !== parsed.data.groupId) {
      redirect(`/groups/${parsed.data.groupId}/discussion?error=forbidden`);
    }
  }

  const { data: existing } = await admin
    .from("reactions")
    .select("id")
    .eq(targetColumn, parsed.data.targetId)
    .eq("user_id", userId)
    .eq("reaction_type", parsed.data.reactionType)
    .maybeSingle();
  let error = existing
    ? (await admin.from("reactions").delete().eq("id", existing.id)).error
    : null;
  if (!existing) {
    const insert = parsed.data.targetType === "post"
      ? await admin.from("reactions").insert({
          post_id: parsed.data.targetId,
          user_id: userId,
          reaction_type: parsed.data.reactionType,
        })
      : await admin.from("reactions").insert({
          comment_id: parsed.data.targetId,
          user_id: userId,
          reaction_type: parsed.data.reactionType,
        });
    error = insert.error;
  }
  redirect(`/groups/${parsed.data.groupId}/discussion?${error ? "error=save" : "message=reaction-updated"}`);
}

export async function moderatePostAction(formData: FormData) {
  const parsed = moderatePostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const { admin, userId } = await requireActor();
  const membership = await requireGroupMember(parsed.data.groupId, userId);
  const { data: post } = await admin
    .from("group_posts")
    .select("id,group_id,author_id")
    .eq("id", parsed.data.postId)
    .eq("group_id", parsed.data.groupId)
    .maybeSingle();
  if (!post || (post.author_id !== userId && !isLeaderRole(membership.role))) {
    redirect(`/groups/${parsed.data.groupId}/discussion?error=forbidden`);
  }

  const { error } = await admin.from("group_posts").update({
    status: parsed.data.status,
    hidden_at: parsed.data.status === "hidden" ? new Date().toISOString() : null,
    deleted_at: parsed.data.status === "deleted" ? new Date().toISOString() : null,
  }).eq("id", post.id);
  redirect(`/groups/${parsed.data.groupId}/discussion?${error ? "error=save" : "message=post-updated"}`);
}

export async function createPrayerRequestAction(formData: FormData) {
  const parsed = prayerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const { admin, userId } = await requireActor();
  await requireGroupMember(parsed.data.groupId, userId);
  await enforceRateLimit("prayer_requests", userId, 20);
  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (expiresAt && !Number.isFinite(expiresAt.getTime())) {
    redirect(`/groups/${parsed.data.groupId}/prayer?error=invalid`);
  }

  const { error } = await admin.from("prayer_requests").insert({
    group_id: parsed.data.groupId,
    author_id: userId,
    title: parsed.data.title,
    body: parsed.data.body,
    visibility: parsed.data.visibility,
    expires_at: expiresAt?.toISOString() ?? null,
  });
  redirect(`/groups/${parsed.data.groupId}/prayer?${error ? "error=save" : "message=prayer-created"}`);
}

export async function updatePrayerStatusAction(formData: FormData) {
  const parsed = prayerStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const { admin, userId } = await requireActor();
  await requireGroupMember(parsed.data.groupId, userId);
  const { data: request } = await admin
    .from("prayer_requests")
    .select("id,group_id,author_id")
    .eq("id", parsed.data.requestId)
    .eq("group_id", parsed.data.groupId)
    .maybeSingle();
  if (!request || request.author_id !== userId) {
    redirect(`/groups/${parsed.data.groupId}/prayer?error=forbidden`);
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("prayer_requests").update({
    status: parsed.data.status,
    ended_at: parsed.data.status === "ended" ? now : null,
    responded_at: parsed.data.status === "responded" ? now : null,
  }).eq("id", request.id);
  redirect(`/groups/${parsed.data.groupId}/prayer?${error ? "error=save" : "message=prayer-updated"}`);
}

export async function respondToPrayerAction(formData: FormData) {
  const parsed = prayerResponseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const { admin, userId } = await requireActor();
  const membership = await requireGroupMember(parsed.data.groupId, userId);
  const { data: request } = await admin
    .from("prayer_requests")
    .select("id,group_id,author_id,visibility,status,expires_at")
    .eq("id", parsed.data.requestId)
    .eq("group_id", parsed.data.groupId)
    .maybeSingle();
  if (!request || request.status === "ended" || request.expires_at && Date.parse(request.expires_at) <= Date.now()) {
    redirect(`/groups/${parsed.data.groupId}/prayer?error=forbidden`);
  }
  const allowed = request.visibility === "private"
    ? request.author_id === userId
    : request.visibility === "leader_only"
      ? isLeaderRole(membership.role)
      : membership.status === "active";
  if (!allowed) {
    redirect(`/groups/${parsed.data.groupId}/prayer?error=forbidden`);
  }

  const { error } = await admin.from("prayer_responses").insert({
    request_id: request.id,
    responder_id: userId,
    response_type: parsed.data.responseType,
    body: parsed.data.body || null,
  });
  if (!error) {
    await notifyUsers({
      userIds: [request.author_id],
      actorId: userId,
      groupId: parsed.data.groupId,
      notificationType: "prayer_response",
      prayerRequestId: request.id,
    });
  }
  redirect(`/groups/${parsed.data.groupId}/prayer?${error ? "error=save" : "message=prayer-responded"}`);
}

export async function markNotificationReadAction(formData: FormData) {
  const parsed = notificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }
  const { admin, userId } = await requireActor();
  const { error } = await admin.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data.notificationId)
    .eq("user_id", userId);
  redirect(`/home?${error ? "error=save" : "message=notification-read"}`);
}
