import Link from "next/link";
import { redirect } from "next/navigation";
import { BoundaryBadge } from "@/components/boundary-badge";
import { SupabaseConfigNotice } from "@/components/config-notice";
import { NoticeBanner } from "@/components/notice-banner";
import { requireUser } from "@/features/auth/queries";

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AuthenticatedHomePage({ searchParams }: HomePageProps) {
  const context = await requireUser();

  if (!context.configured) {
    return <SupabaseConfigNotice />;
  }

  if (!context.onboarding.completed) {
    redirect(context.onboarding.adultConfirmed ? "/settings/privacy" : "/settings/profile");
  }

  return (
    <section className="grid gap-6">
      <NoticeBanner searchParams={searchParams} />
      <BoundaryBadge label="M1 前置条件完成" tone="safe" />
      <div className="rounded-lg border border-mist bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal">等待邀请或进入小组</h1>
        <p className="mt-2 text-sm leading-6 text-ink/72">
          认证、成人确认和必需同意已经完成。现在可以创建或加入受邀熟人小组。
        </p>
        <Link
          href="/groups"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-mist bg-white px-4 py-2 text-sm font-semibold hover:border-pine focus-visible:shadow-focus"
        >
          进入小组
        </Link>
      </div>
    </section>
  );
}
