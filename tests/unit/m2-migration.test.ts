import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/202607300002_m2_groups_invitations.sql", "utf8");

describe("M2 migration", () => {
  it("creates group tables and enables RLS", () => {
    expect(migration).toContain("create table if not exists public.groups");
    expect(migration).toContain("create table if not exists public.group_memberships");
    expect(migration).toContain("create table if not exists public.group_invitations");
    expect(migration).toContain("alter table public.groups enable row level security");
    expect(migration).toContain("alter table public.group_memberships enable row level security");
    expect(migration).toContain("alter table public.group_invitations enable row level security");
  });

  it("stores invitation hashes and does not grant direct invite inserts to clients", () => {
    expect(migration).toContain("token_hash text not null unique");
    expect(migration).toContain("group_invitations_hash_format");
    expect(migration).toContain("revoke all on public.group_invitations from anon, authenticated");
    expect(migration).not.toMatch(/grant\s+insert\s+on\s+public\.group_invitations\s+to\s+authenticated/i);
  });

  it("prevents removing the only active leader from an active group", () => {
    expect(migration).toContain("prevent_last_leader_removal");
    expect(migration).toContain("Cannot remove the only active leader");
  });

  it("does not create public group directory policies", () => {
    expect(migration).toContain("groups_select_active_members");
    expect(migration).not.toMatch(/to\s+anon\s+using/i);
  });
});
