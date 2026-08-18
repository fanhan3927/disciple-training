import Link from "next/link";
import { BoundaryBadge } from "@/components/boundary-badge";
import type { LegalDocument } from "@/lib/legal-documents";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <article className="mx-auto min-h-[calc(100dvh-118px)] w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <BoundaryBadge label={`版本 ${document.version}`} tone="neutral" />
      <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-ink sm:text-4xl">
        {document.title}
      </h1>
      <p className="mt-4 text-base leading-7 text-ink/76">{document.summary}</p>
      <dl className="mt-5 grid gap-2 rounded-lg border border-mist bg-white p-4 text-sm text-ink/72">
        <div>
          <dt className="font-semibold text-ink">文档类型</dt>
          <dd>{document.type}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">内容 Hash</dt>
          <dd className="break-all font-mono text-xs">{document.hash}</dd>
        </div>
      </dl>
      <div className="mt-8 grid gap-6">
        {document.sections.map((section) => (
          <section key={section.heading} className="rounded-lg border border-mist bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-normal text-ink">{section.heading}</h2>
            <p className="mt-2 text-sm leading-7 text-ink/76">{section.body}</p>
          </section>
        ))}
      </div>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md border border-mist bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-pine focus-visible:shadow-focus"
      >
        返回首页
      </Link>
    </article>
  );
}
