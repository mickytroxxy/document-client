import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/FloatingInput";
import { FloatingSelect } from "@/components/FloatingSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Loader2, Building2, User, CreditCard, Briefcase, Ghost } from "lucide-react";
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
import useFetch from "@/hooks/useFetch";

interface DocumentFormProps {
  onBack: () => void;
  onSuccess: (data: DocumentResponse) => void;
}

const monthOptions = [
  { value: "3", label: "3 Months" },
  { value: "6", label: "6 Months" },
];

const payDateOptions = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`,
}));

const paymentMethodOptions = [
  { value: "Bank Deposit", label: "Bank Deposit" },
  { value: "EFT Transfer", label: "EFT Transfer" },
  { value: "Direct Deposit", label: "Direct Deposit" },
];

const accountTypeOptions = [
  { value: "Easy Zero", label: "Easy Zero" },
  { value: "Easy PAYU", label: "Easy PAYU" },
  { value: "Easy Smart/Bundled", label: "Easy Smart/Bundled" },
  
  { value: "Aspire Current Account", label: "Aspire Current Account" },
  { value: "Premier Current Account", label: "Premier Current Account" },
  
  { value: "Business Account", label: "Business Account" },
  { value: "Cheque Account", label: "Cheque Account" },
  { value: "Savings Account", label: "Savings Account" }
];


const titleOptions = [
  { value: "MR", label: "Mr" },
  { value: "MRS", label: "Mrs" },
  { value: "MS", label: "Ms" },
  { value: "DR", label: "Dr" },
  { value: "PROF", label: "Prof" },
];





export const DocumentForm = ({ onBack, onSuccess }: DocumentFormProps) => {
  const { fetchData } = useFetch();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [countryCode, setCountryCode] = useState<'ZA' | 'NG' | 'US'>("ZA");
  const [isPayslipIncluded, setIsPayslipIncluded] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<{value: string, label: string}[]>([]);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const bankTypeOptions = useMemo(() => banks, [banks]);
  const [formData, setFormData] = useState({
    title: "MR",
    accountHolder: "",
    accountNumber: "",
    months: "3",
    openBalance: "0",
    availableBalance: "10000",
    salaryAmount: "",
    payDate: "30",
    employeeID: "",
    paymentMethod: "Bank Deposit",
    bankType: "tymebank",
    idNumber: "",
    physicalAddress: "",
    taxReference: "",
    department: "",
    branchCode: "",
    companyName: "",
    companyAddress: "",
    companyEmail: "",
    companyTel: "",
    comment: "",
    accountType: "Business Account",
  });

  // Use individual selectors to prevent unnecessary re-renders
  const phone = useAuthStore((state) => state.phone);
  const balance = useAuthStore((state) => state.balance);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const topUp = useAuthStore((state) => state.topUp);

  const cryptoAddress = useMemo(() => {
    
    return '15ELLpRdsKgWke2K7J1SXncwsGTJrcMJpF';
  }, []);

  const hasPayslipAvailable = useMemo(() => {
    const cfg = countries.find(c => c.country_code === countryCode);
    return !!cfg?.documents.some(d => d.documentType === 'PAYSLIP');
  }, [countryCode, countries]);

  const totalCost = useMemo(() => {
    const cfg = countries.find(c => c.country_code === countryCode);
    const bankPrice = cfg?.documents.find(d => d.documentType === 'BANK_STATEMENT')?.price || 0;
    const payslipPrice = cfg?.documents.find(d => d.documentType === 'PAYSLIP')?.price || 0;
    return bankPrice + (isPayslipIncluded ? payslipPrice : 0);
  }, [countryCode, isPayslipIncluded, countries]);

  useEffect(() => {
    if (!hasPayslipAvailable) setIsPayslipIncluded(false);
  }, [hasPayslipAvailable]);

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
      }).catch(() => {
        // ignore errors
      });
    }
  }, [phone, fetchData, login]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check balance
    if (balance < totalCost) {
      setShowInsufficientModal(true);
      return;
    }

    // Validate required fields
    const requiredFields = ['accountHolder', 'accountNumber', 'salaryAmount', 'idNumber', 'companyName'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmationModal(false);
    setIsLoading(true);

    toast.info("Generating your documents. This may take up to 3 minutes. A popup will appear when ready.", {
      duration: 10000,
    });

    try {
      const data = await fetchData({
        endPoint: '/generateDocs',
        method: 'POST',
        data: {
          title: formData.title,
          accountHolder: formData.accountHolder,
          accountNumber: formData.accountNumber,
          months: parseInt(formData.months),
          openBalance: parseFloat(formData.openBalance) || 0,
          availableBalance: parseFloat(formData.availableBalance) || 0,
          salaryAmount: parseFloat(formData.salaryAmount),
          payDate: formData.payDate,
          employeeID: formData.employeeID,
          paymentMethod: formData.paymentMethod,
          bankName: formData.bankType,
          bankType: formData.bankType,
          accountType: formData.accountType,
          idNumber: formData.idNumber,
          physicalAddress: formData.physicalAddress,
          taxReference: formData.taxReference,
          department: formData.department,
          branchCode: formData.branchCode,
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          companyEmail: formData.companyEmail || "info@gautengtech.digital",
          companyTel: formData.companyTel,
          companyId: selectedCompanyId || 'RANDOM',
          isPayslipIncluded,
          countryCode,
          userPhone: phone || undefined,
          comment: formData.comment,
          totalCost,
        },
      });

      if (data && data.status === 1) {
        toast.success(data.message || "Documents generated successfully!");
        // Update local balance
        topUp(-totalCost);
        // Ensure we have the arrays for bankstatements and payslips
        const responseData = {
          ...data,
          bankstatements: data.bankstatements || [],
          payslips: data.payslips || [],
          // Maintain backward compatibility
          bankstatementUrl: data.bankstatementUrl || data.bankstatements?.[0] || '',
          payslip1: data.payslip1 || data.payslips?.[0] || '',
          payslip2: data.payslip2 || data.payslips?.[1] || '',
          payslip3: data.payslip3 || data.payslips?.[2] || ''
        };
        onSuccess(responseData);
      } else {
        toast.error(data.message || "Failed to generate documents. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-4 px-2 sm:py-8 sm:px-4 md:py-12 md:px-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] opacity-30"
          style={{
            animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}
        />
      </div>
      
      <div className="relative z-10 w-full px-2 sm:container sm:mx-auto sm:max-w-4xl sm:px-4 md:px-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 sm:mb-8 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:w-16 sm:h-16 rounded-2xl bg-orange-500/10 text-orange-500 mb-3 sm:mb-4 md:mb-6">
            <FileText className="w-5 h-5 sm:w-6 sm:w-8 sm:h-8" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-orange-500 mb-1 sm:mb-2 md:mb-4">
            Generate Documents
          </h1>
          <p className="hidden sm:block text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Fill in your details below to generate professional bank statements and payslips.
          </p>

          {/* Country Selector Box */}
          <div className="mt-2 sm:mt-6 w-full">
            <div className="glass-card rounded-2xl p-2 sm:p-4 md:p-6">
              <div className="mb-1 sm:mb-2 text-left">
                <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">Select Your Country</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">We currently offer document generation for supported countries.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FloatingSelect
                  id="country"
                  label="Country"
                  value={countryCode}
                  options={countries?.map(c => ({ value: c.country_code, label: c.countryName }))}
                  onChange={(e) => setCountryCode(e.target.value as 'ZA' | 'NG' | 'US')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Unsupported Country */}
        {countryCode !== 'ZA' ? (
          <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 text-center">
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">Unsupported Country</h3>
            <p className="text-muted-foreground">
              We do not offer document editing in your country yet. Please select South Africa or check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-2 sm:space-y-4 md:space-y-6"
            >
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Gradient header */}
              <div className="glass-card p-3 sm:p-4 md:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Document Generation</h1>
                  <p className="text-dark-100 text-xs sm:text-sm mt-1">AI-Powered Document Creation</p>
                </div>
                <div className="text-center sm:text-right mt-2 sm:mt-0">
                  <p className="text-dark-100 text-xs sm:text-sm">Available Balance</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">R{balance}</p>
                </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-6">
              {/* Auth and Balance Bar */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-white/10">
                <div className="text-sm text-cyan-100">
                  {hasPayslipAvailable ? '✓ Payslips available in your country' : 'Payslips not available in your country'}
                </div>
                {phone ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-cyan-100">Logged in as: {phone}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsTopUpOpen(true);
                      }}
                      className="text-cyan-100 border-cyan-100/30 hover:bg-cyan-600/20"
                    >
                      Top Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        logout();
                      }}
                      className="text-cyan-100 border-cyan-100/30 hover:bg-cyan-600/20"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.preventDefault();
                      setIsLoginOpen(true);
                    }}
                    className="text-cyan-100 border-cyan-100/30 hover:bg-cyan-600/20"
                  >
                    Login / Register
                  </Button>
                )}
              </div>
          </div>
          </div>

          {/* Company Information */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Company Information</h2>
            </div>

            <Tabs defaultValue="managed" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger value="managed">Managed Entities</TabsTrigger>
                <TabsTrigger value="manual">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="managed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingSelect
                    id="managedCompany"
                    label="Select Company"
                    value={selectedCompanyId}
                    options={companies?.map(c => ({ value: c.companyId, label: c.companyName }))}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedCompanyId(id);
                      const c = companies?.find(x => x.companyId === id);
                      if (c) {
                        setFormData(prev => ({
                          ...prev,
                          companyName: c.companyName,
                          companyEmail: c.email,
                          companyTel: c.phone,
                          companyAddress: c.address,
                        }));
                        setAvailableRoles(c.roles.map(r => ({ value: r, label: r })));
                      }
                      setSelectedRole("");
                      setFormData(prev => ({ ...prev, department: "" }));
                    }}
                  />
                  <FloatingSelect
                    id="role"
                    label="Role"
                    value={selectedRole}
                    options={availableRoles}
                    onChange={(e) => {
                      const role = e.target.value;
                      setSelectedRole(role);
                      setFormData(prev => ({ ...prev, department: role }));
                    }}
                  />
                  <FloatingInput
                    id="companyNameManaged"
                    label="Company Name"
                    value={formData.companyName}
                    disabled
                  />
                  <FloatingInput
                    id="companyEmailManaged"
                    label="Company Email"
                    value={formData.companyEmail}
                    disabled
                  />
                  <FloatingInput
                    id="companyTelManaged"
                    label="Company Telephone"
                    value={formData.companyTel}
                    disabled
                  />
                  <FloatingInput
                    id="companyAddressManaged"
                    label="Company Address"
                    value={formData.companyAddress}
                    disabled
                  />
                </div>
              </TabsContent>

              <TabsContent value="manual">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput
                    id="companyName"
                    label="Company Name *"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                  />
                  <FloatingInput
                    id="department"
                    label="Department"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                  />
                  <FloatingInput
                    id="companyEmail"
                    label="Company Email (@gautengtech.digital)"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => handleChange('companyEmail', e.target.value)}
                    placeholder="info@gautengtech.digital"
                  />
                  <FloatingInput
                    id="companyTel"
                    label="Company Telephone"
                    value={formData.companyTel}
                    onChange={(e) => handleChange('companyTel', e.target.value)}
                  />
                  <FloatingInput
                    id="companyAddress"
                    label="Company Address"
                    value={formData.companyAddress}
                    onChange={(e) => handleChange('companyAddress', e.target.value)}
                  />
                </div>
              </TabsContent>
              </Tabs>
              </div>

          {/* Personal Information */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <User className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingSelect
                id="title"
                label="Title *"
                value={formData.title}
                options={titleOptions}
                onChange={(e) => handleChange('title', e.target.value)}
              />
              <FloatingInput
                id="accountHolder"
                label="Account Holder Name *"
                value={formData.accountHolder}
                onChange={(e) => handleChange('accountHolder', e.target.value)}
              />
              <FloatingInput
                id="idNumber"
                label="ID Number *"
                value={formData.idNumber}
                onChange={(e) => handleChange('idNumber', e.target.value)}
              />
              <FloatingInput
                id="physicalAddress"
                label="Physical Address"
                value={formData.physicalAddress}
                onChange={(e) => handleChange('physicalAddress', e.target.value)}
              />
            </div>
          </div>

          {/* Bank Information */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4 md:space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Bank Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingSelect
                id="paymentMethod"
                label="Payment Method"
                value={formData.paymentMethod}
                options={paymentMethodOptions}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
              />
              <FloatingSelect
                id="bankType"
                label="Bank Type"
                value={formData.bankType}
                options={bankTypeOptions}
                onChange={(e) => handleChange('bankType', e.target.value)}
              />
              {formData.bankType === "FNB" && (
                <FloatingSelect
                  id="accountType"
                  label="Account Type"
                  value={formData.accountType}
                  options={accountTypeOptions}
                  onChange={(e) => handleChange('accountType', e.target.value)}
                />
              )}
              <FloatingInput
                id="branchCode"
                label="Branch Code"
                value={formData.branchCode}
                onChange={(e) => handleChange('branchCode', e.target.value)}
              />
              <FloatingInput
                id="accountNumber"
                label="Account Number *"
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Employment Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingInput
                id="salaryAmount"
                label="Monthly Salary Amount *"
                value={formData.salaryAmount}
                onChange={(e) => handleChange('salaryAmount', e.target.value)}
              />
              <FloatingSelect
                id="payDate"
                label="Pay Date"
                value={formData.payDate}
                options={payDateOptions}
                onChange={(e) => handleChange('payDate', e.target.value)}
              />
              <FloatingInput
                id="employeeID"
                label="Employee ID"
                value={formData.employeeID}
                onChange={(e) => handleChange('employeeID', e.target.value)}
              />
              <FloatingInput
                id="taxReference"
                label="Tax Reference"
                value={formData.taxReference}
                onChange={(e) => handleChange('taxReference', e.target.value)}
              />
              <FloatingSelect
                id="months"
                label="Statement Period"
                value={formData.months}
                options={monthOptions}
                onChange={(e) => handleChange('months', e.target.value)}
              />
              <FloatingInput
                id="openBalance"
                label="Opening Balance"
                value={formData.openBalance}
                onChange={(e) => handleChange('openBalance', e.target.value)}
              />
              <FloatingInput
                id="availableBalance"
                label="Available Balance"
                value={formData.availableBalance}
                onChange={(e) => handleChange('availableBalance', e.target.value)}
              />
            </div>
            {hasPayslipAvailable && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="payslipIncluded"
                  checked={isPayslipIncluded}
                  onCheckedChange={(checked) => setIsPayslipIncluded(checked === true)}
                />
                <label htmlFor="payslipIncluded" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Include Payslip
                </label>
              </div>
            )}
          </div>

          {/* Additional Instructions */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Additional Instructions</h2>
            </div>
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium text-foreground">
                Prompt / Special Requests
              </label>
              <Textarea
                id="comment"
                placeholder="Share any specifics (e.g. wording, client details, delivery notes)..."
                value={formData.comment}
                onChange={(e) => handleChange('comment', e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                This prompt will be sent as <code className="font-semibold">comment</code> in the request body.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col items-center pt-4 space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Total Cost: R{totalCost}
            </div>
            <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full md:w-[400px] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-medium py-6 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Generating Documents...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Generate Documents
                    </>
                  )}
                </Button>

                {isLoading && (
                  <p className="text-center text-cyan-100 text-sm max-w-md">
                    Processing your request. This may take a few moments. A popup will appear when your documents are ready for download.
                  </p>
                )}
                </div>
          </form>
        </div>
        )}

        {/* Login Modal */}
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Login</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <FloatingInput
                id="loginPhone"
                label="Phone Number"
                placeholder="e.g. +27 71 234 5678"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
              />
              <Button
                type="button"
                className="w-full"
                onClick={async () => {
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
                }}
              >
                Login
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Insufficient Balance Modal */}
        <Dialog open={showInsufficientModal} onOpenChange={setShowInsufficientModal}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Insufficient Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You don't have enough balance to create a {formData.months} months bank statement{isPayslipIncluded ? ' or payslip' : ''}.
                We are going to only generate a sample 1 bank statement and one payslip for you.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowInsufficientModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, months: '1' }));
                    setIsPayslipIncluded(true);
                    setShowInsufficientModal(false);
                    confirmSubmit();
                  }}
                >
                  Generate Sample
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Top Up Modal */}
        <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Top Up Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 overflow-y-auto max-h-96">
              <div className="glass-card p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Pay with Crypto</h4>
                <p className="text-sm text-muted-foreground mb-3">Send BTC crypto to the address below, then send POP via WhatsApp.</p>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 rounded bg-muted text-xs break-all flex-1">{cryptoAddress}</code>
                  <Button type="button" variant="outline" onClick={() => { navigator.clipboard.writeText(cryptoAddress); toast.success('Address copied'); }}>Copy</Button>
                </div>
              </div>

              {/* <div className="glass-card p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Pay to FNB Account</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><span className="font-medium text-foreground">Bank:</span> FNB</li>
                  <li><span className="font-medium text-foreground">Account Name:</span> GautengTech Digital</li>
                  <li><span className="font-medium text-foreground">Account Number:</span> 62012345678</li>
                  <li><span className="font-medium text-foreground">Branch Code:</span> 250655</li>
                  <li><span className="font-medium text-foreground">Reference:</span> Your Phone Number</li>
                </ul>
              </div> */}

              <div className="glass-card p-4 rounded-xl">
                <h4 className="font-semibold mb-2">E-WALLET | CASH SEND</h4>
                <p className="text-sm text-muted-foreground">Send an eWallet to <span className="font-medium text-foreground">+27692784497</span> and share proof via WhatsApp.</p>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Send Proof of Payment</h4>
                <p className="text-sm text-muted-foreground">Send POP to our WhatsApp number shown in the footer: <span className="font-medium text-foreground">+27 69 278 4497</span>.</p>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setIsTopUpOpen(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Modal */}
        <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
          <DialogContent className="sm:max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Confirm Your Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Please cross-check all your details carefully. You may be charged for corrections if any changes are needed after submission.
              </p>
              <div className="space-y-2 text-sm">
                <div><strong>Country:</strong> {countries.find(c => c.country_code === countryCode)?.countryName}</div>
                <div><strong>Company:</strong> {formData.companyName}</div>
                <div><strong>Account Holder:</strong> {formData.accountHolder}</div>
                <div><strong>Account Number:</strong> {formData.accountNumber}</div>
                <div><strong>Bank:</strong> {formData.bankType}</div>
                {formData.bankType === "FNB" && <div><strong>Account Type:</strong> {formData.accountType}</div>}
                <div><strong>Salary:</strong> R{formData.salaryAmount}</div>
                <div><strong>Months:</strong> {formData.months}</div>
                <div><strong>Total Cost:</strong> R{totalCost}</div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmSubmit}>
                  Confirm & Generate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hacking Loader Modal */}
        <HackingLoaderModal isOpen={isLoading} />
      </div>
    </div>
  );
};
