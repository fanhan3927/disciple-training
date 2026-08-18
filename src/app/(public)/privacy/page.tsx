import { LegalDocumentPage } from "@/components/legal-document-page";
import { getLegalDocument } from "@/lib/legal-documents";

export default function PrivacyPage() {
  return <LegalDocumentPage document={getLegalDocument("privacy")!} />;
}
