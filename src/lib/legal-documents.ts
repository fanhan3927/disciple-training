import type { ConsentType, LegalDocumentType } from "@/lib/supabase/database.types";

export type LegalDocument = {
  type: LegalDocumentType;
  version: string;
  locale: "zh-CN";
  title: string;
  hash: `sha256:${string}`;
  requiredConsent?: ConsentType;
  summary: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export const LEGAL_DOCUMENT_VERSION = "2026-07-30.m1";

export const legalDocuments: LegalDocument[] = [
  {
    type: "mission",
    version: LEGAL_DOCUMENT_VERSION,
    locale: "zh-CN",
    title: "产品使命",
    hash: "sha256:7c160cb7470b77eca11ee7d8ba07c7d33f786d9ca40fd26db133741338475361",
    summary: "平台辅助熟人小组门徒训练，帮助成员按周学习、按日操练，并保持与本地教会的真实连接。",
    sections: [
      {
        heading: "定位",
        body: "本产品是本地教会之外的辅助性学习与小组连接工具，不替代教会、牧者、团契或面对面牧养。",
      },
      {
        heading: "首发范围",
        body: "MVP 只服务受邀请的熟人小组，首发语言为简体中文，首轮内测不开放公开增长。",
      },
    ],
  },
  {
    type: "beliefs",
    version: LEGAL_DOCUMENT_VERSION,
    locale: "zh-CN",
    title: "信仰宣言",
    hash: "sha256:d2b24cc2c4f488c96883fa07a914911fc122990526250c22b32a2c3804fd723e",
    summary: "产品以正统基督教公共信仰为边界，以《尼西亚信经》为正式基础，《使徒信经》为简明摘要。",
    sections: [
      {
        heading: "公共根基",
        body: "平台不充当宗派裁判，不将 AI 回答作为教义定论，核心信仰议题应回到可靠课程、本地教会与合格牧养。",
      },
      {
        heading: "高风险边界",
        body: "涉及得救状态、神旨意裁决、圣礼、危机、宗派争议时，平台必须使用固定边界提示。",
      },
    ],
  },
  {
    type: "boundaries",
    version: LEGAL_DOCUMENT_VERSION,
    locale: "zh-CN",
    title: "平台边界",
    hash: "sha256:e0775b39c00fb06b024a75303cdb4a27c96a6ac2e06cf1d526ab4ef6e58c8173",
    summary: "平台不主持、安排或认证洗礼、圣餐、按立、会籍等圣礼或教会权柄事项。",
    sections: [
      {
        heading: "非教会声明",
        body: "平台不是线上教会，不提供网络牧师身份，不认证用户的属灵等级、教会成员资格或圣礼状态。",
      },
      {
        heading: "AI 边界",
        body: "AI 仅作为依据已审核课程、带出处的学习助手；不得扮演牧师、先知、神谕或危机响应人员。",
      },
    ],
  },
  {
    type: "privacy",
    version: LEGAL_DOCUMENT_VERSION,
    locale: "zh-CN",
    title: "隐私政策",
    hash: "sha256:676661589919605852f77996011b64b194942d7c23643161a92e88b10f23dfc9",
    requiredConsent: "privacy",
    summary: "私人灵修、代祷和 AI 对话默认仅本人可见，不自动进入 AI 上下文、分析日志或课程知识库。",
    sections: [
      {
        heading: "默认私密",
        body: "用户内容默认 private。Leader 不能读取私人笔记或 AI 对话，除非用户在受控范围内主动分享。",
      },
      {
        heading: "日志限制",
        body: "系统只记录技术状态、路由、枚举事件和脱敏标识，不记录祷告、反思、帖子或 AI 问答正文。",
      },
    ],
  },
  {
    type: "terms",
    version: LEGAL_DOCUMENT_VERSION,
    locale: "zh-CN",
    title: "服务条款",
    hash: "sha256:3e9d8c3f3a32762dbad97f1d2737e0df5a91114608ed2d9d9b7a6c5a6515684a",
    requiredConsent: "terms",
    summary: "MVP 内测仅供受邀用户使用。用户需尊重小组隐私，不发布违法、骚扰、操控或伤害性内容。",
    sections: [
      {
        heading: "邀请制使用",
        body: "无有效邀请不能加入小组。用户不得转售、公开发布或滥用邀请链接。",
      },
      {
        heading: "责任限制",
        body: "平台提供学习辅助和小组协作工具，不承诺实时危机响应、医疗法律建议或教会权柄判断。",
      },
    ],
  },
  {
    type: "community_guidelines",
    version: LEGAL_DOCUMENT_VERSION,
    locale: "zh-CN",
    title: "社区守则",
    hash: "sha256:24f6d943043496260433d9a11233e8f7743567132166964ecb82f2e68a0210d5",
    summary: "组内交通应温和、诚实、尊重隐私，不使用羞辱、控制、胁迫或属灵权威压迫他人。",
    sections: [
      {
        heading: "隐私",
        body: "不得未经同意披露他人的祷告、家庭、健康、财务或牧养细节。",
      },
      {
        heading: "举报",
        body: "用户可以举报帖子、成员或小组。审核访问必须与案件相关并留下审计记录。",
      },
    ],
  },
  {
    type: "ai_notice",
    version: LEGAL_DOCUMENT_VERSION,
    locale: "zh-CN",
    title: "AI 使用说明",
    hash: "sha256:60ccfb794669c36573b66bd7c021e552453209a382ced21612c2358f2887d819",
    requiredConsent: "sensitive_data",
    summary: "AI 功能默认关闭。启用后也只检索已审核课程内容，私人内容必须经用户当次确认才可加入上下文。",
    sections: [
      {
        heading: "来源限制",
        body: "AI 回答必须带课程出处；来源不足时应拒答或提示需要向 Leader、本地教会或专业人员求助。",
      },
      {
        heading: "敏感数据",
        body: "祷告、灵修、个人挣扎和 AI 对话属于敏感内容，默认不进入模型、RAG、分析或普通日志。",
      },
    ],
  },
];

export const requiredSignupConsents = legalDocuments.filter((document) => document.requiredConsent);

export function getLegalDocument(type: LegalDocumentType): LegalDocument | undefined {
  return legalDocuments.find((document) => document.type === type);
}

export function getRequiredConsentTypes(): ConsentType[] {
  return requiredSignupConsents
    .map((document) => document.requiredConsent)
    .filter((consent): consent is ConsentType => Boolean(consent));
}
