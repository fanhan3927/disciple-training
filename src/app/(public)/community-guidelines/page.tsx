import { LegalDocumentPage } from "@/components/legal-document-page";
import { getLegalDocument } from "@/lib/legal-documents";

export default function CommunityGuidelinesPage() {
  return <LegalDocumentPage document={getLegalDocument("community_guidelines")!} />;
}
