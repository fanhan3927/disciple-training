import Link from "next/link";
import { notFound } from "next/navigation";
import { BoundaryBadge } from "@/components/boundary-badge";
import { FormSubmitButton } from "@/components/form-submit-button";
import { GroupRoleBadge } from "@/components/group-role-badge";
import { NoticeBanner } from "@/components/notice-banner";
import { TextField } from "@/components/text-field";
import { createInvitationAction } from "@/features/groups/actions";
import { DEFAULT_INVITE_EXPIRES_HOURS, DEFAULT_INVITE_MAX_USES } from "@/features/groups/constants";
import { getGroupForCurrentUser } from "@/features/groups/queries";
import { getGroupCohort, getUserProgress, listSharedEntriesForGroup } from "@/features/courses/queries";
import { deleteEntryAction, revokeEntryShareAction } from "@/features/courses/actions";

type GroupPageProps = {
  params: { groupId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function getParam(searchParams: GroupPageProps["searchParams"], key: string): string | null {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function GroupPage({ params, searchParams }: GroupPageProps) {
  const group = await getGroupForCurrentUser(params.groupId);

  if (!group) {
    notFound();
  }

  const invite = getParam(searchParams, "invite");
  const isLeader = group.membership.role === "leader" || group.membership.role === "co_leader";
  const [cohort, progress, sharedEntries] = await Promise.all([
    getGroupCohort(group.id),
    getUserProgress(group.id),
    listSharedEntriesForGroup(group.id),
  ]);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BoundaryBadge label="当前小组" tone="safe" />
          <h1 className="mt-3 text-2xl font-semibold tracking-normal">{group.name}</h1>
          <p className="mt-2 text-sm leading-6 text-ink/72">{group.description || "暂无描述"}</p>
          <div className="mt-3">
            <GroupRoleBadge role={group.membership.role} />
          </div>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link className="rounded-md border border-mist bg-white px-3 py-2 font-semibold hover:border-pine" href={`/groups/${group.id}/members`}>
            成员
          </Link>
          <Link className="rounded-md border border-mist bg-white px-3 py-2 font-semibold hover:border-pine" href={`/groups/${group.id}/settings`}>
            设置
          </Link>
          <Link className="rounded-md border border-mist bg-white px-3 py-2 font-semibold hover:border-pine" href={`/groups/${group.id}/discussion`}>讨论</Link>
          <Link className="rounded-md border border-mist bg-white px-3 py-2 font-semibold hover:border-pine" href={`/groups/${group.id}/prayer`}>代祷</Link>
          {isLeader ? <Link className="rounded-md border border-mist bg-white px-3 py-2 font-semibold hover:border-pine" href={`/groups/${group.id}/leader`}>Leader 面板</Link> : null}
        </nav>
      </div>
      <NoticeBanner searchParams={searchParams} />
      <section className="rounded-lg border border-mist bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">当前课程</h2>
        {cohort ? (
          <div className="mt-3 grid gap-4">
            <p className="text-sm leading-6 text-ink/72">
              {cohort.courseTitle} · {cohort.courseVersion} · 开始日期 {cohort.starts_on}
            </p>
            <div className="text-sm text-ink/72">
              个人进度：{progress.completedTasks}/{progress.totalTasks} 完成
              {progress.skippedTasks ? `，${progress.skippedTasks} 跳过` : ""}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[1, 2, 3, 4].map((week) => (
                <Link
                  key={week}
                  href={`/groups/${group.id}/week/${week}`}
                  className="min-h-11 rounded-md border border-mist px-3 py-2 text-center text-sm font-semibold hover:border-pine"
                >
                  第 {week} 周
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink/72">
            尚未创建课程班次。Leader 可在小组设置中选择已发布课程并设置开始日期。
          </p>
        )}
      </section>
      {invite ? (
        <section className="rounded-lg border border-gold/40 bg-gold/10 p-4">
          <h2 className="text-base font-semibold">邀请链接仅显示一次</h2>
          <p className="mt-2 break-all font-mono text-xs text-ink/76">{`http://localhost:3100/invite/${invite}`}</p>
          <p className="mt-2 text-sm text-ink/72">数据库只保存 token hash。离开此页后无法再次查看原始 token。</p>
        </section>
      ) : null}
      {isLeader ? (
        <form action={createInvitationAction} className="grid gap-4 rounded-lg border border-mist bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">创建邀请</h2>
          <input type="hidden" name="groupId" value={group.id} />
          <TextField label="有效小时数" name="expiresHours" type="number" defaultValue={String(DEFAULT_INVITE_EXPIRES_HOURS)} required />
          <TextField label="最大使用次数" name="maxUses" type="number" defaultValue={String(DEFAULT_INVITE_MAX_USES)} required />
          <label className="grid gap-2 text-sm font-medium text-ink">
            <span>加入角色</span>
            <select name="roleToGrant" className="min-h-11 rounded-md border border-mist bg-white px-3 py-2 text-base font-normal outline-none focus:border-pine">
              <option value="member">成员</option>
              <option value="observer">观察员</option>
            </select>
          </label>
          <FormSubmitButton>生成邀请</FormSubmitButton>
        </form>
      ) : null}
      <section className="rounded-lg border border-mist bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">主动分享</h2>
        <p className="mt-1 text-sm leading-6 text-ink/72">只显示成员主动分享到当前小组或仅 Leader 的记录。</p>
        {sharedEntries.length ? (
          <div className="mt-4 grid gap-3">
            {sharedEntries.map((entry) => (
              <article key={entry.id} className="rounded-md border border-mist bg-field p-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink/78">{entry.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={revokeEntryShareAction}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="entryId" value={entry.id} />
                    <button className="rounded-md border border-mist bg-white px-3 py-2 text-xs font-semibold hover:border-pine">
                      撤回分享
                    </button>
                  </form>
                  <form action={deleteEntryAction}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="entryId" value={entry.id} />
                    <button className="rounded-md border border-clay/40 px-3 py-2 text-xs font-semibold text-clay hover:bg-clay/10">
                      删除
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink/60">暂无主动分享内容。</p>
        )}
      </section>
    </section>
  );
}
