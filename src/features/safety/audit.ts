import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

const forbiddenKeys = new Set(["body", "content", "private_text", "ai_prompt", "prompt", "response"]);
export function sanitizeAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> { return Object.fromEntries(Object.entries(metadata).filter(([key]) => !forbiddenKeys.has(key))); }
export async function writeAuditEvent(input: { actorId?: string | null; targetUserId?: string | null; groupId?: string | null; eventType: string; targetType?: string | null; targetId?: string | null; metadata?: Record<string, unknown> }) {
  const admin = createSupabaseAdminClient(); if (!admin) return;
  await admin.from("audit_events").insert({ actor_id: input.actorId ?? null, target_user_id: input.targetUserId ?? null, group_id: input.groupId ?? null, event_type: input.eventType, target_type: input.targetType ?? null, target_id: input.targetId ?? null, metadata: sanitizeAuditMetadata(input.metadata ?? {}) as Json });
}
