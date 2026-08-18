"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LEGAL_DOCUMENT_VERSION } from "@/lib/legal-documents";
import type { ConsentType, LegalDocumentType } from "@/lib/supabase/database.types";
import { consentSchema, profileSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./validation";
import { recordSignupConsents } from "./server";

const genericAuthError = "登录信息不正确，或账号暂时无法使用。";

function requireSupabase() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?error=config");
  }

  return supabase;
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/signup?error=invalid");
  }

  const input = parsed.data;
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
        timezone: input.timezone,
        locale: input.locale,
      },
    },
  });

  if (error || !data.user) {
    redirect("/signup?error=auth");
  }

  const consents: ConsentType[] = ["terms", "privacy", "sensitive_data"];
  if (input.marketingConsent === "on") {
    consents.push("marketing");
  }

  const recorded = await recordSignupConsents({
    userId: data.user.id,
    displayName: input.displayName,
    timezone: input.timezone,
    locale: input.locale,
    consentTypes: consents,
    source: "signup",
  });

  if (!recorded && data.session) {
    await supabase.rpc("confirm_adult_profile", {
      display_name: input.displayName,
      timezone: input.timezone,
      locale: input.locale,
    });

    await Promise.all([
      grantConsent("terms", "terms"),
      grantConsent("privacy", "privacy"),
      grantConsent("ai_notice", "sensitive_data"),
    ]);
  }

  redirect(data.session ? "/settings/profile?message=created" : "/login?message=check-email");
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const supabase = requireSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(genericAuthError)}`);
  }

  redirect("/settings/profile");
}

export async function signOutAction() {
  const supabase = requireSupabase();
  await supabase.auth.signOut();
  redirect("/login?message=signed-out");
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/login?error=invalid-reset");
  }

  const supabase = requireSupabase();
  await supabase.auth.resetPasswordForEmail(parsed.data.email);
  redirect("/login?message=reset-sent");
}

export async function updateProfileAction(formData: FormData) {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/settings/profile?error=invalid");
  }

  const supabase = requireSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (parsed.data.adultConfirmed === "on") {
    const { error } = await supabase.rpc("confirm_adult_profile", {
      display_name: parsed.data.displayName,
      timezone: parsed.data.timezone,
      locale: parsed.data.locale,
    });

    if (error) {
      redirect("/settings/profile?error=save");
    }
  } else {
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName,
        timezone: parsed.data.timezone,
        locale: parsed.data.locale,
      })
      .eq("user_id", user.id);

    if (error) {
      redirect("/settings/profile?error=save");
    }
  }

  redirect("/settings/privacy?message=profile-saved");
}

export async function updateConsentsAction(formData: FormData) {
  const parsed = consentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/settings/privacy?error=invalid");
  }

  const requiredGranted =
    parsed.data.termsConsent === "on" &&
    parsed.data.privacyConsent === "on" &&
    parsed.data.sensitiveDataConsent === "on";

  if (!requiredGranted) {
    redirect("/settings/privacy?error=required");
  }

  await Promise.all([
    grantConsent("terms", "terms"),
    grantConsent("privacy", "privacy"),
    grantConsent("ai_notice", "sensitive_data"),
    parsed.data.marketingConsent === "on" ? grantConsent("terms", "marketing") : Promise.resolve(),
  ]);

  redirect("/home?message=onboarding-complete");
}

async function grantConsent(documentType: LegalDocumentType, consentType: ConsentType) {
  const supabase = requireSupabase();

  const { error } = await supabase.rpc("grant_user_consent", {
    document_type: documentType,
    document_version: LEGAL_DOCUMENT_VERSION,
    consent_type: consentType,
    evidence_meta: {
      source: "web",
      document_version: LEGAL_DOCUMENT_VERSION,
    },
  });

  if (error) {
    redirect("/settings/privacy?error=save");
  }
}
