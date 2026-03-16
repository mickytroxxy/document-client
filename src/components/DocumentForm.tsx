import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/FloatingInput";
import { FloatingSelect } from "@/components/FloatingSelect";
import { ArrowLeft, FileText, Loader2, Building2, User, CreditCard, Wallet, IdCard } from "lucide-react";
import { toast } from "sonner";
import { DocumentResponse } from "@/types/document";
import { fetchCompanies, type CompanyInfo } from "@/data";
import { fetchCountries, type Country } from "@/data";
import { fetchBanks, type Bank } from "@/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HackingLoaderModal } from "@/components/HackingLoaderModal";
import useAuthStore from "@/store/useAuth";
import useFetch, { BASE_URL } from "@/hooks/useFetch";

interface DocumentFormProps {
  onBack: () => void;
  onSuccess: (data: DocumentResponse) => void;
}

type DocumentCategory = "PERSONAL_BANK" | "BUSINESS_BANK" | "ID_DOCUMENT";

const monthOptions = [
  { value: "3", label: "3 Months" },
  { value: "6", label: "6 Months" },
  { value: "12", label: "12 Months" },
];

const payDateOptions = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`,
}));

const titleOptions = [
  { value: "MR", label: "Mr" },
  { value: "MRS", label: "Mrs" },
  { value: "MS", label: "Ms" },
  { value: "DR", label: "Dr" },
];

const bankOptions = [
  { value: "tymebank", label: "TymeBank" },
  { value: "fnb", label: "FNB" },
  { value: "capitec", label: "Capitec" },
  { value: "standardbank", label: "Standard Bank" },
  { value: "absa", label: "ABSA" },
];

export const DocumentForm = ({ onBack, onSuccess }: DocumentFormProps) => {
  const { fetchData } = useFetch();
  const [isLoading, setIsLoading] = useState(false);
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory | null>(null);
  
  // Personal bank statement state
  const [personalData, setPersonalData] = useState({
    title: "MR",
    accountHolder: "",
    idNumber: "",
    companyName: "",
    companyAddress: "",
    companyEmail: "",
    companyTel: "",
    department: "",
    salaryAmount: "",
    payDate: "30",
    employeeID: "",
    taxReference: "",
    accountNumber: "",
    bankType: "tymebank",
    months: "3",
    openBalance: "0",
    availableBalance: "10000",
    comment: "",
    isPayslipIncluded: false,
  });

  // Business bank statement state
  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessRegNo: "",
    vatNo: "",
    accountNumber: "",
    bankType: "capitec",
    months: "3",
    openBalance: "0",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    addressProvince: "",
    addressPostalCode: "",
    bankBranch: "Relationship Suite",
    branchCode: "450105",
    bankDeviceCode: "9998",
    bankTelephone: "",
    interestRate: "22.1000%",
    salaryDay: "25",
    rentalDay: "1",
    targetClosingBalance: "",
    comment: "",
  });

  // Financial statement state
  const [isFinancialRequired, setIsFinancialRequired] = useState(false);
  const [financialStartDate, setFinancialStartDate] = useState("");
  const [financialEndDate, setFinancialEndDate] = useState("");
  const [accountingCompanyName, setAccountingCompanyName] = useState("");
  const [directorName, setDirectorName] = useState("");

  // ID document state
  const [idServiceType, setIdServiceType] = useState<"MANUAL" | "HOME_AFFAIRS">("MANUAL");
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [signatureText, setSignatureText] = useState("");
  const [signatureVariantUrls, setSignatureVariantUrls] = useState<string[]>([]);
  const [signatureVariantBlobs, setSignatureVariantBlobs] = useState<Blob[]>([]);
  const [selectedSignatureIndex, setSelectedSignatureIndex] = useState<number>(0);
  const [idFormData, setIdFormData] = useState({
    first_name: "",
    last_name: "",
    id: "",
    gender: "M",
    dob: "",
    issuing_date: "",
    documentId: "",
  });

  // Auth and modal state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Data fetching
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState<{value: string, label: string}[]>([]);

  const phone = useAuthStore((state) => state.phone);
  const balance = useAuthStore((state) => state.balance);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const topUp = useAuthStore((state) => state.topUp);

  const cryptoAddress = useMemo(() => '15ELLpRdsKgWke2K7J1SXncwsGTJrcMJpF', []);

  const hasPayslipAvailable = useMemo(() => {
    const cfg = countries.find(c => c.country_code === 'ZA');
    return !!cfg?.documents.some(d => d.documentType === 'PAYSLIP');
  }, [countries]);

  const totalCost = useMemo(() => {
    if (documentCategory === "ID_DOCUMENT") {
      const cfg = countries.find(c => c.country_code === 'ZA');
      const docType = idServiceType === 'HOME_AFFAIRS' ? 'ID_HOME_AFFAIRS' : 'ID_MANUAL';
      return cfg?.documents.find(d => d.documentType === docType)?.price || 0;
    }
    if (documentCategory === "BUSINESS_BANK") {
      // Business bank statement pricing - could be different
      const cfg = countries.find(c => c.country_code === 'ZA');
      return cfg?.documents.find(d => d.documentType === 'BANK_STATEMENT')?.price || 0;
    }
    const cfg = countries.find(c => c.country_code === 'ZA');
    const bankPrice = cfg?.documents.find(d => d.documentType === 'BANK_STATEMENT')?.price || 0;
    const payslipPrice = cfg?.documents.find(d => d.documentType === 'PAYSLIP')?.price || 0;
    return bankPrice + (personalData.isPayslipIncluded ? payslipPrice : 0);
  }, [documentCategory, idServiceType, countries, personalData.isPayslipIncluded]);

  useEffect(() => {
    const loadData = async () => {
      const [companiesData, countriesData, banksData] = await Promise.all([
        fetchCompanies(),
        fetchCountries(),
        fetchBanks()
      ]);
      setCompanies(companiesData);
      setCountries(countriesData);
      setBanks(banksData);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (phone) {
      fetchData({ endPoint: '/authenticate', method: 'POST', data: { phoneNumber: phone } }).then(result => {
        if (result && result.status === 1) {
          login(phone, result.data.balance);
        }
      }).catch(() => {});
    }
  }, [phone, fetchData, login]);

  useEffect(() => {
    if (idServiceType !== 'MANUAL') {
      signatureVariantUrls.forEach((u) => URL.revokeObjectURL(u));
      setSignatureVariantUrls([]);
      setSignatureVariantBlobs([]);
      setSelectedSignatureIndex(0);
      return;
    }
    if (!signatureText.trim()) {
      signatureVariantUrls.forEach((u) => URL.revokeObjectURL(u));
      setSignatureVariantUrls([]);
      setSignatureVariantBlobs([]);
      setSelectedSignatureIndex(0);
      return;
    }

    const makeVariant = async ({ font, alpha, rotateDeg, scale }: { font: string; alpha: number; rotateDeg: number; scale: number; }): Promise<Blob | null> => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotateDeg * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#1f1f1f';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.font = font;
      ctx.fillText(signatureText.trim(), 0, 0);
      ctx.restore();

      return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
    };

    (async () => {
      const variants = [
        { font: '400 72px "Brush Script MT", "Segoe Script", "Pacifico", cursive', alpha: 0.8, rotateDeg: -2, scale: 1 },
        { font: '400 64px "Segoe Script", "Brush Script MT", "Pacifico", cursive', alpha: 0.75, rotateDeg: 1.5, scale: 1.05 },
        { font: '300 70px "Pacifico", "Segoe Script", "Brush Script MT", cursive', alpha: 0.7, rotateDeg: -1, scale: 0.98 }
      ];

      const blobs = (await Promise.all(variants.map((v) => makeVariant(v)))).filter(Boolean) as Blob[];
      signatureVariantUrls.forEach((u) => URL.revokeObjectURL(u));
      setSignatureVariantBlobs(blobs);
      setSignatureVariantUrls(blobs.map((b) => URL.createObjectURL(b)));
      setSelectedSignatureIndex(0);
    })();
  }, [signatureText, idServiceType]);

  const handlePersonalChange = (field: string, value: string) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessChange = (field: string, value: string) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const c = companies?.find(x => x.companyId === companyId);
    if (c) {
      setPersonalData(prev => ({
        ...prev,
        companyName: c.companyName,
        companyEmail: c.email,
        companyTel: c.phone,
        companyAddress: c.address,
      }));
      setAvailableRoles(c.roles.map(r => ({ value: r, label: r })));
    }
    setSelectedRole("");
    setPersonalData(prev => ({ ...prev, department: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) {
      toast.error("Please log in to generate documents");
      setIsLoginOpen(true);
      return;
    }

    if (balance < totalCost) {
      setShowInsufficientModal(true);
      return;
    }

    // Validation based on category
    if (documentCategory === "PERSONAL_BANK") {
      if (!personalData.accountHolder || !personalData.accountNumber || !personalData.salaryAmount) {
        toast.error("Please fill in all required fields");
        return;
      }
    } else if (documentCategory === "BUSINESS_BANK") {
      if (!businessData.businessName || !businessData.accountNumber) {
        toast.error("Please fill in all required fields");
        return;
      }
    } else if (documentCategory === "ID_DOCUMENT") {
      if (idServiceType === 'HOME_AFFAIRS') {
        if (!idFormData.id) {
          toast.error("Please enter your ID number");
          return;
        }
      } else {
        const requiredFields: (keyof typeof idFormData)[] = ["first_name", "last_name", "id", "gender", "dob", "issuing_date", "documentId"];
        const missing = requiredFields.filter((k) => !idFormData[k]);
        if (missing.length > 0 || !idPhoto || !signatureText.trim() || !signatureVariantBlobs.length) {
          toast.error("Please fill in all required fields");
          return;
        }
      }
    }

    setShowConfirmationModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmationModal(false);
    setIsLoading(true);

    toast.info("Generating your documents. This may take up to 3 minutes.", { duration: 10000 });

    try {
      if (documentCategory === "ID_DOCUMENT") {
        const form = new FormData();
        form.append("idServiceType", idServiceType);
        form.append("countryCode", 'ZA');
        if (phone) form.append("userPhone", phone);
        form.append("id", idFormData.id);

        if (idServiceType === 'MANUAL') {
          form.append("first_name", idFormData.first_name);
          form.append("last_name", idFormData.last_name);
          form.append("gender", idFormData.gender);
          form.append("dob", idFormData.dob);
          form.append("issuing_date", idFormData.issuing_date);
          form.append("documentId", idFormData.documentId);
          if (idPhoto) form.append("photo", idPhoto);
          const signatureBlob = signatureVariantBlobs[selectedSignatureIndex];
          if (signatureBlob) {
            form.append('signature', new File([signatureBlob], `signature.png`, { type: 'image/png' }));
          }
        }

        const res = await fetch(`${BASE_URL}/create_id`, { method: "POST", body: form });
        const data = await res.json();

        if (data && data.status === 1) {
          toast.success(data.message || "ID document created successfully!");
          topUp(-totalCost);
          onSuccess({
            status: 1,
            message: data.message,
            bankstatements: [],
            payslips: [],
            idFrontUrl: data.data?.frontEnhancedImage || data.data?.frontImage,
            idBackUrl: data.data?.backEnhancedImage || data.data?.backImage,
            idCombinedPdfUrl: data.data?.combinedPdf,
          });
        } else {
          toast.error(data?.message || "Failed to create ID document.");
        }
        return;
      }

      if (documentCategory === "BUSINESS_BANK") {
        const financials = isFinancialRequired ? {
          required: true,
          startDate: financialStartDate,
          endDate: financialEndDate,
          accountingCompanyName,
          directorName
        } : undefined;

        const data = await fetchData({
          endPoint: '/generateBusinessStatement',
          method: 'POST',
          data: {
            bankName: 'CAPITEC',
            months: parseInt(businessData.months),
            accountNumber: businessData.accountNumber,
            accountType: 'Capitec Business Account',
            businessName: businessData.businessName,
            openingBalance: parseFloat(businessData.openBalance) || 0,
            salaryDay: parseInt(businessData.salaryDay),
            rentalDay: parseInt(businessData.rentalDay),
            targetFinalClosingBalance: businessData.targetClosingBalance ? parseFloat(businessData.targetClosingBalance) : undefined,
            comment: businessData.comment,
            address: {
              line1: businessData.addressLine1,
              line2: businessData.addressLine2,
              line3: businessData.addressLine3,
              province: businessData.addressProvince,
              postalCode: businessData.addressPostalCode,
            },
            bankDetails: {
              branch: businessData.bankBranch,
              branchCode: businessData.branchCode,
              deviceCode: businessData.bankDeviceCode,
              telephone: businessData.bankTelephone,
              businessRegNo: businessData.businessRegNo,
              vatNo: businessData.vatNo,
              interestRate: businessData.interestRate,
            },
            financials
          },
        });

        if (data && data.status === 1) {
          toast.success(data.message || 'Business bank statements generated successfully!');
          topUp(-totalCost);
          onSuccess({
            status: 1,
            message: data.message,
            bankstatements: data.data?.urls || [],
            payslips: [],
            bankstatementUrl: data.data?.urls?.[0] || '',
          });
        } else {
          toast.error(data?.message || 'Failed to generate business bank statements.');
        }
        return;
      }

      // Personal bank statement
      const data = await fetchData({
        endPoint: '/generateDocs',
        method: 'POST',
        data: {
          title: personalData.title,
          accountHolder: personalData.accountHolder,
          accountNumber: personalData.accountNumber,
          months: parseInt(personalData.months),
          openBalance: parseFloat(personalData.openBalance) || 0,
          availableBalance: parseFloat(personalData.availableBalance) || 0,
          salaryAmount: parseFloat(personalData.salaryAmount),
          payDate: personalData.payDate,
          employeeID: personalData.employeeID,
          paymentMethod: "Bank Deposit",
          bankName: personalData.bankType,
          bankType: personalData.bankType,
          accountType: "Business Account",
          idNumber: personalData.idNumber,
          physicalAddress: personalData.companyAddress,
          taxReference: personalData.taxReference,
          department: personalData.department,
          branchCode: "",
          companyName: personalData.companyName,
          companyAddress: personalData.companyAddress,
          companyEmail: personalData.companyEmail || "admin@cyphercreative.digital",
          companyTel: personalData.companyTel,
          companyId: selectedCompanyId || 'RANDOM',
          isPayslipIncluded: personalData.isPayslipIncluded,
          countryCode: 'ZA',
          userPhone: phone || undefined,
          comment: personalData.comment,
          totalCost,
        },
      });

      if (data && data.status === 1) {
        toast.success(data.message || "Documents generated successfully!");
        topUp(-totalCost);
        onSuccess({
          ...data,
          bankstatements: data.bankstatements || [],
          payslips: data.payslips || [],
          bankstatementUrl: data.bankstatementUrl || data.bankstatements?.[0] || '',
          payslip1: data.payslips?.[0] || '',
          payslip2: data.payslips?.[1] || '',
          payslip3: data.payslips?.[2] || ''
        });
      } else {
        toast.error(data.message || "Failed to generate documents.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-6 px-3 sm:py-10 sm:px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08)_0%,transparent_70%)] opacity-50" style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      </div>
      
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-500 mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Generate Documents
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Select a document type to get started
          </p>
        </div>

        {/* Document Category Selection */}
        {!documentCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setDocumentCategory("PERSONAL_BANK")}
              className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-orange-500/50 hover:bg-slate-800 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Personal Bank Statement</h3>
              <p className="text-slate-400 text-sm">Generate personal bank statements with optional payslips</p>
            </button>

            <button
              onClick={() => setDocumentCategory("BUSINESS_BANK")}
              className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-orange-500/50 hover:bg-slate-800 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Business Bank Statement</h3>
              <p className="text-slate-400 text-sm">Generate business bank statements with financial reports</p>
            </button>

            <button
              onClick={() => setDocumentCategory("ID_DOCUMENT")}
              className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-orange-500/50 hover:bg-slate-800 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <IdCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">ID Document</h3>
              <p className="text-slate-400 text-sm">Create South African ID documents</p>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Back to category selection */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDocumentCategory(null)}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Choose different document
            </Button>

            {/* Auth Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-sm text-slate-300">
                {phone ? (
                  <span>Logged in as: <span className="text-orange-400">{phone}</span></span>
                ) : (
                  <span className="text-slate-400">Login required to generate documents</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Available Balance</p>
                  <p className="text-lg font-bold text-white">R{balance}</p>
                </div>
                {phone ? (
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsTopUpOpen(true)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      Top Up
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={logout} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsLoginOpen(true)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Login
                  </Button>
                )}
              </div>
            </div>

            {/* Personal Bank Statement Form */}
            {documentCategory === "PERSONAL_BANK" && (
              <div className="space-y-6">
                {/* Company Section */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Company Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingSelect
                      id="companySelect"
                      label="Select Company"
                      value={selectedCompanyId}
                      options={companies?.map(c => ({ value: c.companyId, label: c.companyName }))}
                      onChange={(e) => handleCompanySelect(e.target.value)}
                    />
                    <FloatingSelect
                      id="role"
                      label="Role / Department"
                      value={selectedRole}
                      options={availableRoles}
                      onChange={(e) => {
                        setSelectedRole(e.target.value);
                        handlePersonalChange('department', e.target.value);
                      }}
                    />
                    <FloatingInput
                      id="companyName"
                      label="Company Name"
                      value={personalData.companyName}
                      onChange={(e) => handlePersonalChange('companyName', e.target.value)}
                    />
                    <FloatingInput
                      id="companyTel"
                      label="Company Telephone"
                      value={personalData.companyTel}
                      onChange={(e) => handlePersonalChange('companyTel', e.target.value)}
                    />
                  </div>
                </div>

                {/* Personal Details */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <User className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Personal Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingSelect
                      id="title"
                      label="Title"
                      value={personalData.title}
                      options={titleOptions}
                      onChange={(e) => handlePersonalChange('title', e.target.value)}
                    />
                    <FloatingInput
                      id="accountHolder"
                      label="Account Holder Name *"
                      value={personalData.accountHolder}
                      onChange={(e) => handlePersonalChange('accountHolder', e.target.value)}
                    />
                    <FloatingInput
                      id="idNumber"
                      label="ID Number"
                      value={personalData.idNumber}
                      onChange={(e) => handlePersonalChange('idNumber', e.target.value)}
                    />
                    <FloatingInput
                      id="employeeID"
                      label="Employee ID"
                      value={personalData.employeeID}
                      onChange={(e) => handlePersonalChange('employeeID', e.target.value)}
                    />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Bank Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingSelect
                      id="bankType"
                      label="Bank"
                      value={personalData.bankType}
                      options={bankOptions}
                      onChange={(e) => handlePersonalChange('bankType', e.target.value)}
                    />
                    <FloatingInput
                      id="accountNumber"
                      label="Account Number *"
                      value={personalData.accountNumber}
                      onChange={(e) => handlePersonalChange('accountNumber', e.target.value)}
                    />
                    <FloatingInput
                      id="salaryAmount"
                      label="Monthly Salary *"
                      value={personalData.salaryAmount}
                      onChange={(e) => handlePersonalChange('salaryAmount', e.target.value)}
                    />
                    <FloatingSelect
                      id="payDate"
                      label="Pay Day"
                      value={personalData.payDate}
                      options={payDateOptions}
                      onChange={(e) => handlePersonalChange('payDate', e.target.value)}
                    />
                    <FloatingSelect
                      id="months"
                      label="Statement Period"
                      value={personalData.months}
                      options={monthOptions}
                      onChange={(e) => handlePersonalChange('months', e.target.value)}
                    />
                    <FloatingInput
                      id="openBalance"
                      label="Opening Balance"
                      value={personalData.openBalance}
                      onChange={(e) => handlePersonalChange('openBalance', e.target.value)}
                    />
                  </div>
                </div>

                {/* Optional Payslip */}
                {hasPayslipAvailable && (
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="payslip"
                        checked={personalData.isPayslipIncluded}
                        onCheckedChange={(checked) => handlePersonalChange('isPayslipIncluded', String(checked === true))}
                      />
                      <label htmlFor="payslip" className="text-sm text-slate-300">
                        Include Payslip (R{countries.find(c => c.country_code === 'ZA')?.documents.find(d => d.documentType === 'PAYSLIP')?.price || 0})
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Business Bank Statement Form */}
            {documentCategory === "BUSINESS_BANK" && (
              <div className="space-y-6">
                {/* Business Info */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Business Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingInput
                      id="businessName"
                      label="Business Name *"
                      value={businessData.businessName}
                      onChange={(e) => handleBusinessChange('businessName', e.target.value)}
                    />
                    <FloatingInput
                      id="businessRegNo"
                      label="Business Reg No."
                      value={businessData.businessRegNo}
                      onChange={(e) => handleBusinessChange('businessRegNo', e.target.value)}
                    />
                    <FloatingInput
                      id="vatNo"
                      label="VAT No."
                      value={businessData.vatNo}
                      onChange={(e) => handleBusinessChange('vatNo', e.target.value)}
                    />
                    <FloatingInput
                      id="accountNumber"
                      label="Account Number *"
                      value={businessData.accountNumber}
                      onChange={(e) => handleBusinessChange('accountNumber', e.target.value)}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                      <User className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Business Address</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingInput
                      id="addressLine1"
                      label="Address Line 1"
                      value={businessData.addressLine1}
                      onChange={(e) => handleBusinessChange('addressLine1', e.target.value)}
                    />
                    <FloatingInput
                      id="addressLine2"
                      label="Address Line 2"
                      value={businessData.addressLine2}
                      onChange={(e) => handleBusinessChange('addressLine2', e.target.value)}
                    />
                    <FloatingInput
                      id="addressLine3"
                      label="Address Line 3"
                      value={businessData.addressLine3}
                      onChange={(e) => handleBusinessChange('addressLine3', e.target.value)}
                    />
                    <FloatingInput
                      id="addressProvince"
                      label="Province"
                      value={businessData.addressProvince}
                      onChange={(e) => handleBusinessChange('addressProvince', e.target.value)}
                    />
                    <FloatingInput
                      id="addressPostalCode"
                      label="Postal Code"
                      value={businessData.addressPostalCode}
                      onChange={(e) => handleBusinessChange('addressPostalCode', e.target.value)}
                    />
                  </div>
                </div>

                {/* Statement Settings */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Statement Settings</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FloatingSelect
                      id="months"
                      label="Statement Period"
                      value={businessData.months}
                      options={monthOptions}
                      onChange={(e) => handleBusinessChange('months', e.target.value)}
                    />
                    <FloatingInput
                      id="openBalance"
                      label="Opening Balance"
                      value={businessData.openBalance}
                      onChange={(e) => handleBusinessChange('openBalance', e.target.value)}
                    />
                    <FloatingInput
                      id="targetClosingBalance"
                      label="Target Closing Balance"
                      value={businessData.targetClosingBalance}
                      onChange={(e) => handleBusinessChange('targetClosingBalance', e.target.value)}
                    />
                    <FloatingSelect
                      id="salaryDay"
                      label="Salary Day"
                      value={businessData.salaryDay}
                      options={payDateOptions}
                      onChange={(e) => handleBusinessChange('salaryDay', e.target.value)}
                    />
                    <FloatingSelect
                      id="rentalDay"
                      label="Rental Day"
                      value={businessData.rentalDay}
                      options={payDateOptions}
                      onChange={(e) => handleBusinessChange('rentalDay', e.target.value)}
                    />
                  </div>
                </div>

                {/* Financial Statement Option */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700,">
                  <div className="flex items-center space-x-3 mb-4">
                    <Checkbox
                      id="financialRequired"
                      checked={isFinancialRequired}
                      className="w-5 h-5 border-slate-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      onCheckedChange={(checked) => setIsFinancialRequired(checked === true)}
                    />
                    <label htmlFor="financialRequired" className="text-sm font-medium text-white cursor-pointer">
                      Generate Financial Statement (Annual Financial Statements)
                    </label>
                  </div>

                  {isFinancialRequired && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
                      <FloatingInput
                        id="financialStartDate"
                        label="Financial Start Date *"
                        type="date"
                        value={financialStartDate}
                        onChange={(e) => setFinancialStartDate(e.target.value)}
                        className="pt-6"
                      />
                      <FloatingInput
                        id="financialEndDate"
                        label="Financial End Date *"
                        type="date"
                        value={financialEndDate}
                        onChange={(e) => setFinancialEndDate(e.target.value)}
                        className="pt-6"
                      />
                      <FloatingInput
                        id="accountingCompanyName"
                        label="Accounting Firm"
                        value={accountingCompanyName}
                        onChange={(e) => setAccountingCompanyName(e.target.value)}
                      />
                      <FloatingInput
                        id="directorName"
                        label="Director Name"
                        value={directorName}
                        onChange={(e) => setDirectorName(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ID Document Form */}
            {documentCategory === "ID_DOCUMENT" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      <IdCard className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">ID Document Details</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingSelect
                      id="id_service_type"
                      label="ID Service Type"
                      value={idServiceType}
                      options={[
                        { value: "MANUAL", label: "Manual" },
                        { value: "HOME_AFFAIRS", label: "Home Affairs" },
                      ]}
                      onChange={(e) => setIdServiceType(e.target.value as "MANUAL" | "HOME_AFFAIRS")}
                    />
                    <FloatingInput
                      id="id_number"
                      label="ID Number *"
                      value={idFormData.id}
                      onChange={(e) => setIdFormData(prev => ({ ...prev, id: e.target.value }))}
                    />

                    {idServiceType === 'MANUAL' && (
                      <>
                        <FloatingInput
                          id="id_first_name"
                          label="First Name *"
                          value={idFormData.first_name}
                          onChange={(e) => setIdFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        />
                        <FloatingInput
                          id="id_last_name"
                          label="Last Name *"
                          value={idFormData.last_name}
                          onChange={(e) => setIdFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        />
                        <FloatingInput
                          id="id_dob"
                          label="Date of Birth (e.g. 13 OCT 1988)"
                          value={idFormData.dob}
                          onChange={(e) => setIdFormData(prev => ({ ...prev, dob: e.target.value }))}
                        />
                        <FloatingInput
                          id="id_issuing_date"
                          label="Issuing Date (e.g. 31 JUL 2015)"
                          value={idFormData.issuing_date}
                          onChange={(e) => setIdFormData(prev => ({ ...prev, issuing_date: e.target.value }))}
                        />
                        <FloatingInput
                          id="id_document_id"
                          label="Document ID *"
                          value={idFormData.documentId}
                          onChange={(e) => setIdFormData(prev => ({ ...prev, documentId: e.target.value }))}
                        />
                      </>
                    )}
                  </div>

                  {idServiceType === 'MANUAL' && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="text-sm text-slate-300 mb-2 block">Photo *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setIdPhoto(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                        />
                      </div>
                      <div>
                        <FloatingInput
                          id="id_signature"
                          label="Type Your Signature *"
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                        />
                        {signatureVariantUrls.length > 0 && (
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            {signatureVariantUrls.map((url, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedSignatureIndex(idx)}
                                className={`rounded-md border p-2 bg-slate-700/50 transition-colors ${selectedSignatureIndex === idx ? 'border-orange-500' : 'border-slate-600'}`}
                              >
                                <img src={url} alt={`Signature ${idx + 1}`} className="max-h-14 w-auto mx-auto" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Instructions (for bank statements) */}
            {documentCategory !== "ID_DOCUMENT" && (
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Additional Instructions (Optional)</h3>
                <Textarea
                  id="comment"
                  placeholder="Any special requests or notes..."
                  value={documentCategory === "BUSINESS_BANK" ? businessData.comment : personalData.comment}
                  onChange={(e) => documentCategory === "BUSINESS_BANK" ? handleBusinessChange('comment', e.target.value) : handlePersonalChange('comment', e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white min-h-[80px]"
                />
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col items-center pt-4 space-y-4">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Total Cost</p>
                <p className="text-2xl font-bold text-white">R{totalCost}</p>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full md:w-80 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium py-6 rounded-xl shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Documents
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Modals */}
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Login</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <FloatingInput
                id="loginPhone"
                label="Phone Number"
                placeholder="+27 71 234 5678"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
              />
              <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={async () => {
                if (!loginPhone.trim()) {
                  toast.error('Please enter your phone number');
                  return;
                }
                const result = await fetchData({
                  endPoint: '/authenticate',
                  method: 'POST',
                  data: { phoneNumber: loginPhone.trim() },
                });
                if (result && result.status === 1) {
                  login(loginPhone.trim(), result.data.balance);
                  toast.success(result.message);
                  setIsLoginOpen(false);
                } else {
                  toast.error(result?.message || 'Login failed');
                }
              }}>
                Login
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showInsufficientModal} onOpenChange={setShowInsufficientModal}>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Insufficient Balance</DialogTitle>
            </DialogHeader>
            <p className="text-slate-400">
              You don't have enough balance. Please top up to continue.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowInsufficientModal(false)} className="border-slate-600 text-slate-300">Cancel</Button>
              <Button onClick={() => { setShowInsufficientModal(false); setIsTopUpOpen(true); }} className="bg-orange-600 hover:bg-orange-700">Top Up</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
          <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Top Up Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800">
                <h4 className="font-semibold text-white mb-2">Pay with Crypto</h4>
                <p className="text-sm text-slate-400 mb-3">Send BTC to the address below</p>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 rounded bg-slate-900 text-xs break-all flex-1 text-slate-300">{cryptoAddress}</code>
                  <Button type="button" variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(cryptoAddress); toast.success('Address copied'); }}>Copy</Button>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800">
                <h4 className="font-semibold text-white mb-2">CAPITEC BUSINESS ACCOUNT</h4>
                <p className="text-sm text-slate-400">Account Number: <span className="text-orange-400">1054814708</span></p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800">
                <h4 className="font-semibold text-white mb-2">E-WALLET</h4>
                <p className="text-sm text-slate-400">Send eWallet to <span className="text-orange-400">+27692784497</span></p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
          <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirm Details</DialogTitle>
            </DialogHeader>
            <p className="text-slate-400 text-sm mb-4">
              Please verify all details before generating. Corrections may incur additional charges.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfirmationModal(false)} className="border-slate-600 text-slate-300">Cancel</Button>
              <Button onClick={confirmSubmit} className="bg-orange-600 hover:bg-orange-700">Confirm & Generate</Button>
            </div>
          </DialogContent>
        </Dialog>

        <HackingLoaderModal isOpen={isLoading} />
      </div>
    </div>
  );
};
