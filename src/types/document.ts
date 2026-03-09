export interface DocumentResponse {
  status: number;
  message: string;
  bankstatements: string[];
  payslips: string[];
  // ID document URLs (optional)
  idFrontUrl?: string;
  idBackUrl?: string;
  idCombinedPdfUrl?: string;
  // Backward compatible fields
  bankstatementUrl?: string;
  payslip1?: string;
  payslip2?: string;
  payslip3?: string;
}
