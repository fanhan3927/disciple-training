import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOnboardingStatus } from "@/features/auth/onboarding";

export async function getAuthContext() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return {
      configured: false as const,
      user: null,
      profile: null,
      consents: [],
      onboarding: getOnboardingStatus(null, []),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true as const,
      user: null,
      profile: null,
      consents: [],
      onboarding: getOnboardingStatus(null, []),
    };
  }

  const [{ data: profile }, { data: consents }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_consents").select("consent_type,revoked_at").eq("user_id", user.id),
  ]);

  return {
    configured: true as const,
    user,
    profile,
    consents: consents ?? [],
    onboarding: getOnboardingStatus(profile, consents ?? []),
  };
}

export async function requireUser() {
  const context = await getAuthContext();

  if (!context.configured) {
    return context;
  }

  if (!context.user) {
    redirect("/login");
  }

  return context;
}
