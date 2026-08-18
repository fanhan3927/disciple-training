import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupRoleBadge } from "@/components/group-role-badge";
import { NoticeBanner } from "@/components/notice-banner";
import { removeMemberAction } from "@/features/groups/actions";
import { getGroupForCurrentUser, listGroupMembers } from "@/features/groups/queries";

type MembersPageProps = {
  params: { groupId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const group = await getGroupForCurrentUser(params.groupId);
  if (!group) {
    notFound();
  }

  const members = await listGroupMembers(params.groupId);
  const isLeader = group.membership.role === "leader" || group.membership.role === "co_leader";

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">成员</h1>
        <p className="mt-2 text-sm text-ink/72">只显示当前小组成员，不跨组展示。</p>
      </div>
      <NoticeBanner searchParams={searchParams} />
      <div className="grid gap-3">
        {members.map((member) => (
          <article key={member.user_id} className="rounded-lg border border-mist bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">{member.profile?.display_name || "未命名成员"}</h2>
                <div className="mt-2">
                  <GroupRoleBadge role={member.role} status={member.status} />
                </div>
              </div>
              {isLeader && member.user_id !== group.created_by ? (
                <form action={removeMemberAction}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="userId" value={member.user_id} />
                  <button className="min-h-10 rounded-md border border-clay/40 px-3 py-2 text-sm font-semibold text-clay hover:bg-clay/10">
                    移除
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <Link href={`/groups/${group.id}`} className="text-sm font-semibold text-pine hover:text-ink">
        返回小组
      </Link>
    </section>
  );
}
