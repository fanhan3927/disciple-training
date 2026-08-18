import Link from "next/link";
import { signOutAction } from "@/features/auth/actions";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-field text-ink">
      <header className="border-b border-mist bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/home" className="text-sm font-semibold">
            AI 门徒训练平台
          </Link>
          <nav className="flex items-center gap-4 text-sm text-ink/72" aria-label="应用导航">
            <Link href="/settings/profile" className="hover:text-pine">
              资料
            </Link>
            <Link href="/groups" className="hover:text-pine">
              小组
            </Link>
            <Link href="/settings/privacy" className="hover:text-pine">
              隐私
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="font-semibold text-pine hover:text-ink">
                退出
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
