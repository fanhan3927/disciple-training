import { z } from "zod";

const supabaseUrlSchema = z.string().url();

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || !supabaseUrlSchema.safeParse(url).success) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}
