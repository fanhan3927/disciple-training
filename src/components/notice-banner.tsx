type NoticeBannerProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const messages: Record<string, string> = {
  "post-created": "讨论已发布。",
  "comment-created": "回应已发布。",
  "reaction-updated": "互动已更新。",
  "post-updated": "讨论状态已更新。",
  "prayer-created": "代祷请求已保存。",
  "prayer-updated": "代祷状态已更新。",
  "prayer-responded": "回应已记录。",
  "notification-read": "通知已标记为已读。",
  "check-email": "如果邮箱需要验证，请先查收邮件并完成确认。",
  "signed-out": "已退出登录。",
  "reset-sent": "如果该邮箱可用，密码恢复邮件将会发送。",
  created: "账号已创建，请补全资料与同意状态。",
  "profile-saved": "资料已保存，请确认必需同意项。",
  "onboarding-complete": "进入小组前置条件已完成。",
  "group-created": "小组已创建。",
  joined: "已加入小组。",
  archived: "小组已归档。",
  saved: "已保存。",
  "invite-revoked": "邀请已撤销。",
  removed: "成员已移除。",
  left: "你已退出小组。",
  "cohort-created": "课程班次已创建。",
  "task-completed": "任务已完成。",
  "task-skipped": "任务已跳过。",
  "entry-created": "私人记录已保存。",
  "entry-shared": "记录已分享。",
  "entry-revoked": "分享已撤回。",
  "entry-deleted": "记录已删除。",
};

const errors: Record<string, string> = {
  "rate-limit": "操作太频繁，请稍后再试。",
  config: "Supabase 环境变量未配置，认证流程暂不可用。",
  invalid: "表单内容不完整，请检查后重试。",
  auth: "无法完成认证请求，请稍后重试。",
  "invalid-reset": "请输入有效邮箱地址。",
  save: "保存失败，请稍后重试。",
  required: "必需同意项未全部确认，暂不能继续。",
  create: "无法创建小组，请稍后重试。",
  membership: "小组已创建，但成员关系初始化失败。",
  invite: "无法创建邀请，请稍后重试。",
  "invalid-invite": "邀请无效、已过期、已撤销或已达到使用上限。",
  "group-full": "小组人数已满。",
  join: "无法加入小组，请稍后重试。",
  "not-found": "没有找到可访问的小组。",
  forbidden: "你没有权限执行该操作。",
  archive: "无法归档小组，请稍后重试。",
  "last-leader": "不能移除或退出本组唯一 Leader，请先移交或归档小组。",
  course: "课程版本不可用。",
  cohort: "无法创建课程班次。",
  task: "无法更新任务状态。",
  entry: "无法保存记录。",
};

function getParam(searchParams: NoticeBannerProps["searchParams"], key: string): string | null {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function NoticeBanner({ searchParams }: NoticeBannerProps) {
  const message = getParam(searchParams, "message");
  const error = getParam(searchParams, "error");

  if (error) {
    return (
      <p className="rounded-md border border-clay/40 bg-clay/10 px-3 py-2 text-sm text-ink" role="alert">
        {errors[error] ?? error}
      </p>
    );
  }

  if (message) {
    return (
      <p className="rounded-md border border-mist bg-mist px-3 py-2 text-sm text-pine" role="status">
        {messages[message] ?? message}
      </p>
    );
  }

  return null;
}
