import type { AiGroundingStatus, AiRiskCategory } from "@/lib/supabase/database.types";
import type { AiSafetyMode } from "./guardrails";

export type SafeAiRequest = {
  question: string;
  riskCategory: AiRiskCategory;
  safetyMode: AiSafetyMode;
  context: Array<{ text: string; sourceLocator: string }>;
  includePrivateContent: false;
};

export type SafeAiResponse = {
  answer: string;
  groundingStatus: AiGroundingStatus;
  citations: string[];
};

export interface AiProvider {
  generate(input: SafeAiRequest): Promise<SafeAiResponse>;
  embed(texts: string[]): Promise<number[][]>;
}

export class UnconfiguredAiProvider implements AiProvider {
  async generate(): Promise<SafeAiResponse> {
    return {
      answer: "AI 服务尚未配置。当前只显示课程审核与安全边界，不会调用未配置的模型。",
      groundingStatus: "insufficient",
      citations: [],
    };
  }

  async embed(): Promise<number[][]> {
    return [];
  }
}
