import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/FloatingInput";
import { FloatingSelect } from "@/components/FloatingSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Loader2, Building2, User, CreditCard, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { DocumentResponse } from "@/types/document";
import { companies } from "@/data/companies";
import { countries } from "@/data/countries";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useAuthStore from "@/store/useAuth";

interface DocumentFormProps {
  onBack: () => void;
  onSuccess: (data: DocumentResponse) => void;
}

const monthOptions = [
  { value: "1", label: "1 Month" },
  { value: "2", label: "2 Months" },
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

const titleOptions = [
  { value: "MR", label: "Mr" },
  { value: "MRS", label: "Mrs" },
  { value: "MS", label: "Ms" },
  { value: "DR", label: "Dr" },
  { value: "PROF", label: "Prof" },
];

const bankTypeOptions = [
  { value: "tymebank", label: "TymeBank" },
  { value: "standard", label: "Standard Bank" },
];

export const DocumentForm = ({ onBack, onSuccess }: DocumentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [countryCode, setCountryCode] = useState<'ZA' | 'NG' | 'US'>("ZA");
  const [isPayslipIncluded, setIsPayslipIncluded] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
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
  });

  // Use individual selectors to prevent unnecessary re-renders
  const phone = useAuthStore((state) => state.phone);
  const balance = useAuthStore((state) => state.balance);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const cryptoAddress = useMemo(() => {
    const chars = "abcdef0123456789";
    let addr = "0x";
    for (let i = 0; i < 40; i++) addr += chars[Math.floor(Math.random() * chars.length)];
    return addr;
  }, []);

  const hasPayslipAvailable = useMemo(() => {
    const cfg = countries.find(c => c.country_code === countryCode);
    return !!cfg?.documents.some(d => d.documentType === 'PAYSLIP');
  }, [countryCode]);

  useEffect(() => {
    if (!hasPayslipAvailable) setIsPayslipIncluded(false);
  }, [hasPayslipAvailable]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['accountHolder', 'accountNumber', 'salaryAmount', 'idNumber', 'companyName'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Email is optional - users can use their own email

    setIsLoading(true);
    
    toast.info("Generating your documents. This may take up to 3 minutes. A popup will appear when ready.", {
      duration: 10000,
    });

    try {
      const response = await fetch('https://documents-225250995708.europe-west1.run.app/api/generateDocs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          idNumber: formData.idNumber,
          physicalAddress: formData.physicalAddress,
          taxReference: formData.taxReference,
          department: formData.department,
          branchCode: formData.branchCode,
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          companyEmail: formData.companyEmail || "info@gautengtech.digital",
          companyTel: formData.companyTel,
          isPayslipIncluded,
          countryCode,
          userPhone: phone || undefined,
        }),
      });

      const data = await response.json();

      if (data.status === 1) {
        toast.success(data.message || "Documents generated successfully!");
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
    <section className="min-h-screen bg-background py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-8 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Generate Documents
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Fill in your details below to generate professional bank statements and payslips.
          </p>

          {/* Country Selector Box */}
          <div className="mt-6 w-full">
            <div className="glass-card rounded-2xl p-6">
              <div className="mb-2 text-left">
                <h2 className="font-display text-lg font-semibold text-foreground">Select Your Country</h2>
                <p className="text-sm text-muted-foreground">We currently offer document generation for supported countries.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FloatingSelect
                  id="country"
                  label="Country"
                  value={countryCode}
                  options={countries.map(c => ({ value: c.country_code, label: c.countryName }))}
                  onChange={(e) => setCountryCode(e.target.value as 'ZA' | 'NG' | 'US')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Unsupported Country */}
        {countryCode !== 'ZA' ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">Unsupported Country</h3>
            <p className="text-muted-foreground">
              We do not offer document editing in your country yet. Please select South Africa or check back later.
            </p>
          </div>
        ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Auth and Balance Bar */}
          <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {phone ? (
                <span>Logged in as <span className="font-medium text-foreground">{phone}</span></span>
              ) : (
                <span>You are not logged in</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm">Balance: <span className="font-semibold">R {balance?.toFixed(2) || '0.00'}</span></div>
              <Button type="button" variant="outline" onClick={() => setIsTopUpOpen(true)}>Top Up Balance</Button>
              {phone ? (
                <Button type="button" variant="secondary" onClick={logout}>Logout</Button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => setIsLoginOpen(true)}>Login</Button>
              )}
            </div>
          </div>
          {/* Personal Information */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
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
              <FloatingInput
                id="taxReference"
                label="Tax Reference"
                value={formData.taxReference}
                onChange={(e) => handleChange('taxReference', e.target.value)}
              />
              <FloatingInput
                id="employeeID"
                label="Employee ID"
                value={formData.employeeID}
                onChange={(e) => handleChange('employeeID', e.target.value)}
              />
            </div>
          </div>

          {/* Banking Details */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Banking Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingInput
                id="accountNumber"
                label="Account Number *"
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
              />
              <FloatingSelect
                id="bankType"
                label="Bank Type *"
                value={formData.bankType}
                options={bankTypeOptions}
                onChange={(e) => handleChange('bankType', e.target.value)}
              />
              <FloatingInput
                id="branchCode"
                label="Branch Code"
                value={formData.branchCode}
                onChange={(e) => handleChange('branchCode', e.target.value)}
              />
              <FloatingSelect
                id="paymentMethod"
                label="Payment Method"
                value={formData.paymentMethod}
                options={paymentMethodOptions}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
              />
              <FloatingInput
                id="openBalance"
                label="Opening Balance (R)"
                type="number"
                value={formData.openBalance}
                onChange={(e) => handleChange('openBalance', e.target.value)}
              />
              <FloatingInput
                id="availableBalance"
                label="Available Balance (R)"
                type="number"
                value={formData.availableBalance}
                onChange={(e) => handleChange('availableBalance', e.target.value)}
              />
            </div>
          </div>

          {/* Salary Details */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Salary Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FloatingInput
                id="salaryAmount"
                label="Salary Amount (R) *"
                type="number"
                value={formData.salaryAmount}
                onChange={(e) => handleChange('salaryAmount', e.target.value)}
              />
              <FloatingSelect
                id="months"
                label="Number of Months"
                value={formData.months}
                options={monthOptions}
                onChange={(e) => handleChange('months', e.target.value)}
              />
              <FloatingSelect
                id="payDate"
                label="Pay Date"
                value={formData.payDate}
                options={payDateOptions}
                onChange={(e) => handleChange('payDate', e.target.value)}
              />
            </div>
            
            <FloatingInput
              id="department"
              label="Department"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
            />
          </div>

          {/* Document Options */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox id="includePayslips" checked={isPayslipIncluded} disabled={!hasPayslipAvailable} onCheckedChange={(v) => setIsPayslipIncluded(!!v)} />
                <label htmlFor="includePayslips" className="text-foreground">Include Payslips</label>
              </div>
              <div className="text-sm text-muted-foreground">
                {hasPayslipAvailable ? 'Payslips available in your country' : 'Payslips not available in your country'}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Company Information</h2>
            </div>
            
            <Tabs defaultValue="managed" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="managed">Managed Companies</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="managed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingSelect
                    id="managedCompany"
                    label="Select Company"
                    value={selectedCompanyId}
                    options={companies.map(c => ({ value: c.companyId, label: c.companyName }))}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedCompanyId(id);
                      const c = companies.find(x => x.companyId === id);
                      if (c) {
                        setFormData(prev => ({
                          ...prev,
                          companyName: c.companyName,
                          companyEmail: c.email,
                          companyTel: c.phone,
                          companyAddress: c.address,
                        }));
                      }
                    }}
                  />
                  <div />
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

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              variant="hero"
              size="xl"
              disabled={isLoading}
              className="w-full md:w-auto min-w-[300px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Documents...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Documents
                </>
              )}
            </Button>
          </div>

          {isLoading && (
            <p className="text-center text-muted-foreground text-sm">
              Please wait... A popup will appear when your documents are ready for download.
            </p>
          )}
        </form>
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
                onClick={() => {
                  if (!loginPhone.trim()) {
                    toast.error('Please enter your phone number');
                    return;
                  }
                  login(loginPhone.trim());
                  toast.success('Logged in');
                  setIsLoginOpen(false);
                }}
              >
                Login
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Top Up Modal */}
        <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Top Up Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="glass-card p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Pay with Crypto</h4>
                <p className="text-sm text-muted-foreground mb-3">Send any supported crypto to the address below, then send POP via WhatsApp.</p>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 rounded bg-muted text-xs break-all flex-1">{cryptoAddress}</code>
                  <Button type="button" variant="outline" onClick={() => { navigator.clipboard.writeText(cryptoAddress); toast.success('Address copied'); }}>Copy</Button>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Pay to FNB Account</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><span className="font-medium text-foreground">Bank:</span> FNB</li>
                  <li><span className="font-medium text-foreground">Account Name:</span> GautengTech Digital</li>
                  <li><span className="font-medium text-foreground">Account Number:</span> 62012345678</li>
                  <li><span className="font-medium text-foreground">Branch Code:</span> 250655</li>
                  <li><span className="font-medium text-foreground">Reference:</span> Your Phone Number</li>
                </ul>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Pay via E-WALLET</h4>
                <p className="text-sm text-muted-foreground">Send an eWallet to <span className="font-medium text-foreground">+27 609 155 512</span> and share proof via WhatsApp.</p>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Send Proof of Payment</h4>
                <p className="text-sm text-muted-foreground">Send POP to our WhatsApp number shown in the footer: <span className="font-medium text-foreground">+27 609 155 512</span>.</p>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setIsTopUpOpen(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
