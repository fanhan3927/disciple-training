import { LegalDocumentPage } from "@/components/legal-document-page";
import { getLegalDocument } from "@/lib/legal-documents";

export default function BoundariesPage() {
  return <LegalDocumentPage document={getLegalDocument("boundaries")!} />;
}
