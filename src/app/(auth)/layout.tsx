import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-field text-ink">
      <header className="border-b border-mist bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-sm font-semibold">
            AI 门徒训练平台
          </Link>
          <Link href="/privacy" className="text-sm text-ink/72 hover:text-pine">
            隐私
          </Link>
        </div>
      </header>
      <main className="px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
