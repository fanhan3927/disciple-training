import { LegalDocumentPage } from "@/components/legal-document-page";
import { getLegalDocument } from "@/lib/legal-documents";

export default function TermsPage() {
  return <LegalDocumentPage document={getLegalDocument("terms")!} />;
}
