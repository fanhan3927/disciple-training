"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupForCurrentUser } from "@/features/groups/queries";
import { isPublishedActiveCourse, isTaskInCohortBoundary } from "./authorization";
import { getWeekFromSequence } from "./content";
import {
  cohortFormSchema,
  entryFormSchema,
  entryIdSchema,
  entryShareSchema,
  taskActionSchema,
} from "./validation";

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

export async function createCohortAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = cohortFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const input = parsed.data;
  await assertGroupLeader(input.groupId, user.id);

  const { data: courseVersion } = await admin
    .from("course_versions")
    .select("id,course_id,status,published_at")
    .eq("id", input.courseVersionId)
    .maybeSingle();
  const { data: course } = courseVersion
    ? await admin.from("courses").select("status").eq("id", courseVersion.course_id).maybeSingle()
    : { data: null };

  if (!courseVersion || !course || !isPublishedActiveCourse(courseVersionToAuthorizationInput(courseVersion, course.status))) {
    redirect(`/groups/${input.groupId}/settings?error=course`);
  }

  const { data: cohort, error } = await admin
    .from("cohorts")
    .insert({
      group_id: input.groupId,
      course_version_id: input.courseVersionId,
      starts_on: input.startsOn,
      meeting_url: input.meetingUrl || null,
      meeting_schedule: input.meetingSchedule || null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !cohort) {
    redirect(`/groups/${input.groupId}/settings?error=cohort`);
  }

  const scheduleFailed = await generateCohortLessons(cohort.id, input.courseVersionId, input.startsOn);
  if (scheduleFailed) {
    await admin.from("cohorts").delete().eq("id", cohort.id).eq("created_by", user.id);
    redirect(`/groups/${input.groupId}/settings?error=cohort`);
  }
  redirect(`/groups/${input.groupId}?message=cohort-created`);
}

function courseVersionToAuthorizationInput(
  courseVersion: { status: "draft" | "review" | "published" | "retired"; published_at: string | null },
  courseStatus: "draft" | "active" | "retired",
) {
  return {
    versionStatus: courseVersion.status,
    publishedAt: courseVersion.published_at,
    courseStatus,
  };
}

export async function completeTaskAction(formData: FormData) {
  await upsertTaskCompletion(formData, "completed");
}

export async function skipTaskAction(formData: FormData) {
  await upsertTaskCompletion(formData, "skipped");
}

export async function createEntryAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = entryFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const input = parsed.data;
  await assertActiveGroupMember(input.groupId, user.id);
  await assertTaskInCohort(input.groupId, input.cohortId, input.lessonId, input.taskId);

  const { data: entry, error } = await admin
    .from("entries")
    .insert({
      author_id: user.id,
      group_id: input.groupId,
      cohort_id: input.cohortId,
      lesson_id: input.lessonId,
      task_id: input.taskId,
      entry_type: "reflection",
      visibility: input.visibility,
      body: input.body,
    })
    .select("*")
    .single();

  if (error || !entry) {
    redirect(`/groups/${input.groupId}/lesson/${input.lessonId}?error=entry`);
  }

  if (input.visibility === "group" || input.visibility === "leader_only") {
    const { error: shareError } = await admin.from("content_shares").insert({
      entry_id: entry.id,
      target_group_id: input.groupId,
      share_scope: input.visibility,
    });

    if (shareError) {
      await admin.from("entries").update({ visibility: "private" }).eq("id", entry.id);
      redirect(`/groups/${input.groupId}/lesson/${input.lessonId}?error=entry`);
    }
  }

  redirect(`/groups/${input.groupId}/lesson/${input.lessonId}?message=entry-created`);
}

export async function shareEntryAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = entryShareSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const input = parsed.data;
  await assertActiveGroupMember(input.groupId, user.id);
  const entry = await assertEntryAuthor(input.entryId, user.id);

  if (
    entry.status !== "active" ||
    entry.deleted_at !== null ||
    (entry.expires_at !== null && new Date(entry.expires_at).getTime() <= Date.now())
  ) {
    redirect(`/groups/${input.groupId}?error=entry`);
  }

  const { error: updateError } = await admin
    .from("entries")
    .update({ visibility: input.shareScope })
    .eq("id", input.entryId)
    .eq("author_id", user.id);
  const { error: shareError } = await admin.from("content_shares").insert({
    entry_id: input.entryId,
    target_group_id: input.groupId,
    share_scope: input.shareScope,
  });

  if (updateError || shareError) {
    redirect(`/groups/${input.groupId}?error=entry`);
  }

  redirect(`/groups/${input.groupId}?message=entry-shared`);
}

export async function revokeEntryShareAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = entryIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const input = parsed.data;
  await assertEntryAuthor(input.entryId, user.id);

  await admin
    .from("content_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("entry_id", input.entryId)
    .eq("target_group_id", input.groupId)
    .is("revoked_at", null);
  await admin.from("entries").update({ visibility: "private" }).eq("id", input.entryId);

  redirect(`/groups/${input.groupId}?message=entry-revoked`);
}

