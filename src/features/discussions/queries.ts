import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId, getGroupForCurrentUser } from "@/features/groups/queries";
import { isLeaderRole } from "@/features/groups/permissions";
import { getCurrentCohortWeek, canReadPrayer, isPrayerVisible } from "./authorization";

type Post = Database["public"]["Tables"]["group_posts"]["Row"];
type Comment = Database["public"]["Tables"]["comments"]["Row"];
type PrayerRequest = Database["public"]["Tables"]["prayer_requests"]["Row"];

export type DiscussionComment = Comment & { authorName: string };
export type DiscussionPost = Post & {
  authorName: string;
  comments: DiscussionComment[];
  encouragementCount: number;
  prayerCount: number;
};

export type PrayerCard = PrayerRequest & {
  authorName: string;
  responseCount: number;
};

export type LeaderDashboard = {
  currentWeek: number;
  members: Array<{
    userId: string;
    displayName: string;
    role: Database["public"]["Enums"]["group_role"];
    totalTasks: number;
    completedTasks: number;
  }>;
  activeShareCount: number;
  leaderOnlyPrayerCount: number;
  trend: {
    postsThisWeek: number;
    commentsThisWeek: number;
    activePrayers: number;
  };
};

function requireAdmin() {
  return createSupabaseAdminClient();
}

export async function listDiscussion(groupId: string, weekNumber?: number): Promise<DiscussionPost[]> {
  const group = await getGroupForCurrentUser(groupId);
  const admin = requireAdmin();
  if (!group || !admin) {
    return [];
  }

  let postsQuery = admin
    .from("group_posts")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (weekNumber) {
    postsQuery = postsQuery.eq("week_number", weekNumber);
  }
  const { data: posts } = await postsQuery;
  const postIds = (posts ?? []).map((post) => post.id);
  if (!postIds.length) {
    return [];
  }

  const [{ data: comments }, { data: reactions }] = await Promise.all([
    admin.from("comments").select("*").in("post_id", postIds).eq("status", "active").order("created_at", { ascending: true }),
    admin.from("reactions").select("post_id,comment_id,reaction_type").in("post_id", postIds),
  ]);
  const userIds = [...new Set([
    ...(posts ?? []).map((post) => post.author_id),
    ...(comments ?? []).map((comment) => comment.author_id),
  ])];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("user_id,display_name").in("user_id", userIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name || "小组成员"]));
  const commentsByPost = new Map<string, DiscussionComment[]>();
  for (const comment of comments ?? []) {
    commentsByPost.set(comment.post_id, [
      ...(commentsByPost.get(comment.post_id) ?? []),
      { ...comment, authorName: names.get(comment.author_id) ?? "小组成员" },
    ]);
  }

  return (posts ?? []).map((post) => {
    const postReactions = (reactions ?? []).filter((reaction) => reaction.post_id === post.id);
    return {
      ...post,
      authorName: names.get(post.author_id) ?? "小组成员",
      comments: commentsByPost.get(post.id) ?? [],
      encouragementCount: postReactions.filter((reaction) => reaction.reaction_type === "encouragement").length,
      prayerCount: postReactions.filter((reaction) => reaction.reaction_type === "prayer").length,
    };
  });
}

export async function listVisiblePrayers(groupId: string): Promise<PrayerCard[]> {
  const group = await getGroupForCurrentUser(groupId);
  const userId = await getCurrentUserId();
  const admin = requireAdmin();
  if (!group || !userId || !admin) {
    return [];
  }

  const { data: requests } = await admin
    .from("prayer_requests")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  const visible = (requests ?? []).filter((request) =>
    isPrayerVisible({ status: request.status, expiresAt: request.expires_at })
    && canReadPrayer({
      visibility: request.visibility,
      authorId: request.author_id,
      actorId: userId,
      actorIsLeader: isLeaderRole(group.membership.role),
      isActiveMember: group.membership.status === "active",
    }),
  );
  const requestIds = visible.map((request) => request.id);
  const authorIds = [...new Set(visible.map((request) => request.author_id))];
  const [{ data: responses }, { data: profiles }] = await Promise.all([
    requestIds.length ? admin.from("prayer_responses").select("request_id").in("request_id", requestIds) : Promise.resolve({ data: [] }),
    authorIds.length ? admin.from("profiles").select("user_id,display_name").in("user_id", authorIds) : Promise.resolve({ data: [] }),
  ]);
  const counts = new Map<string, number>();
  for (const response of responses ?? []) {
    counts.set(response.request_id, (counts.get(response.request_id) ?? 0) + 1);
  }
  const names = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name || "小组成员"]));
  return visible.map((request) => ({
    ...request,
    authorName: names.get(request.author_id) ?? "小组成员",
    responseCount: counts.get(request.id) ?? 0,
  }));
}

