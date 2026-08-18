import { SupabaseConfigNotice } from "@/components/config-notice";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NoticeBanner } from "@/components/notice-banner";
import { TextField } from "@/components/text-field";
import { updateProfileAction } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/queries";

type ProfilePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const context = await requireUser();

  if (!context.configured) {
    return <SupabaseConfigNotice />;
  }

  return (
    <section className="mx-auto grid max-w-2xl gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">个人资料</h1>
        <p className="mt-2 text-sm leading-6 text-ink/72">
          资料用于组内识别。成人确认只记录确认时间，不保存证件信息。
        </p>
      </div>
      <NoticeBanner searchParams={searchParams} />
      <form action={updateProfileAction} className="grid gap-4 rounded-lg border border-mist bg-white p-5 shadow-sm">
        <TextField label="显示名" name="displayName" defaultValue={context.profile?.display_name ?? ""} required />
        <TextField label="时区" name="timezone" defaultValue={context.profile?.timezone ?? "Asia/Shanghai"} required />
        <TextField label="界面语言" name="locale" defaultValue={context.profile?.locale ?? "zh-CN"} required />
        {!context.profile?.adult_confirmed_at ? (
          <label className="flex gap-3 rounded-md border border-gold/40 bg-gold/10 p-3 text-sm leading-6 text-ink/76">
            <input name="adultConfirmed" type="checkbox" required className="mt-1 size-4" />
            <span>我确认自己已满 18 岁。</span>
          </label>
        ) : (
          <p className="rounded-md border border-mist bg-mist p-3 text-sm text-pine">成人确认已完成。</p>
        )}
        <FormSubmitButton>保存资料</FormSubmitButton>
      </form>
    </section>
  );
}
