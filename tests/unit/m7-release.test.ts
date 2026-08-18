import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("M7 release guardrails", () => {
  it("has the required environment template and migration sequence", () => {
    expect(existsSync(".env.example")).toBe(true);
    for (const migration of [
      "202607300001_m1_auth_consents.sql",
      "202607300002_m2_groups_invitations.sql",
      "202607300003_m3_courses_tasks_entries.sql",
      "202607300004_m4_discussions_prayers.sql",
      "202607300005_m5_controlled_ai.sql",
      "202607300006_m6_safety_audit_rights.sql",
    ]) {
      expect(existsSync(`supabase/migrations/${migration}`)).toBe(true);
    }
  });

  it("does not put service-role credentials in client-facing source", () => {
    const source = readFileSync("src/lib/supabase/admin.ts", "utf8");
    expect(source).toContain("getSupabaseServiceRoleKey");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    expect(readFileSync(".gitignore", "utf8")).toMatch(/\.env/);
  });
});
