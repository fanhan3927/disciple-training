import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { LEGAL_DOCUMENT_VERSION, requiredSignupConsents } from "@/lib/legal-documents";
import type { ConsentType } from "@/lib/supabase/database.types";

type RecordSignupConsentsInput = {
  userId: string;
  displayName: string;
  timezone: string;
  locale: string;
  consentTypes: ConsentType[];
  source: "signup" | "settings";
};

export async function recordSignupConsents(input: RecordSignupConsentsInput): Promise<boolean> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return false;
  }

  await admin.from("profiles").upsert({
    user_id: input.userId,
    display_name: input.displayName,
    timezone: input.timezone,
    locale: input.locale,
    adult_confirmed_at: new Date().toISOString(),
  });

  const { data: documents, error: documentError } = await admin
    .from("legal_documents")
    .select("id,document_type")
    .eq("version", LEGAL_DOCUMENT_VERSION)
    .eq("locale", "zh-CN")
    .is("retired_at", null);

  if (documentError || !documents) {
    return false;
  }

  const rows = requiredSignupConsents
    .filter((document) => document.requiredConsent && input.consentTypes.includes(document.requiredConsent))
    .map((document) => {
      const dbDocument = documents.find((item) => item.document_type === document.type);

      if (!dbDocument || !document.requiredConsent) {
        return null;
      }

      return {
        user_id: input.userId,
        legal_document_id: dbDocument.id,
        consent_type: document.requiredConsent,
        granted_at: new Date().toISOString(),
        evidence_meta: {
          source: input.source,
          document_version: document.version,
          content_hash: document.hash,
        },
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length === 0) {
    return false;
  }

  const { error: consentError } = await admin.from("user_consents").upsert(rows);

  return !consentError;
}
