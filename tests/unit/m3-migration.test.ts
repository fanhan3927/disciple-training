import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/202607300003_m3_courses_tasks_entries.sql", "utf8");

describe("M3 migration", () => {
  it("creates course, cohort, task, entry and share tables with RLS", () => {
    for (const table of [
      "content_sources",
      "courses",
      "course_versions",
      "modules",
      "lessons",
      "content_blocks",
      "cohorts",
      "cohort_lessons",
      "tasks",
      "task_completions",
      "entries",
      "content_shares",
    ]) {
      expect(migration).toContain(`public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("keeps AI disabled for seed content and requires reviewed content blocks", () => {
    expect(migration).toContain("ai_approved boolean not null default false");
    expect(migration).toContain("content_blocks_select_reviewed_published");
    expect(migration).toContain("theology_status = 'approved'");
    expect(migration).toContain("copyright_status = 'approved'");
    expect(migration).toContain("safety_status = 'approved'");
  });

  it("does not grant direct client inserts for private entries or task completions", () => {
    expect(migration).toContain("revoke all on public.entries from anon, authenticated");
    expect(migration).toContain("revoke all on public.task_completions from anon, authenticated");
    expect(migration).not.toMatch(/grant\s+insert\s+on\s+public\.entries\s+to\s+authenticated/i);
    expect(migration).not.toMatch(/grant\s+insert\s+on\s+public\.task_completions\s+to\s+authenticated/i);
  });

  it("protects private entries through author-or-shared read rules", () => {
    expect(migration).toContain("can_read_entry");
    expect(migration).toContain("entries_select_author_or_shared");
    expect(migration).toContain("cs.revoked_at is null");
    expect(migration).toContain("e.expires_at is null or e.expires_at > now()");
    expect(migration).toContain("share_scope = 'leader_only'");
  });

  it("does not expose cohort lessons after a course version is unpublished", () => {
    expect(migration).toContain("public.is_published_course_version(c.course_version_id)");
  });

  it("does not seed licensed scripture text", () => {
    expect(migration).toContain("licensed_text text");
    expect(migration).not.toContain("insert into public.scripture_refs");
  });
});
