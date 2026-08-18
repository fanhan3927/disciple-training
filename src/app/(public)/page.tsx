import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BoundaryBadge } from "@/components/boundary-badge";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { VisibilityScope } from "@/components/visibility-scope";
import { t } from "@/i18n/zh-CN";

const principles = [
  "邀请制、默认私密，无公开广场",
  "角色按小组隔离，权限由数据库强制",
  "AI 仅作带出处课程助手，可随时关闭",
];

export default function HomePage() {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-118px)] w-full max-w-5xl content-start gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-12">
      <div className="space-y-6">
        <BoundaryBadge label={t("home.status")} tone="safe" />
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-normal text-ink sm:text-5xl">
            {t("home.title")}
          </h1>
          <p className="max-w-xl text-base leading-7 text-ink/76 sm:text-lg">
            {t("home.subtitle")}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/mission"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink focus-visible:shadow-focus"
          >
            <span>{t("home.primaryAction")}</span>
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link
            href="/boundaries"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-mist bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-pine focus-visible:shadow-focus"
          >
            <ShieldCheck aria-hidden="true" size={18} />
            <span>{t("home.secondaryAction")}</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border border-mist bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">{t("home.baselineTitle")}</h2>
          <ul className="mt-4 grid gap-3">
            {principles.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-ink/76">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-clay" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <VisibilityScope scope="private" />
        <div className="grid gap-3 rounded-lg border border-mist bg-white p-4 shadow-sm">
          <LoadingSkeleton label="课程壳加载状态" />
          <EmptyState title={t("home.emptyTitle")} body={t("home.emptyBody")} />
        </div>
      </div>
    </section>
  );
}
