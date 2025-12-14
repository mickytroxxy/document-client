import { DocumentForm } from "@/components/DocumentForm";
import { DocumentResponse } from "@/types/document";

interface ZAComponentProps {
  onBack: () => void;
  onSuccess: (data: DocumentResponse) => void;
}

export const ZA_COMPONENT = ({ onBack, onSuccess }: ZAComponentProps) => {
  return <DocumentForm onBack={onBack} onSuccess={onSuccess} />;
};

export default ZA_COMPONENT;
