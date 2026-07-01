/** Fields searched when filtering loans (case-insensitive substring match). */
const LOAN_SEARCH_FIELDS = [
    'id',
    'applicantName',
    'mobile',
    'aadhar',
    'address',
    'city',
    'townVillage',
    'guarantorName',
    'guarantorMobile',
    'guarantorAadhar',
    'guarantorAddress',
    'guarantorCity',
    'guarantorTownVillage',
    'vehicleProduct',
    'makerCompany',
    'model',
    'vehicleNumber',
    'engineSerialNumber',
] as const;

export function matchesLoanSearch(loan: Record<string, unknown>, searchTerm: string): boolean {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    return LOAN_SEARCH_FIELDS.some((field) =>
        String(loan[field] ?? '').toLowerCase().includes(term)
    );
}
