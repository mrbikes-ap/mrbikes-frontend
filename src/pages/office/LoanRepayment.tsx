import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, FileText, Calendar, IndianRupee, AlertCircle, History, User, CreditCard } from 'lucide-react';
import { formatDate, parseFirestoreDate, formatCurrency } from '../../utils/dateUtils';

export default function LoanRepayment() {
    const [searchId, setSearchId] = useState('');
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

    const fetchLoanDetails = async () => {
        if (!searchId) return;
        setLoading(true);
        setError('');
        setLoan(null);
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans/${searchId}`, {
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
                        // Penalty = Principle / 100
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
                fetchLoanDetails();
                // Reset form fields (except date)
                setPaymentForm({
                    paymentDate: new Date().toISOString().split('T')[0],
                    bookNumber: '',
                    voucherNumber: '',
                    amount: loan.installmentAmount, // Reset to standard EMI
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
            <div className="bg-brand-gray p-6 rounded-lg border border-white/10 shadow-xl mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-brand-red" /> Search Loan
                </h2>
                <div className="flex gap-4">
                    <Input
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Enter LAN Number..."
                        className="flex-1"
                    />
                    <Button onClick={fetchLoanDetails} isLoading={loading}>Get Details</Button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {success && <p className="text-green-500 mt-2">{success}</p>}
            </div>

            {loan && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Col: Loan Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Basic Info Card */}
                        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" /> Loan Details: {loan.id}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <label className="text-gray-400 block">Applicant Name</label>
                                    <div className="text-white font-medium">{loan.applicantName}</div>
                                </div>
                                <div>
                                    <label className="text-gray-400 block">Mobile</label>
                                    <div className="text-white font-medium">{loan.mobile}</div>
                                </div>
                                <div>
                                    <label className="text-gray-400 block">Vehicle</label>
                                    <div className="text-white font-medium">{loan.vehicleProduct} ({loan.vehicleNumber})</div>
                                </div>

                                <div className="col-span-3 border-t border-white/10 my-2"></div>

                                <div>
                                    <label className="text-gray-400 block">Installments Pending</label>
                                    <div className="text-white font-bold text-lg">
                                        {Math.max(0, loan.noOfInstallments - repayments.length)} / {loan.noOfInstallments}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-gray-400 block">Due Amount (EMI)</label>
                                    <div className="text-white font-bold text-lg">
                                        {formatCurrency(loan.installmentAmount)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-gray-400 block">Total Due (Outstanding)</label>
                                    <div className="text-red-400 font-bold text-lg">
                                        {formatCurrency(parseFloat(loan.totalAmount) - repayments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0))}
                                    </div>
                                </div>

                                <div className="col-span-3 border-t border-white/10 my-2"></div>

                                {loan.isActive && (
                                    <>
                                        <div className="bg-brand-red/10 p-2 rounded border border-brand-red/20">
                                            <label className="text-brand-red block text-xs uppercase font-bold">Next Due Date</label>
                                            <div className="text-white font-bold text-lg">{formatDate(loan.emiDate)}</div>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded border border-white/10">
                                            <label className="text-gray-400 block text-xs uppercase font-bold">Due Days</label>
                                            <div className={`${getDueDays(loan.emiDate) < 0 ? 'text-red-500' : 'text-green-500'} font-bold text-lg`}>
                                                {getDueDays(loan.emiDate)} Days
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 2. Repayment History */}
                        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <History className="w-5 h-5 text-yellow-400" /> Repayment History
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-400">
                                    <thead className="text-xs text-gray-200 uppercase bg-white/10">
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
                                                <tr key={pay.id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="px-4 py-2 text-white">{formatDate(pay.paymentDate)}</td>
                                                    <td className="px-4 py-2 text-green-400 font-bold">{formatCurrency(pay.amount)}</td>
                                                    <td className="px-4 py-2 text-red-400">{formatCurrency(pay.penalty)}</td>
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
                            <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/20 text-center shadow-xl sticky top-6">
                                <FileText className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-green-500 mb-2">LOAN CLOSED</h3>
                                <p className="text-gray-400">All installments have been paid.</p>
                            </div>
                        ) : (
                            <div className="bg-brand-gray p-6 rounded-lg border border-white/10 shadow-xl sticky top-6">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-green-500" /> Make Payment
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
                                        className="font-bold text-green-400"
                                    />

                                    <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                                        <Input
                                            type="number"
                                            label="Penalty (Auto-calc)"
                                            value={paymentForm.penalty}
                                            onChange={e => setPaymentForm({ ...paymentForm, penalty: parseFloat(e.target.value) })}
                                            className="text-red-400"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Applied if &gt; 1 month overdue</p>
                                    </div>

                                    <Input
                                        label="Remarks"
                                        value={paymentForm.remarks}
                                        onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                    />

                                    <Button type="submit" className="w-full mt-4" isLoading={loading}>
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
