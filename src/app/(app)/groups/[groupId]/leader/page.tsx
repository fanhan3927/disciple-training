import Link from "next/link";
import { notFound } from "next/navigation";
import { NoticeBanner } from "@/components/notice-banner";
import { getGroupForCurrentUser } from "@/features/groups/queries";
import { getLeaderDashboard } from "@/features/discussions/queries";

export default async function LeaderPage({ params, searchParams }: { params: { groupId: string }; searchParams?: Record<string, string | string[] | undefined> }) {
  const group = await getGroupForCurrentUser(params.groupId);
  if (!group) notFound();
  const dashboard = await getLeaderDashboard(group.id);
  if (!dashboard) notFound();
  return <section className="grid gap-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-pine">Leader 面板</p><h1 className="mt-2 text-2xl font-semibold">只看汇总，不看私人正文</h1><p className="mt-2 text-sm leading-6 text-ink/72">这里展示成员、课程完成计数、主动分享数量和组级趋势；私人灵修、私人代祷和 AI 对话不会出现在面板中。</p></div><Link className="text-sm font-semibold text-pine hover:text-ink" href={`/groups/${group.id}`}>返回小组</Link></div><NoticeBanner searchParams={searchParams} /><div className="grid gap-3 sm:grid-cols-4"><Metric label="当前周" value={`第 ${dashboard.currentWeek} 周`} /><Metric label="主动分享" value={String(dashboard.activeShareCount)} /><Metric label="Leader-only 请求" value={String(dashboard.leaderOnlyPrayerCount)} /><Metric label="进行中代祷" value={String(dashboard.trend.activePrayers)} /></div><section className="rounded-lg border border-mist bg-white p-5 shadow-sm"><h2 className="text-base font-semibold">本周组级趋势</h2><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><p>讨论：<strong>{dashboard.trend.postsThisWeek}</strong></p><p>回应：<strong>{dashboard.trend.commentsThisWeek}</strong></p><p>代祷请求：<strong>{dashboard.trend.activePrayers}</strong></p></div></section><section className="rounded-lg border border-mist bg-white p-5 shadow-sm"><h2 className="text-base font-semibold">成员课程进度</h2><div className="mt-4 grid gap-3">{dashboard.members.map((member) => <div key={member.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-field p-3"><div><p className="text-sm font-semibold">{member.displayName}</p><p className="mt-1 text-xs text-ink/56">{member.role}</p></div><p className="text-sm text-ink/72">{member.completedTasks}/{member.totalTasks} 项完成</p></div>)}</div></section><p className="text-xs leading-5 text-ink/52">进度是协作摘要，不是属灵评分，也不能用于比较成员或推断个人状态。</p></section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-mist bg-white p-4 shadow-sm"><p className="text-xs text-ink/56">{label}</p><p className="mt-2 text-xl font-semibold text-pine">{value}</p></div>; }
