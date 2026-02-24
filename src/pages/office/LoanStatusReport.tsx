import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, CheckCircle, AlertOctagon, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDate, formatCurrency, getDueDays } from '../../utils/dateUtils';
import { exportToExcel, exportMultipleSheetsToExcel } from '../../utils/excelUtils';

interface LoanReportItem {
    id: string; // LAN
    fileDate: string; // LAN Issue Date
    applicantName: string;
    guarantorName: string;
    vehicleProduct: string;
    vehicleNumber: string;
    model: string;
    loanAmount: string; // Principal / Loan Taken
    totalAmount: string; // Loan Amount + Interest
    installmentAmount: string;
    noOfInstallments: number;
    emiDate: string;
    isActive: boolean;
    Repayments: any[];
}

export default function LoanStatusReport() {
    const [loans, setLoans] = useState<LoanReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

    // Fetch all loans on mount
    useEffect(() => {
        fetchLoans();
        // Set filter from URL
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get('filter');
        if (filterParam === 'ACTIVE') setStatusFilter('ACTIVE');
        if (filterParam === 'CLOSED') setStatusFilter('CLOSED');
    }, []);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            // Always fetch ALL loans WITH repayments for client-side filtering & calculation
            const response = await fetch(`${API_URL}/loans?includeRepayments=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setLoans(data.loans);
            } else {
                setLoans([]);
            }
        } catch (error) {
            console.error("Failed to fetch loans", error);
            setLoans([]);
        } finally {
            setLoading(false);
        }
    };

    // Calculation Logic for Columns
    const processLoanData = (loan: LoanReportItem) => {
        const totalPaid = loan.Repayments?.reduce((sum, r) => sum + parseFloat(r.amount), 0) || 0;
        const totalLoanAmount = parseFloat(loan.totalAmount); // Total Repayable (P + I)
        const principalAmount = parseFloat(loan.loanAmount); // Principal
        let lanBalance = totalLoanAmount - totalPaid; // Total Outstanding (Future + Past)
        const installmentAmt = parseFloat(loan.installmentAmount);
        const monthsPaid = installmentAmt > 0 ? Math.floor(totalPaid / installmentAmt) : 0;

        // "Pending From" - Last payment date or Issue date
        const lastPaymentDate = loan.Repayments?.length > 0
            ? loan.Repayments[loan.Repayments.length - 1].paymentDate
            : loan.fileDate;

        // "Pending Days" - Days since next due date (if active)
        let pendingDays = loan.isActive ? getDueDays(loan.emiDate) : 0;

        // Arrears Logic (Kept for reference or if needed later, but User wants Pending Amount = Balance)
        const today = new Date();
        const fileDateObj = new Date(loan.fileDate);
        const monthsPassed = (today.getFullYear() - fileDateObj.getFullYear()) * 12 + (today.getMonth() - fileDateObj.getMonth());
        const effectiveMonthsPassed = Math.min(monthsPassed, loan.noOfInstallments);
        const amountShouldHavePaid = effectiveMonthsPassed * installmentAmt;
        let arrearsAmount = Math.max(0, amountShouldHavePaid - totalPaid);

        if (!loan.isActive) {
            lanBalance = 0;
            pendingDays = 0;
            arrearsAmount = 0;
        }

        return {
            ...loan,
            totalPaid,
            lanBalance,
            monthsPaid,
            lastPaymentDate,
            pendingDays,
            arrearsAmount,
            principalAmount
        };
    };

    const filteredLoans = loans
        .map(processLoanData)
        .filter(loan => {
            // 1. Status Filter
            const matchesStatus =
                statusFilter === 'ALL' ? true :
                    statusFilter === 'ACTIVE' ? loan.isActive :
                        !loan.isActive;

            // 2. Search Filter (Regex-like, case insensitive)
            if (!searchTerm.trim()) return matchesStatus;

            const searchLower = searchTerm.toLowerCase().trim();
            const matchesSearch =
                (String(loan.id || '').toLowerCase().includes(searchLower)) ||
                (String(loan.applicantName || '').toLowerCase().includes(searchLower)) ||
                (String(loan.vehicleNumber || '').toLowerCase().includes(searchLower)) ||
                (String(loan.vehicleProduct || '').toLowerCase().includes(searchLower)) ||
                (String(loan.guarantorName || '').toLowerCase().includes(searchLower));

            return matchesStatus && matchesSearch;
        });

    const handleExport = () => {
        const formatLoanForExport = (loan: any, index: number) => ({
            'Serial Number': index + 1,
            'LAN Number': loan.id,
            'LAN Issue Date': formatDate(loan.fileDate),
            'Name': loan.applicantName,
            'Guarantor Name': loan.guarantorName,
            'Product/Vehicle': `${loan.vehicleProduct} - ${loan.model}`,
            'Vehicle Number': loan.vehicleNumber,
            'Loan Amount': parseFloat(loan.principalAmount || loan.loanAmount),
            'Pending From': formatDate(loan.lastPaymentDate),
            'Installment Amount': parseFloat(loan.installmentAmount),
            'Pending Amount (Balance)': parseFloat(loan.lanBalance.toFixed(2)),
            'How Many Months Paid': `${loan.monthsPaid}/${loan.noOfInstallments}`,
            'Pending Days': loan.pendingDays,
            'Active Status': loan.isActive ? 'Active' : 'Closed'
        });

        if (statusFilter === 'ALL') {
            const activeLoans = filteredLoans.filter(l => l.isActive).map((loan, index) => formatLoanForExport(loan, index));
            const closedLoans = filteredLoans.filter(l => !l.isActive).map((loan, index) => formatLoanForExport(loan, index));

            exportMultipleSheetsToExcel([
                { sheetName: 'Active Loans', data: activeLoans },
                { sheetName: 'Closed Loans', data: closedLoans }
            ], `Loan_Status_Report_ALL_${new Date().toISOString().split('T')[0]}`);
        } else {
            const exportData = filteredLoans.map((loan, index) => formatLoanForExport(loan, index));
            exportToExcel(exportData, `Loan_Status_Report_${statusFilter}_${new Date().toISOString().split('T')[0]}`);
        }
    };

    return (
        <div className="max-w-screen-2xl mx-auto mt-6 mb-10 px-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand-red" /> Loan Status Report
                    </h2>
                    <Button onClick={handleExport} variant="primary" className="shadow-sm">
                        <Download className="w-4 h-4 mr-2" /> Export to XLSX
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by LAN, Name, or Vehicle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        {['ALL', 'ACTIVE', 'CLOSED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === status
                                    ? 'bg-white text-brand-red shadow-sm border border-gray-100'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold border-b border-gray-200 whitespace-nowrap">
                            <tr>
                                <th className="px-4 py-3">Sr. No</th>
                                <th className="px-4 py-3">LAN</th>
                                <th className="px-4 py-3">Issue Date</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Guarantor</th>
                                <th className="px-4 py-3">Vehicle Details</th>
                                <th className="px-4 py-3 text-right">Loan Amount</th>
                                <th className="px-4 py-3">Pending From</th>
                                <th className="px-4 py-3 text-right">Installment</th>
                                <th className="px-4 py-3 text-right">Pending Amount</th>
                                <th className="px-4 py-3 text-center">Paid (Mos)</th>
                                <th className="px-4 py-3 text-center">Pending (Days)</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                                        Loading loan data...
                                    </td>
                                </tr>
                            ) : filteredLoans.length > 0 ? (
                                filteredLoans.map((loan, index) => (
                                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors whitespace-nowrap">
                                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-brand-red">{loan.id}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatDate(loan.fileDate)}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{loan.applicantName}</td>
                                        <td className="px-4 py-3 text-gray-500">{loan.guarantorName}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900">{loan.vehicleNumber}</div>
                                            <div className="text-xs text-gray-500">{loan.vehicleProduct}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{formatCurrency(loan.principalAmount)}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatDate(loan.lastPaymentDate)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(parseFloat(loan.installmentAmount))}</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-red-600">{formatCurrency(loan.lanBalance)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                                                {loan.monthsPaid} / {loan.noOfInstallments}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${loan.pendingDays < 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                                {Math.abs(loan.pendingDays)} {loan.pendingDays < 0 ? 'Overdue' : 'Left'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {loan.isActive ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                                                    <AlertOctagon className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                                    <CheckCircle className="w-3 h-3" /> Closed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                                        No loans found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                    <div>Showing {filteredLoans.length} records</div>
                    <div>Generated at {new Date().toLocaleTimeString()}</div>
                </div>
            </div>
        </div>
    );
}
