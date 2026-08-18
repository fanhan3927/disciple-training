import { LegalDocumentPage } from "@/components/legal-document-page";
import { getLegalDocument } from "@/lib/legal-documents";

export default function AiNoticePage() {
  return <LegalDocumentPage document={getLegalDocument("ai_notice")!} />;
}
