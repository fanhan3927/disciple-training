import type { Json } from "@/lib/supabase/database.types";

export function getJsonText(value: Json, fallback = ""): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const text = value.text;
  return typeof text === "string" ? text : fallback;
}

export function getPromptText(value: Json, fallback = ""): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const prompt = value.prompt;
  return typeof prompt === "string" ? prompt : fallback;
}

export function getWeekFromSequence(sequence: number): number {
  return Math.min(4, Math.max(1, sequence));
}
