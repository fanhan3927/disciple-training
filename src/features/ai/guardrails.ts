import type { AiRiskCategory } from "@/lib/supabase/database.types";

export type AiSafetyMode = "answer" | "grounded_only" | "referral";

const rules: Array<{ category: AiRiskCategory; patterns: RegExp[] }> = [
  { category: "prompt_injection", patterns: [/ignore (all|the|previous|system)/i, /忽略(之前|系统|所有)规则/, /告诉我预言/] },
  { category: "self_harm", patterns: [/自杀|自伤|不想活|伤害自己/i] },
  { category: "abuse", patterns: [/虐待|家暴|性侵|被控制/i] },
  { category: "financial_exploitation", patterns: [/奉献.*得救|不奉献.*顺服|借钱|投资.*信仰/i] },
  { category: "divine_guidance", patterns: [/神.*旨意|神(对我|告诉我)|神旨意|预言|是不是神要我/i] },
  { category: "sacrament", patterns: [/圣餐|洗礼|受洗|按立/i] },
  { category: "denominational", patterns: [/宗派|教派/i] },
  { category: "doctrine_core", patterns: [/得救|救恩|三位一体|信仰告白|异端/i] },
  { category: "mental_health", patterns: [/抑郁|焦虑|精神疾病|心理咨询/i] },
];

export function classifyAiRisk(input: string): { category: AiRiskCategory; matched: boolean } {
  const normalized = input.trim();
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) return { category: rule.category, matched: true };
  }
  return { category: "normal", matched: false };
}

export function getAiSafetyMode(category: AiRiskCategory): AiSafetyMode {
  if (["prompt_injection", "self_harm", "abuse", "financial_exploitation", "divine_guidance", "sacrament"].includes(category)) return "referral";
  if (["doctrine_core", "denominational", "mental_health", "other_high_risk"].includes(category)) return "grounded_only";
  return "answer";
}

export function buildSafeAiInstructions(mode: AiSafetyMode): string {
  const base = "你是课程学习助手，不是牧师、先知、神谕或教会权柄。只依据提供的已审核课程片段回答；没有来源就明确说资料不足。不要读取、推断或记录用户私人灵修、代祷或其他私人内容。";
  if (mode === "referral") return `${base} 当前问题超出安全范围：不要给出神旨意、圣礼决定、危机处理或财务操控建议；请温和说明边界，并建议联系当地教会、紧急服务或合资格专业人士。`;
  if (mode === "grounded_only") return `${base} 当前问题存在高风险或宗派差异：只能总结明确来源，不能替用户作属灵判断、诊断或决定。`;
  return `${base} 使用简洁、可核查、带引用的语言回答。`;
}
