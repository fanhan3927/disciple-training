import type { EntryVisibility, ShareScope } from "@/lib/supabase/database.types";

export type EntryShareSnapshot = {
  share_scope: ShareScope;
  revoked_at: string | null;
};

export function getVisibilityNotice(visibility: EntryVisibility): string {
  if (visibility === "group") {
    return "当前小组活跃成员可见。";
  }

  if (visibility === "leader_only") {
    return "仅当前小组 Leader 和 co-leader 可见。";
  }

  return "仅你自己可见。";
}

export function hasActiveShare(shares: EntryShareSnapshot[], scope: ShareScope): boolean {
  return shares.some((share) => share.share_scope === scope && share.revoked_at === null);
}
