const messages = {
  "home.status": "项目基线已建立",
  "home.title": "受信任熟人小组的门徒训练空间",
  "home.subtitle":
    "当前只搭建 MVP 工程与界面基线：移动端优先、默认私密、可审计边界清晰，后续再逐步接入认证、小组、课程和受控 AI。",
  "home.primaryAction": "查看使命",
  "home.secondaryAction": "查看边界",
  "home.baselineTitle": "MVP 工程基线",
  "home.emptyTitle": "业务功能尚未开启",
  "home.emptyBody": "M0 阶段不创建登录、小组、数据库或 AI 功能。",
} as const;

export type MessageKey = keyof typeof messages;

export function t(key: MessageKey): string {
  return messages[key];
}
