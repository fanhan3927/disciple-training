import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NoticeBanner } from "@/components/notice-banner";
import { TextField } from "@/components/text-field";
import { createGroupAction } from "@/features/groups/actions";
import { MAX_MEMBER_LIMIT } from "@/features/groups/constants";
import { requireOnboardedUser } from "@/features/groups/queries";
import { SupabaseConfigNotice } from "@/components/config-notice";

type NewGroupPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function NewGroupPage({ searchParams }: NewGroupPageProps) {
  const context = await requireOnboardedUser();

  if (!context.configured) {
    return <SupabaseConfigNotice />;
  }

  return (
    <section className="mx-auto grid max-w-2xl gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">创建小组</h1>
        <p className="mt-2 text-sm leading-6 text-ink/72">创建后你会成为本组 Leader。MVP 不创建公开目录。</p>
      </div>
      <NoticeBanner searchParams={searchParams} />
      <form action={createGroupAction} className="grid gap-4 rounded-lg border border-mist bg-white p-5 shadow-sm">
        <TextField label="小组名称" name="name" required />
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>描述</span>
          <textarea
            name="description"
            rows={4}
            className="rounded-md border border-mist bg-white px-3 py-2 text-base font-normal outline-none transition focus:border-pine focus-visible:shadow-focus"
          />
        </label>
        <TextField label="时区" name="timezone" defaultValue="Asia/Shanghai" required />
        <TextField label="人数上限" name="memberLimit" type="number" defaultValue="8" required />
        <p className="text-xs leading-5 text-ink/60">MVP 允许 2 到 {MAX_MEMBER_LIMIT} 人。</p>
        <label className="flex gap-3 rounded-md border border-gold/40 bg-gold/10 p-3 text-sm leading-6 text-ink/76">
          <input name="leaderCovenantAccepted" type="checkbox" required className="mt-1 size-4" />
          <span>我接受 Leader 盟约：只管理本组，不查看私人笔记或 AI 对话，并鼓励成员连接本地教会。</span>
        </label>
        <FormSubmitButton>创建小组</FormSubmitButton>
      </form>
      <Link href="/groups" className="text-sm font-semibold text-pine hover:text-ink">
        返回我的小组
      </Link>
    </section>
  );
}
