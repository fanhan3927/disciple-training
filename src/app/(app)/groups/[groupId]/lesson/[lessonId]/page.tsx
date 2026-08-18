import Link from "next/link";
import { notFound } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NoticeBanner } from "@/components/notice-banner";
import { completeTaskAction, createEntryAction, skipTaskAction } from "@/features/courses/actions";
import { getJsonText } from "@/features/courses/content";
import { getVisibilityNotice } from "@/features/courses/privacy";
import { getLessonDetail } from "@/features/courses/queries";

type LessonPageProps = {
  params: { groupId: string; lessonId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
  const lesson = await getLessonDetail(params.groupId, params.lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">{lesson.title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink/72">{lesson.local_church_notice}</p>
      </div>
      <NoticeBanner searchParams={searchParams} />
      <div className="grid gap-3">
        {lesson.blocks.map((block) => (
          <article key={block.id} className="rounded-lg border border-mist bg-white p-4 shadow-sm">
            <p className="text-sm leading-7 text-ink/78">{getJsonText(block.body_json)}</p>
            <p className="mt-3 text-xs text-ink/52">来源定位：{block.source_locator}</p>
          </article>
        ))}
      </div>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">微任务</h2>
        {lesson.tasks.map((task) => (
          <article key={task.id} className="rounded-lg border border-mist bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">{task.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink/72">{task.promptText}</p>
                <p className="mt-1 text-xs text-ink/52">
                  {task.estimated_minutes} 分钟 · {task.completion?.status ?? "未完成"}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={completeTaskAction}>
                  <HiddenTaskFields groupId={params.groupId} cohortId={lesson.cohort.id} lessonId={lesson.id} taskId={task.id} />
                  <button className="min-h-10 rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white hover:bg-ink">
                    完成
                  </button>
                </form>
                <form action={skipTaskAction}>
                  <HiddenTaskFields groupId={params.groupId} cohortId={lesson.cohort.id} lessonId={lesson.id} taskId={task.id} />
                  <button className="min-h-10 rounded-md border border-mist bg-white px-3 py-2 text-sm font-semibold hover:border-pine">
                    跳过
                  </button>
                </form>
              </div>
            </div>
            <form action={createEntryAction} className="mt-4 grid gap-3 border-t border-mist pt-4">
              <HiddenTaskFields groupId={params.groupId} cohortId={lesson.cohort.id} lessonId={lesson.id} taskId={task.id} />
              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>私人记录</span>
                <textarea
                  name="body"
                  rows={4}
                  className="rounded-md border border-mist bg-white px-3 py-2 text-base font-normal outline-none transition focus:border-pine focus-visible:shadow-focus"
                  placeholder="默认仅自己可见。不要写入他人隐私。"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>可见范围</span>
                <select
                  name="visibility"
                  defaultValue="private"
                  className="min-h-11 rounded-md border border-mist bg-white px-3 py-2 text-base font-normal outline-none focus:border-pine"
                >
                  <option value="private">{getVisibilityNotice("private")}</option>
                  <option value="leader_only">{getVisibilityNotice("leader_only")}</option>
                  <option value="group">{getVisibilityNotice("group")}</option>
                </select>
              </label>
              <FormSubmitButton>保存记录</FormSubmitButton>
            </form>
          </article>
        ))}
      </section>
      <section className="rounded-lg border border-mist bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">我的记录</h2>
        {lesson.entries.length ? (
          <div className="mt-3 grid gap-3">
            {lesson.entries.map((entry) => (
              <article key={entry.id} className="rounded-md border border-mist bg-field p-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink/78">{entry.body}</p>
                <p className="mt-2 text-xs text-ink/52">{getVisibilityNotice(entry.visibility)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink/60">暂无记录。</p>
        )}
      </section>
      <Link href={`/groups/${params.groupId}/week/${lesson.weekNumber}`} className="text-sm font-semibold text-pine hover:text-ink">
        返回本周课程
      </Link>
    </section>
  );
}

function HiddenTaskFields({
  groupId,
  cohortId,
  lessonId,
  taskId,
}: {
  groupId: string;
  cohortId: string;
  lessonId: string;
  taskId: string;
}) {
  return (
    <>
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="cohortId" value={cohortId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="taskId" value={taskId} />
    </>
  );
}
