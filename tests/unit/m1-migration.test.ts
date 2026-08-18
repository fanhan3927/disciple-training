import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/202607300001_m1_auth_consents.sql", "utf8");

describe("M1 migration", () => {
  it("enables RLS on client accessible tables", () => {
    expect(migration).toContain("alter table public.profiles enable row level security");
    expect(migration).toContain("alter table public.legal_documents enable row level security");
    expect(migration).toContain("alter table public.user_consents enable row level security");
  });

  it("does not grant direct consent writes to authenticated clients", () => {
    expect(migration).toContain("revoke all on public.user_consents from anon, authenticated");
    expect(migration).not.toMatch(/grant\s+insert\s+on\s+public\.user_consents\s+to\s+authenticated/i);
    expect(migration).toContain("grant execute on function public.grant_user_consent");
  });

  it("limits adult confirmation to a controlled database function", () => {
    expect(migration).toContain("adult_confirmed_at timestamptz");
    expect(migration).toContain("grant update (display_name, avatar_path, timezone, locale) on public.profiles");
    expect(migration).toContain("grant execute on function public.confirm_adult_profile");
  });
});
