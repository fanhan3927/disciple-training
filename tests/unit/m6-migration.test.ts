import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/202607300006_m6_safety_audit_rights.sql", "utf8");

describe("M6 safety and rights migration", () => {
  it("creates reports, safety cases, access logs and user-rights tables with RLS", () => {
    for (const table of ["reports", "safety_cases", "safety_case_access", "audit_events", "data_export_requests", "account_deletion_requests"]) {
      expect(migration).toContain(`public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("keeps case content and audit events out of ordinary client access", () => {
    expect(migration).toContain("revoke all on public.safety_cases from anon, authenticated");
    expect(migration).toContain("revoke all on public.safety_case_access from anon, authenticated");
    expect(migration).toContain("revoke all on public.audit_events from anon, authenticated");
    expect(migration).toContain("audit_events_metadata_object");
  });

  it("allows a member to report inside the current group and export/delete only their own account", () => {
    expect(migration).toContain("reports_insert_active_member");
    expect(migration).toContain("data_export_requests_owner");
    expect(migration).toContain("account_deletion_requests_owner");
    expect(migration).not.toMatch(/using\s*\(true\)/i);
  });
});
