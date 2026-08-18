import { SupabaseConfigNotice } from "@/components/config-notice";
import { requireUser } from "@/features/auth/queries";

export default async function DataSettingsPage() {
  const context = await requireUser();

  if (!context.configured) {
    return <SupabaseConfigNotice />;
  }

  return (
    <section className="mx-auto grid max-w-2xl gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">数据权利</h1>
        <p className="mt-2 text-sm leading-6 text-ink/72">
          数据导出和账号删除自助化将在 M6 实现。M1 先提供清晰入口，避免隐藏在客服流程后。
        </p>
      </div>
      <div className="rounded-lg border border-mist bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">可申请项目</h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/72">
          <li>导出本人 profile、同意记录和后续本人内容。</li>
          <li>申请账号删除，后续需包含冷静期和安全案件例外。</li>
          <li>退出小组将在 M2 小组权限完成后实现。</li>
        </ul>
      </div>
    </section>
  );
}
