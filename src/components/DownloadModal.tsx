import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Check, ExternalLink, ShoppingBag, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DocumentResponse } from "@/types/document";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DocumentResponse | null;
  onDocumentsDownloaded: () => void;
}

export const DownloadModal = ({ isOpen, onClose, data, onDocumentsDownloaded }: DownloadModalProps) => {
  const navigate = useNavigate();

  if (!data) return null;

  // Get all bank statements
  const bankStatements = (data.bankstatements || []).map((url, index) => ({
    name: `Bank Statement ${index + 1}`,
    url,
    icon: Banknote,
    type: 'bank-statement' as const
  }));

  // Get all payslips
  const payslips = (data.payslips || []).map((url, index) => ({
    name: `Payslip - Month ${index + 1}`,
    url,
    icon: FileText,
    type: 'payslip' as const
  }));

  // ID document urls (front/back)
  const idDocs = [] as Array<{name:string;url:string;icon:any;type:'id-front'|'id-back'|'id-combined-pdf'}>;
  if (data.idFrontUrl) {
    idDocs.push({ name: 'ID Front', url: data.idFrontUrl, icon: FileText, type: 'id-front' });
  }
  if (data.idBackUrl) {
    idDocs.push({ name: 'ID Back', url: data.idBackUrl, icon: FileText, type: 'id-back' });
  }
  if (data.idCombinedPdfUrl) {
    idDocs.push({ name: 'ID (Combined PDF)', url: data.idCombinedPdfUrl, icon: FileText, type: 'id-combined-pdf' });
  }

  // Combine all documents
  const documents = [...bankStatements, ...payslips, ...idDocs];

  console.log('Documents to display:', documents);

  // Fallback to legacy format if no documents in the new format
  if (documents.length === 0) {
    if (data.bankstatementUrl) {
      documents.push({
        name: "Bank Statement",
        url: data.bankstatementUrl,
        icon: Banknote,
        type: 'bank-statement'
      });
    }
    
    [data.payslip1, data.payslip2, data.payslip3].forEach((url, index) => {
      if (url) {
        documents.push({
          name: `Payslip - Month ${index + 1}`,
          url,
          icon: FileText,
          type: 'payslip'
        });
      }
    });
  }

  const handleDownload = (url: string, name: string) => {
    window.open(url, '_blank');
  };

  const handleDownloadAll = () => {
    documents.forEach((doc, index) => {
      if (doc.url) {
        setTimeout(() => {
          window.open(doc.url, '_blank');
        }, index * 500);
      }
    });
    // Mark documents as downloaded
    onDocumentsDownloaded();
  };

  const handleExploreServices = () => {
    onDocumentsDownloaded();
    onClose();
    navigate('/products');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <DialogTitle className="font-display text-2xl font-bold text-foreground">
            Documents Ready!
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Your documents have been generated successfully. Click to view or download.
          </p>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {documents.map((doc, index) => (
            <button
              key={index}
              onClick={() => handleDownload(doc.url, doc.name)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border bg-background hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <doc.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{doc.name}</p>
                <p className="text-sm text-muted-foreground">PDF Document</p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-border max-w-full">
          <Button
            variant="hero"
            size="lg"
            onClick={handleDownloadAll}
            className="w-full max-w-full"
          >
            <Download className="w-5 h-5 shrink-0" />
            <span className="truncate">Download All Documents</span>
          </Button>
          
          {/* <Button
            variant="outline"
            size="lg"
            onClick={handleExploreServices}
            className="w-full max-w-full group"
          >
            <ShoppingBag className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">Explore Our Services</span>
          </Button> */}
          
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="w-full max-w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
