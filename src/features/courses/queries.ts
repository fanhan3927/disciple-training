import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { getCurrentUserId, getGroupForCurrentUser } from "@/features/groups/queries";
import { isEntryShareVisible, isPublishedActiveCourse, isUnlockTimeReached } from "./authorization";
import { getPromptText, getWeekFromSequence } from "./content";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type CourseVersion = Database["public"]["Tables"]["course_versions"]["Row"];
type Cohort = Database["public"]["Tables"]["cohorts"]["Row"];
type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type Entry = Database["public"]["Tables"]["entries"]["Row"];
type Completion = Database["public"]["Tables"]["task_completions"]["Row"];

export type PublishedCourseVersion = CourseVersion & {
  course: Pick<Course, "id" | "title" | "slug">;
};

export type GroupCohort = Cohort & {
  courseTitle: string;
  courseVersion: string;
};

export type WeekLesson = Lesson & {
  weekNumber: number;
  unlockAt: string;
  isUnlocked: boolean;
  dueAt: string | null;
  taskCount: number;
  completedCount: number;
};

export type LessonDetail = Lesson & {
  cohort: Cohort;
  weekNumber: number;
  blocks: Array<Database["public"]["Tables"]["content_blocks"]["Row"]>;
  tasks: Array<
    Task & {
      promptText: string;
      completion: Pick<Completion, "status" | "completed_at" | "reflection_entry_id"> | null;
    }
  >;
  entries: Entry[];
};

export type ProgressSummary = {
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
};

export async function listPublishedCourseVersions(): Promise<PublishedCourseVersion[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return [];
  }

  const { data: versions } = await admin
    .from("course_versions")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const courseIds = [...new Set((versions ?? []).map((version) => version.course_id))];
  const { data: courses } = courseIds.length
    ? await admin.from("courses").select("id,title,slug,status").in("id", courseIds)
    : { data: [] };
  const coursesById = new Map((courses ?? []).map((course) => [course.id, course]));

  const result: PublishedCourseVersion[] = [];

  for (const version of versions ?? []) {
    const course = coursesById.get(version.course_id);
    if (course?.status === "active") {
      result.push({
        ...version,
        course: { id: course.id, title: course.title, slug: course.slug },
      });
    }
  }

  return result;
}

export async function getGroupCohort(groupId: string): Promise<GroupCohort | null> {
  const group = await getGroupForCurrentUser(groupId);
  if (!group) {
    redirect("/groups?error=not-found");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data: cohort } = await admin
    .from("cohorts")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cohort) {
    return null;
  }

  const { data: version } = await admin
    .from("course_versions")
    .select("id,course_id,version,status,published_at")
    .eq("id", cohort.course_version_id)
    .maybeSingle();
  const { data: course } = version
    ? await admin.from("courses").select("title,status").eq("id", version.course_id).maybeSingle()
    : { data: null };

  if (
    !version ||
    !course ||
    !isPublishedActiveCourse({
      versionStatus: version.status,
      publishedAt: version.published_at,
      courseStatus: course.status,
    })
  ) {
    return null;
  }

  return {
    ...cohort,
    courseTitle: course?.title ?? "未命名课程",
    courseVersion: version?.version ?? "",
  };
}

export async function listWeekLessons(groupId: string, weekNumber: number): Promise<WeekLesson[]> {
  const cohort = await getGroupCohort(groupId);
  const userId = await getCurrentUserId();
  const admin = createSupabaseAdminClient();

  if (!cohort || !userId || !admin) {
    return [];
  }

  const { data: cohortLessons } = await admin
    .from("cohort_lessons")
    .select("*")
    .eq("cohort_id", cohort.id)
    .eq("week_number", weekNumber)
    .order("unlock_at", { ascending: true });

  const lessonIds = (cohortLessons ?? []).map((item) => item.lesson_id);
  const [{ data: lessons }, { data: tasks }, { data: completions }] = await Promise.all([
    lessonIds.length ? admin.from("lessons").select("*").in("id", lessonIds) : Promise.resolve({ data: [] }),
    lessonIds.length ? admin.from("tasks").select("*").in("lesson_id", lessonIds) : Promise.resolve({ data: [] }),
    admin.from("task_completions").select("*").eq("cohort_id", cohort.id).eq("user_id", userId),
  ]);

  const lessonsById = new Map((lessons ?? []).map((lesson) => [lesson.id, lesson]));
  const tasksByLessonId = new Map<string, Task[]>();
  for (const task of tasks ?? []) {
    tasksByLessonId.set(task.lesson_id, [...(tasksByLessonId.get(task.lesson_id) ?? []), task]);
  }
  const completedTaskIds = new Set(
    (completions ?? [])
      .filter((completion) => completion.status === "completed")
      .map((completion) => completion.task_id),
  );

  return (cohortLessons ?? [])
    .map((cohortLesson) => {
      const lesson = lessonsById.get(cohortLesson.lesson_id);
      if (!lesson) {
        return null;
      }

      const lessonTasks = tasksByLessonId.get(lesson.id) ?? [];
      return {
        ...lesson,
        weekNumber: cohortLesson.week_number,
        unlockAt: cohortLesson.unlock_at,
        isUnlocked: isUnlockTimeReached(cohortLesson.unlock_at),
        dueAt: cohortLesson.due_at,
        taskCount: lessonTasks.length,
        completedCount: lessonTasks.filter((task) => completedTaskIds.has(task.id)).length,
      };
    })
    .filter((lesson): lesson is WeekLesson => lesson !== null);
}

