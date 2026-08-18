import { Lock, type LucideIcon, UsersRound, UserRoundCheck } from "lucide-react";

type Scope = "private" | "leader_only" | "group";

type VisibilityScopeProps = {
  scope: Scope;
};

const scopeCopy: Record<Scope, { label: string; body: string; icon: LucideIcon }> = {
  private: {
    label: "默认私密",
    body: "私人灵修、代祷和 AI 对话默认仅本人可见。",
    icon: Lock,
  },
  leader_only: {
    label: "仅 Leader",
    body: "用户主动分享后，本组 Leader 可在受限场景查看。",
    icon: UserRoundCheck,
  },
  group: {
    label: "当前小组",
    body: "分享目标必须绑定当前小组，切组后需要再次确认。",
    icon: UsersRound,
  },
};

export function VisibilityScope({ scope }: VisibilityScopeProps) {
  const copy = scopeCopy[scope];
  const Icon = copy.icon;

  return (
    <section className="rounded-lg border border-mist bg-white p-4 shadow-sm" aria-label="可见范围">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-mist text-pine">
          <Icon aria-hidden="true" size={20} />
        </span>
        <div>
          <h2 className="text-base font-semibold">{copy.label}</h2>
          <p className="mt-1 text-sm leading-6 text-ink/72">{copy.body}</p>
        </div>
      </div>
    </section>
  );
}
