import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/202607300005_m5_controlled_ai.sql", "utf8");

describe("M5 migration", () => {
  it("creates reviewed knowledge and owner-scoped AI conversation tables", () => {
    for (const table of ["knowledge_chunks", "ai_threads", "ai_messages"]) {
      expect(migration).toContain(`public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
    expect(migration).toContain("knowledge_chunks_select_reviewed_published");
    expect(migration).toContain("ai_messages_select_thread_owner");
  });

  it("does not grant the AI path access to private entries or leader access to threads", () => {
    expect(migration).toContain("revoke all on public.ai_threads from anon, authenticated");
    expect(migration).toContain("revoke all on public.ai_messages from anon, authenticated");
    expect(migration).not.toMatch(/grant\s+select,\s*insert.*on\s+public\.ai_messages/i);
    expect(migration).not.toMatch(/create policy .*leader.*ai_messages/i);
    expect(migration).not.toMatch(/from\s+public\.entries/i);
  });
});
