import Link from "next/link";
import { SupabaseConfigNotice } from "@/components/config-notice";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NoticeBanner } from "@/components/notice-banner";
import { updateConsentsAction } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/queries";

type PrivacySettingsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function hasConsent(consents: Array<{ consent_type: string; revoked_at: string | null }>, consentType: string) {
  return consents.some((consent) => consent.consent_type === consentType && consent.revoked_at === null);
}

export default async function PrivacySettingsPage({ searchParams }: PrivacySettingsPageProps) {
  const context = await requireUser();

  if (!context.configured) {
    return <SupabaseConfigNotice />;
  }

  return (
    <section className="mx-auto grid max-w-2xl gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">隐私与同意</h1>
        <p className="mt-2 text-sm leading-6 text-ink/72">
          必需同意项会关联具体文档版本和内容 hash。营销同意默认关闭。
        </p>
      </div>
      <NoticeBanner searchParams={searchParams} />
      <form action={updateConsentsAction} className="grid gap-4 rounded-lg border border-mist bg-white p-5 shadow-sm">
        <label className="flex gap-3 text-sm leading-6 text-ink/76">
          <input
            name="termsConsent"
            type="checkbox"
            required
            defaultChecked={hasConsent(context.consents, "terms")}
            className="mt-1 size-4"
          />
          <span>
            我同意 <Link href="/terms" className="font-semibold text-pine">服务条款</Link>。
          </span>
        </label>
        <label className="flex gap-3 text-sm leading-6 text-ink/76">
          <input
            name="privacyConsent"
            type="checkbox"
            required
            defaultChecked={hasConsent(context.consents, "privacy")}
            className="mt-1 size-4"
          />
          <span>
            我同意 <Link href="/privacy" className="font-semibold text-pine">隐私政策</Link>。
          </span>
        </label>
        <label className="flex gap-3 text-sm leading-6 text-ink/76">
          <input
            name="sensitiveDataConsent"
            type="checkbox"
            required
            defaultChecked={hasConsent(context.consents, "sensitive_data")}
            className="mt-1 size-4"
          />
          <span>
            我理解敏感数据处理和 <Link href="/ai-notice" className="font-semibold text-pine">AI 使用说明</Link>。
          </span>
        </label>
        <label className="flex gap-3 text-sm leading-6 text-ink/76">
          <input
            name="marketingConsent"
            type="checkbox"
            defaultChecked={hasConsent(context.consents, "marketing")}
            className="mt-1 size-4"
          />
          <span>我愿意接收产品更新。默认关闭，不影响使用。</span>
        </label>
        <FormSubmitButton>保存同意</FormSubmitButton>
      </form>
    </section>
  );
}