export async function getLessonDetail(groupId: string, lessonId: string): Promise<LessonDetail | null> {
  const cohort = await getGroupCohort(groupId);
  const userId = await getCurrentUserId();
  const admin = createSupabaseAdminClient();

  if (!cohort || !userId || !admin) {
    return null;
  }

  const [{ data: cohortLesson }, { data: lesson }] = await Promise.all([
    admin.from("cohort_lessons").select("*").eq("cohort_id", cohort.id).eq("lesson_id", lessonId).maybeSingle(),
    admin.from("lessons").select("*").eq("id", lessonId).maybeSingle(),
  ]);

  if (!cohortLesson || !lesson) {
    return null;
  }

  const { data: courseModule } = await admin
    .from("modules")
    .select("course_version_id")
    .eq("id", lesson.module_id)
    .maybeSingle();

  if (
    !courseModule ||
    courseModule.course_version_id !== cohort.course_version_id ||
    !isUnlockTimeReached(cohortLesson.unlock_at)
  ) {
    return null;
  }

  const [{ data: blocks }, { data: tasks }, { data: completions }, { data: entries }] = await Promise.all([
    admin
      .from("content_blocks")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("theology_status", "approved")
      .eq("copyright_status", "approved")
      .eq("safety_status", "approved")
      .order("sequence", { ascending: true }),
    admin.from("tasks").select("*").eq("lesson_id", lessonId).order("sequence", { ascending: true }),
    admin.from("task_completions").select("*").eq("cohort_id", cohort.id).eq("user_id", userId),
    admin
      .from("entries")
      .select("*")
      .eq("author_id", userId)
      .eq("cohort_id", cohort.id)
      .eq("lesson_id", lessonId)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const completionsByTaskId = new Map((completions ?? []).map((completion) => [completion.task_id, completion]));

  return {
    ...lesson,
    cohort,
    weekNumber: cohortLesson.week_number,
    blocks: blocks ?? [],
    tasks: (tasks ?? []).map((task) => ({
      ...task,
      promptText: getPromptText(task.prompt_json),
      completion: completionsByTaskId.get(task.id) ?? null,
    })),
    entries: entries ?? [],
  };
}

export async function getUserProgress(groupId: string): Promise<ProgressSummary> {
  const cohort = await getGroupCohort(groupId);
  const userId = await getCurrentUserId();
  const admin = createSupabaseAdminClient();

  if (!cohort || !userId || !admin) {
    return { totalTasks: 0, completedTasks: 0, skippedTasks: 0 };
  }

  const { data: cohortLessons } = await admin.from("cohort_lessons").select("lesson_id").eq("cohort_id", cohort.id);
  const lessonIds = (cohortLessons ?? []).map((lesson) => lesson.lesson_id);
  const [{ data: tasks }, { data: completions }] = await Promise.all([
    lessonIds.length ? admin.from("tasks").select("id").in("lesson_id", lessonIds) : Promise.resolve({ data: [] }),
    admin.from("task_completions").select("status").eq("cohort_id", cohort.id).eq("user_id", userId),
  ]);

  return {
    totalTasks: tasks?.length ?? 0,
    completedTasks: (completions ?? []).filter((completion) => completion.status === "completed").length,
    skippedTasks: (completions ?? []).filter((completion) => completion.status === "skipped").length,
  };
}

export async function listSharedEntriesForGroup(groupId: string) {
  const group = await getGroupForCurrentUser(groupId);
  const admin = createSupabaseAdminClient();

  if (!group || !admin) {
    return [];
  }

  const isLeader = group.membership.role === "leader" || group.membership.role === "co_leader";
  const scopes: Array<"group" | "leader_only"> = isLeader ? ["group", "leader_only"] : ["group"];

  const { data: shares } = await admin
    .from("content_shares")
    .select("*")
    .eq("target_group_id", groupId)
    .in("share_scope", scopes)
    .is("revoked_at", null)
    .order("shared_at", { ascending: false });

  const entryIds = (shares ?? []).map((share) => share.entry_id);
  const { data: entries } = entryIds.length
    ? await admin.from("entries").select("*").in("id", entryIds).eq("status", "active").is("deleted_at", null)
    : { data: [] };

  const sharesByEntryId = new Map<string, NonNullable<typeof shares>[number][]>();
  for (const share of shares ?? []) {
    sharesByEntryId.set(share.entry_id, [...(sharesByEntryId.get(share.entry_id) ?? []), share]);
  }

  const now = new Date();
  return (entries ?? []).filter((entry) =>
    (sharesByEntryId.get(entry.id) ?? []).some((share) => isEntryShareVisible(entry, share, now)),
  );
}

export function getWeekNumberFromParam(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return getWeekFromSequence(Number.isFinite(parsed) ? parsed : 1);
}
