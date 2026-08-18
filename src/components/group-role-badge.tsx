import type { GroupRole, MembershipStatus } from "@/lib/supabase/database.types";

type GroupRoleBadgeProps = {
  role: GroupRole;
  status?: MembershipStatus;
};

const roleLabel: Record<GroupRole, string> = {
  leader: "Leader",
  co_leader: "Co-leader",
  member: "成员",
  observer: "观察员",
};

export function GroupRoleBadge({ role, status }: GroupRoleBadgeProps) {
  return (
    <span className="inline-flex w-fit rounded-md border border-mist bg-field px-2 py-1 text-xs font-semibold text-ink/76">
      {roleLabel[role]}
      {status && status !== "active" ? ` · ${status}` : ""}
    </span>
  );
}
