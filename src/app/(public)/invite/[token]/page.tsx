import Link from "next/link";
import { BoundaryBadge } from "@/components/boundary-badge";
import { FormSubmitButton } from "@/components/form-submit-button";
import { SupabaseConfigNotice } from "@/components/config-notice";
import { acceptInvitationAction } from "@/features/groups/actions";
import { previewInvitation } from "@/features/groups/queries";

type InvitePageProps = {
  params: { token: string };
};

export default async function InvitePage({ params }: InvitePageProps) {
  const preview = await previewInvitation(params.token);

  if (preview.status === "config") {
    return (
      <section className="mx-auto min-h-[calc(100dvh-118px)] max-w-xl px-4 py-8">
        <SupabaseConfigNotice />
      </section>
    );
  }

  if (preview.status === "invalid") {
    return (
      <section className="mx-auto grid min-h-[calc(100dvh-118px)] max-w-xl content-center gap-4 px-4 py-8">
        <BoundaryBadge label="邀请不可用" tone="warning" />
        <h1 className="text-2xl font-semibold">邀请无效或已过期</h1>
        <p className="text-sm leading-6 text-ink/72">请联系你的 Leader 重新发送邀请。此页面不会显示任何成员列表。</p>
        <Link href="/login" className="text-sm font-semibold text-pine hover:text-ink">
          登录
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto grid min-h-[calc(100dvh-118px)] max-w-xl content-center gap-5 px-4 py-8">
      <BoundaryBadge label="受邀加入" tone="safe" />
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">{preview.groupName}</h1>
        <p className="mt-2 text-sm leading-6 text-ink/72">
          {preview.leaderDisplayName} 邀请你加入这个熟人小组。预览只显示必要信息，不展示成员列表。
        </p>
      </div>
      <dl className="grid gap-2 rounded-lg border border-mist bg-white p-4 text-sm">
        <div>
          <dt className="font-semibold">角色</dt>
          <dd className="text-ink/72">{preview.roleToGrant === "observer" ? "观察员" : "成员"}</dd>
        </div>
        <div>
          <dt className="font-semibold">小组时区</dt>
          <dd className="text-ink/72">{preview.groupTimezone}</dd>
        </div>
        <div>
          <dt className="font-semibold">有效期至</dt>
          <dd className="text-ink/72">{preview.expiresAt}</dd>
        </div>
      </dl>
      <form action={acceptInvitationAction}>
        <input type="hidden" name="token" value={params.token} />
        <FormSubmitButton>接受邀请</FormSubmitButton>
      </form>
      <Link href="/login" className="text-sm font-semibold text-pine hover:text-ink">
        需要先登录或注册
      </Link>
    </section>
  );
}
