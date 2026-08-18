import { AlertTriangle } from "lucide-react";

export function SupabaseConfigNotice() {
  return (
    <section className="rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm leading-6 text-ink">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-clay" size={20} />
        <div>
          <h2 className="font-semibold">Supabase 尚未配置</h2>
          <p className="mt-1 text-ink/72">
            请在 `.env.local` 设置 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`
            和服务端 `SUPABASE_SERVICE_ROLE_KEY` 后再使用认证与同意流程。
          </p>
        </div>
      </div>
    </section>
  );
}
