import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { SupabaseConfigNotice } from "@/components/config-notice";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NoticeBanner } from "@/components/notice-banner";
import { TextField } from "@/components/text-field";
import { signUpAction } from "@/features/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type SignupPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  const configured = isSupabaseConfigured();

  return (
    <AuthCard title="注册" description="MVP 仅限受邀熟人小组成员使用。">
      <div className="grid gap-4">
        <NoticeBanner searchParams={searchParams} />
        {!configured ? <SupabaseConfigNotice /> : null}
        <form action={signUpAction} className="grid gap-4">
          <TextField label="邮箱" name="email" type="email" required autoComplete="email" />
          <TextField label="密码" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <TextField label="显示名" name="displayName" required autoComplete="name" />
          <TextField label="时区" name="timezone" defaultValue="Asia/Shanghai" required />
          <input type="hidden" name="locale" value="zh-CN" />

          <fieldset className="grid gap-3 rounded-md border border-mist p-3">
            <legend className="px-1 text-sm font-semibold text-ink">必需确认</legend>
            <label className="flex gap-3 text-sm leading-6 text-ink/76">
              <input name="adultConfirmed" type="checkbox" required className="mt-1 size-4" />
              <span>我确认自己已满 18 岁。</span>
            </label>
            <label className="flex gap-3 text-sm leading-6 text-ink/76">
              <input name="termsConsent" type="checkbox" required className="mt-1 size-4" />
              <span>
                我同意 <Link href="/terms" className="font-semibold text-pine">服务条款</Link>。
              </span>
            </label>
            <label className="flex gap-3 text-sm leading-6 text-ink/76">
              <input name="privacyConsent" type="checkbox" required className="mt-1 size-4" />
              <span>
                我同意 <Link href="/privacy" className="font-semibold text-pine">隐私政策</Link>。
              </span>
            </label>
            <label className="flex gap-3 text-sm leading-6 text-ink/76">
              <input name="sensitiveDataConsent" type="checkbox" required className="mt-1 size-4" />
              <span>我理解灵修、代祷和 AI 对话属于敏感内容，并同意按隐私政策处理。</span>
            </label>
            <label className="flex gap-3 text-sm leading-6 text-ink/76">
              <input name="marketingConsent" type="checkbox" className="mt-1 size-4" />
              <span>我愿意接收产品更新。默认不勾选，不影响使用。</span>
            </label>
          </fieldset>

          <FormSubmitButton>创建账号</FormSubmitButton>
        </form>
        <p className="text-center text-sm text-ink/72">
          已有账号？{" "}
          <Link href="/login" className="font-semibold text-pine hover:text-ink">
            登录
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
