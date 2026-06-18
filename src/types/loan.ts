export interface BorrowerDetails {
    applicantName: string;
    mobile: string;
    aadhar: string;
    address: string;
    city: string;
    townVillage: string;
}

export interface LoanEditForm {
    applicantName: string;
    mobile: string;
    aadhar: string;
    address: string;
    city: string;
    townVillage: string;
    guarantorName: string;
    guarantorMobile: string;
    guarantorAadhar: string;
    guarantorAddress: string;
    guarantorCity: string;
    guarantorTownVillage: string;
    vehicleProduct: string;
    makerCompany: string;
    model: string;
    vehicleNumber: string;
    vehiclePurchaseDate: string;
    engineSerialNumber: string;
    frequency: string;
    fileDate: string;
    emiDate: string;
    loanAmount: number;
    noOfInstallments: number;
    interestRate: number;
    interestAmount: number;
    totalAmount: number;
    installmentAmount: number;
}

export interface LoanProfile {
    id: string;
    // Borrower
    applicantName?: string;
    mobile?: string;
    aadhar?: string;
    address?: string;
    city?: string;
    townVillage?: string;
    // Guarantor
    guarantorName?: string;
    guarantorMobile?: string;
    guarantorAadhar?: string;
    guarantorAddress?: string;
    guarantorCity?: string;
    guarantorTownVillage?: string;
    // Vehicle
    vehicleProduct?: string;
    makerCompany?: string;
    model?: string;
    vehicleNumber?: string;
    vehiclePurchaseDate?: string | { _seconds?: number; seconds?: number };
    engineSerialNumber?: string;
    // Loan terms
    frequency?: string;
    fileDate?: string | { _seconds?: number; seconds?: number };
    emiDate?: string | { _seconds?: number; seconds?: number };
    loanAmount?: number | string;
    noOfInstallments?: number;
    interestRate?: number | string;
    interestAmount?: number | string;
    totalAmount?: number | string;
    installmentAmount?: number | string;
    isActive?: boolean;
}

export interface LoanReportItem extends LoanProfile {
    guarantorName: string;
    vehicleProduct: string;
    vehicleNumber: string;
    model: string;
    loanAmount: string;
    totalAmount: string;
    installmentAmount: string;
    noOfInstallments: number;
    emiDate: string;
    fileDate: string;
    isActive: boolean;
    Repayments: { amount: string; paymentDate?: string }[];
}
