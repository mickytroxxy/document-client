export type DocumentConfig = {
  documentType: 'BANK_STATEMENT' | 'PAYSLIP';
  price: number;
};

export type Country = {
  countryName: string;
  country_code: 'ZA' | 'NG' | 'US';
  documents: DocumentConfig[];
};

export const countries: Country[] = [
  {
    countryName: 'South Africa',
    country_code: 'ZA',
    documents: [
      { documentType: 'BANK_STATEMENT', price: 200 },
      { documentType: 'PAYSLIP', price: 100 },
    ],
  },
  {
    countryName: 'Nigeria',
    country_code: 'NG',
    documents: [
      { documentType: 'BANK_STATEMENT', price: 200 },
      { documentType: 'PAYSLIP', price: 100 },
    ],
  },
  {
    countryName: 'United States',
    country_code: 'US',
    documents: [
      { documentType: 'BANK_STATEMENT', price: 200 },
      { documentType: 'PAYSLIP', price: 100 },
    ],
  },
];
