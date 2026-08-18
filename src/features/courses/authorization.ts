import type {
  CohortStatus,
  CourseStatus,
  CourseVersionStatus,
  EntryStatus,
  EntryVisibility,
  ShareScope,
} from "@/lib/supabase/database.types";

export function isPublishedActiveCourse(input: {
  versionStatus: CourseVersionStatus;
  publishedAt: string | null;
  courseStatus: CourseStatus;
}): boolean {
  return input.versionStatus === "published" && input.publishedAt !== null && input.courseStatus === "active";
}

export function isUnlockTimeReached(unlockAt: string, now = new Date()): boolean {
  const unlockTime = Date.parse(unlockAt);
  return Number.isFinite(unlockTime) && unlockTime <= now.getTime();
}

export type TaskBoundary = {
  requestedGroupId: string;
  cohortGroupId: string;
  cohortStatus: CohortStatus;
  cohortCourseVersionId: string;
  lessonCourseVersionId: string;
  cohortLessonId: string;
  requestedLessonId: string;
  taskLessonId: string;
  requestedTaskId: string;
  taskId: string;
};

export function isTaskInCohortBoundary(boundary: TaskBoundary): boolean {
  return (
    boundary.cohortStatus === "active" &&
    boundary.requestedGroupId === boundary.cohortGroupId &&
    boundary.cohortLessonId === boundary.requestedLessonId &&
    boundary.taskLessonId === boundary.requestedLessonId &&
    boundary.requestedTaskId === boundary.taskId &&
    boundary.cohortCourseVersionId === boundary.lessonCourseVersionId
  );
}

export type EntryShareBoundary = {
  status: EntryStatus;
  deleted_at: string | null;
  expires_at: string | null;
  visibility: EntryVisibility;
};

export type ShareBoundary = {
  share_scope: ShareScope;
  revoked_at: string | null;
};

export function isEntryShareVisible(
  entry: EntryShareBoundary,
  share: ShareBoundary,
  now = new Date(),
): boolean {
  const expiresAt = entry.expires_at ? new Date(entry.expires_at) : null;

  return (
    entry.status === "active" &&
    entry.deleted_at === null &&
    share.revoked_at === null &&
    (expiresAt === null || expiresAt.getTime() > now.getTime())
  );
}
