import Link from "next/link";
import { BoundaryBadge } from "@/components/boundary-badge";
import { NoticeBanner } from "@/components/notice-banner";
import { getWeekNumberFromParam, listWeekLessons } from "@/features/courses/queries";

type WeekPageProps = {
  params: { groupId: string; weekId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function WeekPage({ params, searchParams }: WeekPageProps) {
  const weekNumber = getWeekNumberFromParam(params.weekId);
  const lessons = await listWeekLessons(params.groupId, weekNumber);

  return (
    <section className="grid gap-5">
      <div>
        <BoundaryBadge label={`第 ${weekNumber} 周`} tone="safe" />
        <h1 className="mt-3 text-2xl font-semibold tracking-normal">本周课程</h1>
        <p className="mt-2 text-sm leading-6 text-ink/72">没有排行榜，只显示你的个人完成情况。</p>
      </div>
      <NoticeBanner searchParams={searchParams} />
      {lessons.length ? (
        <div className="grid gap-3">
          {lessons.map((lesson) => {
            const content = (
              <>
                <h2 className="text-base font-semibold">{lesson.title}</h2>
                <p className="mt-2 text-sm text-ink/72">
                  {lesson.isUnlocked ? `${lesson.completedCount}/${lesson.taskCount} 个任务完成` : "尚未解锁"} · 解锁 {lesson.unlockAt}
                </p>
                {lesson.local_church_notice ? (
                  <p className="mt-2 text-xs leading-5 text-ink/60">{lesson.local_church_notice}</p>
                ) : null}
              </>
            );

            return lesson.isUnlocked ? (
              <Link
                key={lesson.id}
                href={`/groups/${params.groupId}/lesson/${lesson.id}`}
                className="rounded-lg border border-mist bg-white p-4 shadow-sm transition hover:border-pine focus-visible:shadow-focus"
              >
                {content}
              </Link>
            ) : (
              <div key={lesson.id} aria-disabled="true" className="rounded-lg border border-mist bg-mist/40 p-4 text-ink/60">
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-mist bg-white p-5">
          <h2 className="text-base font-semibold">暂无课程班次</h2>
          <p className="mt-2 text-sm text-ink/72">Leader 需要先在小组设置中创建课程班次。</p>
        </section>
      )}
      <Link href={`/groups/${params.groupId}`} className="text-sm font-semibold text-pine hover:text-ink">
        返回小组
      </Link>
    </section>
  );
}
