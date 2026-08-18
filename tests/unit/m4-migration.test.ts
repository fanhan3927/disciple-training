import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/202607300004_m4_discussions_prayers.sql", "utf8");

describe("M4 migration", () => {
  it("creates group discussion, prayer, reaction and notification tables with RLS", () => {
    for (const table of [
      "group_posts",
      "comments",
      "reactions",
      "prayer_requests",
      "prayer_responses",
      "notifications",
    ]) {
      expect(migration).toContain(`public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("keeps posts and comments inside active group membership boundaries", () => {
    expect(migration).toContain("public.is_active_group_member(group_id, auth.uid())");
    expect(migration).toContain("public.is_active_group_member(p.group_id, auth.uid())");
    expect(migration).toContain("public.is_group_leader(group_id, auth.uid())");
    expect(migration).toContain("group_posts_select_active_members");
    expect(migration).toContain("comments_select_active_group_members");
  });

  it("does not expose private prayer requests to leaders or group members", () => {
    expect(migration).toContain("prayer_requests_select_author_or_allowed_scope");
    expect(migration).toContain("visibility = 'private' and author_id = auth.uid()");
    expect(migration).toContain("visibility = 'leader_only' and public.is_group_leader(group_id, auth.uid())");
    expect(migration).toContain("visibility = 'group' and public.is_active_group_member(group_id, auth.uid())");
    expect(migration).toContain("body text not null");
  });

  it("keeps notification payloads metadata-only and client inserts disabled", () => {
    expect(migration).toContain("metadata jsonb not null default '{}'::jsonb");
    expect(migration).toContain("notifications_metadata_object");
    expect(migration).toContain("revoke all on public.notifications from anon, authenticated");
    expect(migration).not.toMatch(/grant\s+insert\s+on\s+public\.notifications\s+to\s+authenticated/i);
  });

  it("does not add a public community policy", () => {
    expect(migration).not.toMatch(/using\s*\(true\)/i);
    expect(migration).toContain("public.is_active_group_member(group_id, auth.uid())");
  });

  it("does not grant clients permission to change ownership or group boundaries", () => {
    expect(migration).toContain("grant update (title, body, status, hidden_at, deleted_at) on public.group_posts");
    expect(migration).toContain("grant update (body, status, hidden_at, deleted_at) on public.comments");
    expect(migration).not.toContain("grant select, insert, update on public.group_posts");
    expect(migration).not.toContain("grant select, insert, update on public.comments");
  });
});
