import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, FileText, Calendar, IndianRupee, AlertCircle, History, User, CreditCard, Download } from 'lucide-react';
import { formatDate, parseFirestoreDate, formatCurrency } from '../../utils/dateUtils';
import { exportToExcel } from '../../utils/excelUtils';

export default function LoanRepayment() {
    const [searchTerm, setSearchTerm] = useState('');
    const [allLoans, setAllLoans] = useState<any[]>([]);
    const [filteredLoans, setFilteredLoans] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [loan, setLoan] = useState<any>(null);
    const [repayments, setRepayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [paymentForm, setPaymentForm] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        bookNumber: '',
        voucherNumber: '',
        amount: '',
        penalty: 0,
        remarks: ''
    });

    useEffect(() => {
        fetchAllActiveLoans();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredLoans([]);
            return;
        }
        const lowerTerm = searchTerm.toLowerCase().trim();
        const matches = allLoans.filter(l =>
            (l.id && l.id.toLowerCase().includes(lowerTerm)) ||
            (l.applicantName && l.applicantName.toLowerCase().includes(lowerTerm)) ||
            (l.vehicleNumber && l.vehicleNumber.toLowerCase().includes(lowerTerm)) ||
            (l.vehicleProduct && l.vehicleProduct.toLowerCase().includes(lowerTerm))
        );
        setFilteredLoans(matches);
        setShowSuggestions(true);
    }, [searchTerm, allLoans]);

    const fetchAllActiveLoans = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                // Filter only ACTIVE loans for repayment (usually you only pay active loans, but maybe closed too for records? defaulting to all mostly active)
                // Actually, let's keep all, but prioritize active.
                setAllLoans(data.loans.filter((l: any) => l.isActive));
            }
        } catch (error) {
            console.error("Failed to fetch loans", error);
        }
    };

    const handleSelectLoan = (selectedLoan: any) => {
        setSearchTerm(`${selectedLoan.id} - ${selectedLoan.applicantName}`);
        setShowSuggestions(false);
        // Fetch full details for the selected loan
        // We might already have basics, but fetchLoanDetails gets repayments too? 
        // Existing fetchLoanDetails uses searchId. Let's adapt it.
        // Or better, just call the API with the ID.
        fetchFullLoanDetails(selectedLoan.id);
    };

    const fetchFullLoanDetails = async (id: string) => {
        setLoading(true);
        setError('');
        setLoan(null);
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setLoan(data.loan);
                setRepayments(data.loan.Repayments || []);

                // Auto-set amount to installment amount
                setPaymentForm(prev => ({
                    ...prev,
                    amount: data.loan.installmentAmount
                }));

                // Calculate Penalty Logic
                const emiDateObj = parseFirestoreDate(data.loan.emiDate);
                let penaltyAmount = 0;
                if (emiDateObj) {
                    const oneMonthAfterDue = new Date(emiDateObj);
                    oneMonthAfterDue.setMonth(oneMonthAfterDue.getMonth() + 1);
                    if (new Date() > oneMonthAfterDue) {
                        penaltyAmount = parseFloat(data.loan.loanAmount) / 100;
                    }
                }
                setPaymentForm(prev => ({ ...prev, penalty: penaltyAmount }));

            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch loan details');
        } finally {
            setLoading(false);
        }
    };

    // Keep the payment submit logic same...
    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/repayments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    loanId: loan.id,
                    ...paymentForm
                })
            });

            const data = await response.json();
            if (data.success) {
                setSuccess('Payment Recorded Successfully!');
                // Refresh data
                fetchFullLoanDetails(loan.id);
                // Reset form fields
                setPaymentForm({
                    paymentDate: new Date().toISOString().split('T')[0],
                    bookNumber: '',
                    voucherNumber: '',
                    amount: loan.installmentAmount,
                    penalty: 0,
                    remarks: ''
                });
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Payment failed');
        } finally {
            setLoading(false);
        }
    };

    // Helper to calculate due days
    const getDueDays = (emiDate: any) => {
        const date = parseFirestoreDate(emiDate);
        if (!date) return 0;
        return Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="max-w-6xl mx-auto mt-6 mb-10">
            {/* Search Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 relative">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-brand-red" /> Search Loan
                </h2>
                <div className="flex gap-4 relative">
                    <div className="flex-1 relative">
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => { if (searchTerm) setShowSuggestions(true); }}
                            placeholder="Enter LAN, Name, or Vehicle Number..."
                            className="w-full"
                        />
                        {showSuggestions && filteredLoans.length > 0 && (
                            <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredLoans.map((l) => (
                                    <div
                                        key={l.id}
                                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                        onClick={() => handleSelectLoan(l)}
                                    >
                                        <div className="font-bold text-gray-900">{l.applicantName} <span className="text-brand-red text-sm">({l.id})</span></div>
                                        <div className="text-xs text-gray-500">{l.vehicleProduct} - {l.vehicleNumber}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {showSuggestions && searchTerm && filteredLoans.length === 0 && (
                            <div className="absolute z-10 w-full bg-white mt-1 p-3 text-gray-500 text-sm border border-gray-200 rounded-md shadow-lg">
                                No matching active loans found.
                            </div>
                        )}
                    </div>
                </div>
                {error && <p className="text-red-600 mt-2">{error}</p>}
                {success && <p className="text-green-600 mt-2">{success}</p>}
            </div>

            {loan && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Col: Loan Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Basic Info Card */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Loan Details: {loan.id}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <label className="text-gray-500 block">Applicant Name</label>
                                    <div className="text-gray-900 font-medium">{loan.applicantName}</div>
                                </div>
                                <div>
                                    <label className="text-gray-500 block">Mobile</label>
                                    <div className="text-gray-900 font-medium">{loan.mobile}</div>
                                </div>
                                <div>
                                    <label className="text-gray-500 block">Vehicle</label>
                                    <div className="text-gray-900 font-medium">{loan.vehicleProduct} ({loan.vehicleNumber})</div>
                                </div>

                                <div className="col-span-3 border-t border-gray-100 my-2"></div>

                                <div>
                                    <label className="text-gray-500 block">Installments Pending</label>
                                    <div className="text-gray-900 font-bold text-lg">
                                        {Math.max(0, loan.noOfInstallments - repayments.length)} / {loan.noOfInstallments}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-gray-500 block">Due Amount (EMI)</label>
                                    <div className="text-gray-900 font-bold text-lg">
                                        {formatCurrency(loan.installmentAmount)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-gray-500 block">Total Due (Outstanding)</label>
                                    <div className="text-red-600 font-bold text-lg">
                                        {formatCurrency(parseFloat(loan.totalAmount) - repayments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0))}
                                    </div>
                                </div>

                                <div className="col-span-3 border-t border-gray-100 my-2"></div>

                                {loan.isActive && (
                                    <>
                                        <div className="bg-red-50 p-2 rounded border border-red-100">
                                            <label className="text-brand-red block text-xs uppercase font-bold">Next Due Date</label>
                                            <div className="text-gray-900 font-bold text-lg">{formatDate(loan.emiDate)}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                            <label className="text-gray-500 block text-xs uppercase font-bold">Due Days</label>
                                            <div className={`${getDueDays(loan.emiDate) < 0 ? 'text-red-600' : 'text-green-600'} font-bold text-lg`}>
                                                {getDueDays(loan.emiDate)} Days
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 2. Repayment History */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-yellow-500" /> Repayment History
                                </h3>
                                <Button
                                    variant="secondary"
                                    className="px-3 py-1 text-xs h-8"
                                    disabled={repayments.length === 0}
                                    onClick={() => {
                                        const data = repayments.map(pay => ({
                                            Date: formatDate(pay.paymentDate),
                                            Amount: parseFloat(pay.amount),
                                            Penalty: parseFloat(pay.penalty),
                                            'Book No': pay.bookNumber,
                                            'Voucher No': pay.voucherNumber,
                                            Remarks: pay.remarks
                                        }));
                                        exportToExcel(data, `Repayment_History_${loan.id}`);
                                    }}
                                >
                                    <Download className="w-4 h-4 mr-2" /> Export XLSX
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2">Amount</th>
                                            <th className="px-4 py-2">Penalty</th>
                                            <th className="px-4 py-2">Book/Voucher</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repayments.length > 0 ? (
                                            repayments.map((pay: any) => (
                                                <tr key={pay.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-gray-900">{formatDate(pay.paymentDate)}</td>
                                                    <td className="px-4 py-2 text-green-600 font-bold">{formatCurrency(pay.amount)}</td>
                                                    <td className="px-4 py-2 text-red-500">{formatCurrency(pay.penalty)}</td>
                                                    <td className="px-4 py-2">{pay.bookNumber} / {pay.voucherNumber}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-center">No repayments found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Payment Form */}
                    <div className="lg:col-span-1">
                        {!loan.isActive ? (
                            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center shadow-md sticky top-6">
                                <FileText className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-green-600 mb-2">LOAN CLOSED</h3>
                                <p className="text-gray-600">All installments have been paid.</p>
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md sticky top-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-green-600" /> Make Payment
                                </h3>
                                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                    <Input
                                        type="date"
                                        label="Payment Date"
                                        value={paymentForm.paymentDate}
                                        onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            label="Book No"
                                            value={paymentForm.bookNumber}
                                            onChange={e => setPaymentForm({ ...paymentForm, bookNumber: e.target.value })}
                                        />
                                        <Input
                                            label="Voucher No"
                                            value={paymentForm.voucherNumber}
                                            onChange={e => setPaymentForm({ ...paymentForm, voucherNumber: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        type="number"
                                        label="Amount"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        required
                                        className="font-bold text-green-600 border-green-200 focus:border-green-500 focus:ring-green-500"
                                    />

                                    <div className="p-3 bg-red-50 rounded border border-red-100">
                                        <Input
                                            type="number"
                                            label="Penalty (Auto-calc)"
                                            value={paymentForm.penalty}
                                            onChange={e => setPaymentForm({ ...paymentForm, penalty: parseFloat(e.target.value) })}
                                            className="text-red-600 border-red-200 focus:border-red-500 focus:ring-red-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Applied if &gt; 1 month overdue</p>
                                    </div>

                                    <Input
                                        label="Remarks"
                                        value={paymentForm.remarks}
                                        onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                    />

                                    <Button type="submit" className="w-full mt-4 shadow-sm" isLoading={loading}>
                                        Insert Payment
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
