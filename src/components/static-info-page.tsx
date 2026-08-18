import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BoundaryBadge } from "@/components/boundary-badge";

type StaticInfoPageProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export function StaticInfoPage({ eyebrow, title, body }: StaticInfoPageProps) {
  return (
    <section className="mx-auto min-h-[calc(100dvh-118px)] w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <BoundaryBadge label={eyebrow} tone="neutral" />
      <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-ink/76">{body}</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-mist bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-pine focus-visible:shadow-focus"
      >
        <ArrowLeft aria-hidden="true" size={18} />
        <span>返回首页</span>
      </Link>
    </section>
  );
}
