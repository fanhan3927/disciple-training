import type { ConsentType } from "@/lib/supabase/database.types";

export type ConsentSnapshot = {
  consent_type: ConsentType;
  revoked_at: string | null;
};

export type ProfileSnapshot = {
  adult_confirmed_at: string | null;
};

export type OnboardingStatus = {
  adultConfirmed: boolean;
  requiredConsentsGranted: boolean;
  missingConsents: ConsentType[];
  completed: boolean;
};

const requiredConsents: ConsentType[] = ["terms", "privacy", "sensitive_data"];

export function getOnboardingStatus(
  profile: ProfileSnapshot | null,
  consents: ConsentSnapshot[],
): OnboardingStatus {
  const activeConsentTypes = new Set(
    consents
      .filter((consent) => consent.revoked_at === null)
      .map((consent) => consent.consent_type),
  );
  const missingConsents = requiredConsents.filter((consent) => !activeConsentTypes.has(consent));
  const adultConfirmed = Boolean(profile?.adult_confirmed_at);

  return {
    adultConfirmed,
    requiredConsentsGranted: missingConsents.length === 0,
    missingConsents,
    completed: adultConfirmed && missingConsents.length === 0,
  };
}
