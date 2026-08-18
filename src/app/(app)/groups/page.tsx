import Link from "next/link";
import { BoundaryBadge } from "@/components/boundary-badge";
import { SupabaseConfigNotice } from "@/components/config-notice";
import { GroupRoleBadge } from "@/components/group-role-badge";
import { NoticeBanner } from "@/components/notice-banner";
import { listUserGroups, requireOnboardedUser } from "@/features/groups/queries";

type GroupsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const context = await requireOnboardedUser();

  if (!context.configured) {
    return <SupabaseConfigNotice />;
  }

  const groups = await listUserGroups();

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BoundaryBadge label="邀请制小组" tone="safe" />
          <h1 className="mt-3 text-2xl font-semibold tracking-normal">我的小组</h1>
          <p className="mt-2 text-sm leading-6 text-ink/72">没有公开小组目录。加入小组必须通过有效邀请。</p>
        </div>
        <Link
          href="/groups/new"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-ink focus-visible:shadow-focus"
        >
          创建小组
        </Link>
      </div>
      <NoticeBanner searchParams={searchParams} />

      {groups.length === 0 ? (
        <section className="rounded-lg border border-dashed border-mist bg-white p-5">
          <h2 className="text-base font-semibold">暂无小组</h2>
          <p className="mt-2 text-sm leading-6 text-ink/72">创建第一个熟人小组，或等待 Leader 发送邀请。</p>
        </section>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="rounded-lg border border-mist bg-white p-4 shadow-sm transition hover:border-pine focus-visible:shadow-focus"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{group.name}</h2>
                  <p className="mt-1 text-sm leading-6 text-ink/72">{group.description || "暂无描述"}</p>
                </div>
                <GroupRoleBadge role={group.membership.role} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
