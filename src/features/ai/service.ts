import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { buildSafeAiInstructions, classifyAiRisk, getAiSafetyMode } from "./guardrails";
import { rankKnowledgeChunks, type KnowledgeChunk } from "./retrieval";
import { type AiProvider, type SafeAiResponse, UnconfiguredAiProvider } from "./provider";

const questionSchema = z.string().trim().min(1).max(2000);

export function createSafeAiRequest(question: string, chunks: KnowledgeChunk[]) {
  const safeQuestion = questionSchema.parse(question);
  const risk = classifyAiRisk(safeQuestion);
  const mode = getAiSafetyMode(risk.category);
  const ranked = rankKnowledgeChunks(safeQuestion, chunks);
  return {
    question: safeQuestion,
    riskCategory: risk.category,
    safetyMode: mode,
    context: ranked.map((chunk) => ({ text: chunk.text, sourceLocator: chunk.sourceLocator })),
    includePrivateContent: false as const,
    systemInstructions: buildSafeAiInstructions(mode),
  };
}

export async function answerSafeQuestion(
  question: string,
  chunks: KnowledgeChunk[],
  provider: AiProvider = new UnconfiguredAiProvider(),
): Promise<SafeAiResponse & { riskCategory: ReturnType<typeof classifyAiRisk>["category"] }> {
  const request = createSafeAiRequest(question, chunks);
  if (request.safetyMode === "referral") {
    return {
      riskCategory: request.riskCategory,
      answer: "这个问题涉及平台不能替你决定或处理的高风险事项。请联系你所在教会的合资格负责人；如果存在即时危险，请联系当地紧急服务或专业支持。",
      groundingStatus: "insufficient",
      citations: [],
    };
  }
  if (!request.context.length) {
    return {
      riskCategory: request.riskCategory,
      answer: "我在已审核的课程资料中没有找到足够依据，不能编造答案。你可以换一个更贴近课程的问题，或向本地教会和合资格人士求助。",
      groundingStatus: "insufficient",
      citations: [],
    };
  }
  const response = await provider.generate(request);
  return { ...response, riskCategory: request.riskCategory };
}

export async function listReviewedKnowledgeChunks(): Promise<KnowledgeChunk[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data: chunks } = await admin.from("knowledge_chunks").select("id,content_block_id,chunk_text,source_locator").eq("status", "active");
  const blockIds = (chunks ?? []).map((chunk) => chunk.content_block_id);
  if (!blockIds.length) return [];
  const { data: blocks } = await admin.from("content_blocks").select("id,lesson_id,ai_approved,theology_status,copyright_status,safety_status").in("id", blockIds);
  const lessonIds = [...new Set((blocks ?? []).map((block) => block.lesson_id))];
  const { data: lessons } = lessonIds.length ? await admin.from("lessons").select("id,module_id").in("id", lessonIds) : { data: [] };
  const moduleIds = [...new Set((lessons ?? []).map((lesson) => lesson.module_id))];
  const { data: modules } = moduleIds.length ? await admin.from("modules").select("id,course_version_id").in("id", moduleIds) : { data: [] };
  const versionIds = [...new Set((modules ?? []).map((module) => module.course_version_id))];
  const { data: versions } = versionIds.length ? await admin.from("course_versions").select("id,course_id,status,published_at").in("id", versionIds) : { data: [] };
  const courseIds = [...new Set((versions ?? []).map((version) => version.course_id))];
  const { data: courses } = courseIds.length ? await admin.from("courses").select("id,status").in("id", courseIds) : { data: [] };
  const activeCourseIds = new Set((courses ?? []).filter((course) => course.status === "active").map((course) => course.id));
  const activeVersionIds = new Set((versions ?? []).filter((version) => version.status === "published" && version.published_at && activeCourseIds.has(version.course_id)).map((version) => version.id));
  const moduleById = new Map((modules ?? []).map((module) => [module.id, module.course_version_id]));
  const lessonById = new Map((lessons ?? []).map((lesson) => [lesson.id, lesson.module_id]));
  const reviewedBlocks = new Set((blocks ?? []).filter((block) => block.ai_approved && block.theology_status === "approved" && block.copyright_status === "approved" && block.safety_status === "approved" && activeVersionIds.has(moduleById.get(lessonById.get(block.lesson_id) ?? "") ?? "")).map((block) => block.id));
  return (chunks ?? []).filter((chunk) => reviewedBlocks.has(chunk.content_block_id)).map((chunk) => ({ id: chunk.id, text: chunk.chunk_text, sourceLocator: chunk.source_locator, reviewed: true }));
}

export type AiMessage = Database["public"]["Tables"]["ai_messages"]["Row"];
