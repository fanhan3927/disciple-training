import Link from "next/link";
import { BoundaryBadge } from "@/components/boundary-badge";

const footerLinks = [
  { href: "/mission", label: "使命" },
  { href: "/beliefs", label: "信仰" },
  { href: "/boundaries", label: "边界" },
  { href: "/privacy", label: "隐私" },
  { href: "/terms", label: "条款" },
  { href: "/community-guidelines", label: "守则" },
];

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-field text-ink">
      <header className="border-b border-mist bg-white/90">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-sm font-semibold tracking-normal">
            AI 门徒训练平台
          </Link>
          <BoundaryBadge label="M0 基线" tone="neutral" />
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-mist bg-white">
        <nav
          aria-label="公共页面"
          className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-5 gap-y-3 px-4 py-5 text-sm text-ink/72 sm:px-6"
        >
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-pine">
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
