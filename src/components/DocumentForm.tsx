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
  const [isPayslipIncluded, setIsPayslipIncluded] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState<{value: string, label: string}[]>([]);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4 sm:py-12 sm:px-6">
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
      
      <div className="relative z-10 container mx-auto max-w-4xl">
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-orange-500 mb-4">
            Generate Documents
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Fill in your details below to generate professional bank statements and payslips.
          </p>

          {/* Country Selector Box */}
          <div className="mt-6 w-full">
            <div className="glass-card rounded-2xl p-4 sm:p-6">
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
              className="space-y-4 sm:space-y-6"
            >
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Gradient header */}
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 sm:p-6 text-white flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold">Document Generation</h1>
                  <p className="text-cyan-100 text-sm mt-1">AI-Powered Document Creation</p>
                </div>
                <div className="text-center sm:text-right mt-4 sm:mt-0">
                  <p className="text-cyan-100 text-sm">Available Balance</p>
                  <p className="text-xl sm:text-2xl font-bold">R{balance}</p>
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
          <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
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

          {/* Company Information */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
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

              {/* Submit Button */}
              <div className="flex flex-col items-center pt-4 space-y-4">
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
    </div>
  );
};
