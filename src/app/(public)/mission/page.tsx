import { LegalDocumentPage } from "@/components/legal-document-page";
import { getLegalDocument } from "@/lib/legal-documents";

export default function MissionPage() {
  return <LegalDocumentPage document={getLegalDocument("mission")!} />;
}
