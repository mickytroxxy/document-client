import axios from "axios";

export type CompanyInfo = {
  companyId: string;
  companyName: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  roles: string[];
};
export type DocumentConfig = {
  documentType: 'BANK_STATEMENT' | 'PAYSLIP';
  price: number;
};

export type Country = {
  countryName: string;
  country_code: 'ZA' | 'NG' | 'US';
  documents: DocumentConfig[];
};

export type Bank = {
  value: string;
  label: string;
};
const BASE_URL = 'https://documents-225250995708.europe-west1.run.app/api';
//const BASE_URL = 'http://localhost:1337/api';
export const fetchCompanies = async (): Promise<CompanyInfo[]> => {
  try {
    const response:any = await axios.get(`${BASE_URL}/get_companies`);
    return Array.isArray(response.data?.data) ? response.data?.data : [];
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
};


export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response:any = await axios.get(`${BASE_URL}/get_countries`);
    return Array.isArray(response.data?.data) ? response.data?.data : [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
};

export const fetchBanks = async (): Promise<Bank[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/get_banks`);
    return Array.isArray(response.data?.data) ? response.data?.data : [];
  } catch (error) {
    console.error('Error fetching banks:', error);
    return [];
  }
};