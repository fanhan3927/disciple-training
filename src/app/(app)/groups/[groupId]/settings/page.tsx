import { notFound } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NoticeBanner } from "@/components/notice-banner";
import { TextField } from "@/components/text-field";
import { archiveGroupAction, leaveGroupAction, updateGroupAction } from "@/features/groups/actions";
import { MAX_MEMBER_LIMIT } from "@/features/groups/constants";
import { getGroupForCurrentUser } from "@/features/groups/queries";
import { createCohortAction } from "@/features/courses/actions";
import { getGroupCohort, listPublishedCourseVersions } from "@/features/courses/queries";

type GroupSettingsPageProps = {
  params: { groupId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function GroupSettingsPage({ params, searchParams }: GroupSettingsPageProps) {
  const group = await getGroupForCurrentUser(params.groupId);
  if (!group) {
    notFound();
  }

  const isLeader = group.membership.role === "leader" || group.membership.role === "co_leader";
  const [courses, cohort] = await Promise.all([listPublishedCourseVersions(), getGroupCohort(group.id)]);

  return (
    <section className="mx-auto grid max-w-2xl gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">小组设置</h1>
        <p className="mt-2 text-sm text-ink/72">Leader 权限只在当前小组内生效。</p>
      </div>
      <NoticeBanner searchParams={searchParams} />
      {isLeader ? (
        <form action={updateGroupAction} className="grid gap-4 rounded-lg border border-mist bg-white p-5 shadow-sm">
          <input type="hidden" name="groupId" value={group.id} />
          <TextField label="小组名称" name="name" defaultValue={group.name} required />
          <label className="grid gap-2 text-sm font-medium text-ink">
            <span>描述</span>
            <textarea
              name="description"
              rows={4}
              defaultValue={group.description}
              className="rounded-md border border-mist bg-white px-3 py-2 text-base font-normal outline-none transition focus:border-pine focus-visible:shadow-focus"
            />
          </label>
          <TextField label="时区" name="timezone" defaultValue={group.timezone} required />
          <TextField label="人数上限" name="memberLimit" type="number" defaultValue={String(group.member_limit)} required />
          <p className="text-xs leading-5 text-ink/60">MVP 允许 2 到 {MAX_MEMBER_LIMIT} 人。</p>
          <FormSubmitButton>保存设置</FormSubmitButton>
        </form>
      ) : null}
      {isLeader ? (
        <form action={createCohortAction} className="grid gap-4 rounded-lg border border-mist bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">课程班次</h2>
          {cohort ? (
            <p className="rounded-md border border-mist bg-mist p-3 text-sm text-pine">
              当前班次：{cohort.courseTitle}，开始日期 {cohort.starts_on}
            </p>
          ) : null}
          <input type="hidden" name="groupId" value={group.id} />
          <label className="grid gap-2 text-sm font-medium text-ink">
            <span>课程版本</span>
            <select
              name="courseVersionId"
              required
              className="min-h-11 rounded-md border border-mist bg-white px-3 py-2 text-base font-normal outline-none focus:border-pine"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course.title} · {course.version}
                </option>
              ))}
            </select>
          </label>
          <TextField label="开始日期" name="startsOn" type="date" required />
          <TextField label="外部会议链接" name="meetingUrl" type="url" />
          <TextField label="会议安排" name="meetingSchedule" />
          <p className="text-xs leading-5 text-ink/60">M3 不自建会议，不录制会议，只保存外部链接和文字安排。</p>
          <FormSubmitButton>{cohort ? "创建另一班次" : "创建课程班次"}</FormSubmitButton>
        </form>
      ) : null}
      <div className="grid gap-3 rounded-lg border border-mist bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">退出与归档</h2>
        <form action={leaveGroupAction}>
          <input type="hidden" name="groupId" value={group.id} />
          <button className="min-h-11 rounded-md border border-mist bg-white px-4 py-2 text-sm font-semibold hover:border-pine">
            退出小组
          </button>
        </form>
        {isLeader ? (
          <form action={archiveGroupAction}>
            <input type="hidden" name="groupId" value={group.id} />
            <button className="min-h-11 rounded-md border border-clay/40 px-4 py-2 text-sm font-semibold text-clay hover:bg-clay/10">
              归档小组
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
