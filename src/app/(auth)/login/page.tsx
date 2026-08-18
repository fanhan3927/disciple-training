import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { SupabaseConfigNotice } from "@/components/config-notice";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NoticeBanner } from "@/components/notice-banner";
import { TextField } from "@/components/text-field";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resetPasswordAction, signInAction } from "@/features/auth/actions";

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const configured = isSupabaseConfigured();

  return (
    <AuthCard title="登录" description="使用受邀邮箱进入你的门徒训练空间。">
      <div className="grid gap-4">
        <NoticeBanner searchParams={searchParams} />
        {!configured ? <SupabaseConfigNotice /> : null}
        <form action={signInAction} className="grid gap-4">
          <TextField label="邮箱" name="email" type="email" required autoComplete="email" />
          <TextField label="密码" name="password" type="password" required autoComplete="current-password" />
          <FormSubmitButton>登录</FormSubmitButton>
        </form>
        <form action={resetPasswordAction} className="grid gap-3 border-t border-mist pt-4">
          <TextField label="发送密码恢复邮件" name="email" type="email" required autoComplete="email" />
          <button
            type="submit"
            className="min-h-11 rounded-md border border-mist bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-pine focus-visible:shadow-focus"
          >
            发送恢复邮件
          </button>
        </form>
        <p className="text-center text-sm text-ink/72">
          还没有账号？{" "}
          <Link href="/signup" className="font-semibold text-pine hover:text-ink">
            注册
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