export async function deleteEntryAction(formData: FormData) {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = entryIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const input = parsed.data;
  await assertEntryAuthor(input.entryId, user.id);

  await admin
    .from("entries")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), body: "" })
    .eq("id", input.entryId);
  await admin
    .from("content_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("entry_id", input.entryId)
    .is("revoked_at", null);

  redirect(`/groups/${input.groupId}?message=entry-deleted`);
}

async function upsertTaskCompletion(formData: FormData, status: "completed" | "skipped") {
  const user = await requireActionUser();
  const admin = requireAdmin();
  const parsed = taskActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/groups?error=invalid");
  }

  const input = parsed.data;
  await assertActiveGroupMember(input.groupId, user.id);
  await assertTaskInCohort(input.groupId, input.cohortId, input.lessonId, input.taskId);

  const { error } = await admin.from("task_completions").upsert({
    task_id: input.taskId,
    user_id: user.id,
    cohort_id: input.cohortId,
    status,
    completed_at: status === "completed" ? new Date().toISOString() : null,
  });

  if (error) {
    redirect(`/groups/${input.groupId}/lesson/${input.lessonId}?error=task`);
  }

  redirect(`/groups/${input.groupId}/lesson/${input.lessonId}?message=task-${status}`);
}

async function generateCohortLessons(cohortId: string, courseVersionId: string, startsOn: string): Promise<boolean> {
  const admin = requireAdmin();
  const { data: modules, error: modulesError } = await admin
    .from("modules")
    .select("id,sequence")
    .eq("course_version_id", courseVersionId)
    .order("sequence", { ascending: true });
  if (modulesError) {
    return true;
  }

  const moduleIds = (modules ?? []).map((item) => item.id);
  const { data: lessons, error: lessonsError } = moduleIds.length
    ? await admin.from("lessons").select("id,module_id").in("module_id", moduleIds)
    : { data: [] };
  if (lessonsError) {
    return true;
  }
  const moduleById = new Map((modules ?? []).map((item) => [item.id, item]));
  const start = new Date(`${startsOn}T00:00:00.000Z`);

  const rows = (lessons ?? []).map((lesson) => {
    const courseModule = moduleById.get(lesson.module_id);
    const weekNumber = getWeekFromSequence(courseModule?.sequence ?? 1);
    const unlockAt = new Date(start.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
    const dueAt = new Date(unlockAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      cohort_id: cohortId,
      lesson_id: lesson.id,
      week_number: weekNumber,
      unlock_at: unlockAt.toISOString(),
      due_at: dueAt.toISOString(),
    };
  });

  if (rows.length) {
    const { error } = await admin.from("cohort_lessons").upsert(rows, { onConflict: "cohort_id,lesson_id" });
    return Boolean(error);
  }

  return false;
}

async function assertGroupLeader(groupId: string, userId: string) {
  const admin = requireAdmin();
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

async function assertActiveGroupMember(groupId: string, userId: string) {
  const group = await getGroupForCurrentUser(groupId);
  if (!group || !userId) {
    redirect("/groups?error=forbidden");
  }
}

async function assertTaskInCohort(groupId: string, cohortId: string, lessonId: string, taskId: string) {
  const admin = requireAdmin();
  const [{ data: cohort }, { data: cohortLesson }, { data: task }, { data: lesson }] = await Promise.all([
    admin.from("cohorts").select("group_id,course_version_id,status").eq("id", cohortId).maybeSingle(),
    admin.from("cohort_lessons").select("lesson_id").eq("cohort_id", cohortId).eq("lesson_id", lessonId).maybeSingle(),
    admin.from("tasks").select("id,lesson_id").eq("id", taskId).eq("lesson_id", lessonId).maybeSingle(),
    admin.from("lessons").select("id,module_id").eq("id", lessonId).maybeSingle(),
  ]);

  const { data: courseModule } = lesson
    ? await admin.from("modules").select("course_version_id").eq("id", lesson.module_id).maybeSingle()
    : { data: null };

  if (
    !cohort ||
    !cohortLesson ||
    !task ||
    !lesson ||
    !courseModule ||
    !isTaskInCohortBoundary({
      requestedGroupId: groupId,
      cohortGroupId: cohort.group_id,
      cohortStatus: cohort.status,
      cohortCourseVersionId: cohort.course_version_id,
      lessonCourseVersionId: courseModule.course_version_id,
      cohortLessonId: cohortLesson.lesson_id,
      requestedLessonId: lessonId,
      taskLessonId: task.lesson_id,
      requestedTaskId: taskId,
      taskId: task.id,
    })
  ) {
    redirect("/groups?error=forbidden");
  }
}

async function assertEntryAuthor(entryId: string, userId: string) {
  const admin = requireAdmin();
  const { data: entry } = await admin
    .from("entries")
    .select("author_id,status,deleted_at,expires_at")
    .eq("id", entryId)
    .eq("author_id", userId)
    .maybeSingle();

  if (!entry) {
    redirect("/groups?error=forbidden");
  }

  return entry;
}
