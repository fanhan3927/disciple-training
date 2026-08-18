import { describe, expect, it } from "vitest";
import { cohortFormSchema } from "@/features/courses/validation";
import {
  isEntryShareVisible,
  isPublishedActiveCourse,
  isTaskInCohortBoundary,
  isUnlockTimeReached,
} from "@/features/courses/authorization";

describe("course authorization boundaries", () => {
  const validBoundary = {
    requestedGroupId: "group-a",
    cohortGroupId: "group-a",
    cohortStatus: "active" as const,
    cohortCourseVersionId: "course-v1",
    lessonCourseVersionId: "course-v1",
    cohortLessonId: "lesson-1",
    requestedLessonId: "lesson-1",
    taskLessonId: "lesson-1",
    requestedTaskId: "task-1",
    taskId: "task-1",
  };

  it("accepts only a task that belongs to the requested group's active cohort", () => {
    expect(isTaskInCohortBoundary(validBoundary)).toBe(true);
    expect(isTaskInCohortBoundary({ ...validBoundary, requestedGroupId: "group-b" })).toBe(false);
    expect(isTaskInCohortBoundary({ ...validBoundary, lessonCourseVersionId: "course-v2" })).toBe(false);
    expect(isTaskInCohortBoundary({ ...validBoundary, taskLessonId: "lesson-2" })).toBe(false);
  });

  it("hides revoked, expired, and deleted shares while allowing independent scopes", () => {
    const entry = {
      status: "active" as const,
      deleted_at: null,
      expires_at: null,
      visibility: "group" as const,
    };
    const share = { share_scope: "group" as const, revoked_at: null };
    const now = new Date("2026-08-18T00:00:00.000Z");

    expect(isEntryShareVisible(entry, share, now)).toBe(true);
    expect(isEntryShareVisible({ ...entry, visibility: "leader_only" }, share, now)).toBe(true);
    expect(isEntryShareVisible({ ...entry, expires_at: "2026-08-17T23:59:59.000Z" }, share, now)).toBe(false);
    expect(isEntryShareVisible({ ...entry, status: "deleted" }, share, now)).toBe(false);
    expect(isEntryShareVisible(entry, { ...share, revoked_at: "2026-08-17T23:59:59.000Z" }, now)).toBe(false);
  });

  it("rejects invalid calendar dates before they reach the database", () => {
    const valid = cohortFormSchema.safeParse({
      groupId: "00000000-0000-4000-8000-000000000001",
      courseVersionId: "00000000-0000-4000-8000-000000000002",
      startsOn: "2026-08-18",
    });
    const invalid = cohortFormSchema.safeParse({
      groupId: "00000000-0000-4000-8000-000000000001",
      courseVersionId: "00000000-0000-4000-8000-000000000002",
      startsOn: "2026-02-30",
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("requires an active published course version for a cohort", () => {
    expect(isPublishedActiveCourse({ versionStatus: "published", publishedAt: "2026-08-01T00:00:00.000Z", courseStatus: "active" })).toBe(true);
    expect(isPublishedActiveCourse({ versionStatus: "published", publishedAt: null, courseStatus: "active" })).toBe(false);
    expect(isPublishedActiveCourse({ versionStatus: "published", publishedAt: "2026-08-01T00:00:00.000Z", courseStatus: "retired" })).toBe(false);
  });

  it("keeps lessons locked until their unlock timestamp", () => {
    const now = new Date("2026-08-18T00:00:00.000Z");
    expect(isUnlockTimeReached("2026-08-17T23:59:59.000Z", now)).toBe(true);
    expect(isUnlockTimeReached("2026-08-18T00:00:01.000Z", now)).toBe(false);
    expect(isUnlockTimeReached("not-a-date", now)).toBe(false);
  });
});