export async function listUnreadNotifications() {
  const userId = await getCurrentUserId();
  const admin = requireAdmin();
  if (!userId || !admin) {
    return [];
  }
  const { data } = await admin
    .from("notifications")
    .select("id,notification_type,group_id,post_id,comment_id,prayer_request_id,metadata,created_at")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getLeaderDashboard(groupId: string): Promise<LeaderDashboard | null> {
  const group = await getGroupForCurrentUser(groupId);
  const admin = requireAdmin();
  if (!group || !admin || !isLeaderRole(group.membership.role)) {
    return null;
  }

  const [{ data: memberships }, { data: cohort }] = await Promise.all([
    admin.from("group_memberships").select("user_id,role,status").eq("group_id", groupId).eq("status", "active"),
    admin.from("cohorts").select("id,starts_on").eq("group_id", groupId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const currentWeek = cohort ? getCurrentCohortWeek(cohort.starts_on) : 1;
  const memberIds = (memberships ?? []).map((membership) => membership.user_id);
  const [{ data: profiles }, { data: cohortLessons }] = await Promise.all([
    memberIds.length ? admin.from("profiles").select("user_id,display_name").in("user_id", memberIds) : Promise.resolve({ data: [] }),
    cohort ? admin.from("cohort_lessons").select("lesson_id").eq("cohort_id", cohort.id).eq("week_number", currentWeek) : Promise.resolve({ data: [] }),
  ]);
  const lessonIds = (cohortLessons ?? []).map((lesson) => lesson.lesson_id);
  const { data: tasks } = lessonIds.length
    ? await admin.from("tasks").select("id").in("lesson_id", lessonIds)
    : { data: [] };
  const taskIds = (tasks ?? []).map((task) => task.id);
  const [{ data: completions }, { data: shares }, { data: leaderOnlyPrayers }, { data: posts }, { data: comments }, { data: activePrayers }] = await Promise.all([
    cohort && memberIds.length ? admin.from("task_completions").select("user_id,task_id,status").eq("cohort_id", cohort.id).in("user_id", memberIds).in("task_id", taskIds.length ? taskIds : ["00000000-0000-0000-0000-000000000000"]) : Promise.resolve({ data: [] }),
    admin.from("content_shares").select("entry_id").eq("target_group_id", groupId).eq("share_scope", "group").is("revoked_at", null),
    admin.from("prayer_requests").select("id").eq("group_id", groupId).eq("visibility", "leader_only").in("status", ["open", "continued"]),
    admin.from("group_posts").select("id").eq("group_id", groupId).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from("comments").select("id,post_id").gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from("prayer_requests").select("id").eq("group_id", groupId).in("status", ["open", "continued"]),
  ]);
  const names = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name || "小组成员"]));
  const completionByUser = new Map<string, number>();
  for (const completion of completions ?? []) {
    if (completion.status === "completed") {
      completionByUser.set(completion.user_id, (completionByUser.get(completion.user_id) ?? 0) + 1);
    }
  }

  return {
    currentWeek,
    members: (memberships ?? []).map((membership) => ({
      userId: membership.user_id,
      displayName: names.get(membership.user_id) ?? "小组成员",
      role: membership.role,
      totalTasks: taskIds.length,
      completedTasks: completionByUser.get(membership.user_id) ?? 0,
    })),
    activeShareCount: (shares ?? []).length,
    leaderOnlyPrayerCount: (leaderOnlyPrayers ?? []).length,
    trend: {
      postsThisWeek: (posts ?? []).length,
      commentsThisWeek: (comments ?? []).filter((comment) => (posts ?? []).some((post) => post.id === comment.post_id)).length,
      activePrayers: (activePrayers ?? []).length,
    },
  };
}
