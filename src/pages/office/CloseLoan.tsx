import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, FileText, CheckCircle, AlertOctagon, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../../utils/dateUtils';

export default function CloseLoan() {
    const [searchId, setSearchId] = useState('');
    const [loan, setLoan] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [repayments, setRepayments] = useState<any[]>([]);

    const [closeForm, setCloseForm] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        bookNumber: '',
        voucherNumber: '',
        amountPaid: '',
        discountAmount: '0',
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

                // Calculate Outstanding
                const totalPaid = (data.loan.Repayments || []).reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);
                const outstanding = parseFloat(data.loan.totalAmount) - totalPaid;

                setCloseForm(prev => ({
                    ...prev,
                    amountPaid: Math.ceil(outstanding).toString(), // Default to full amount
                    discountAmount: '0'
                }));

            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch loan details');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    loanId: loan.id,
                    ...closeForm,
                    amountPaid: parseFloat(closeForm.amountPaid),
                    discountAmount: parseFloat(closeForm.discountAmount)
                })
            });

            const data = await response.json();
            if (data.success) {
                setSuccess('Loan Closed Successfully!');
                fetchLoanDetails(); // Refresh to show closed status
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to close loan');
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals for display
    const totalPaidSoFar = repayments.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalOutstanding = loan ? (parseFloat(loan.totalAmount) - totalPaidSoFar) : 0;

    // Check if totals match for button enable/disable visual feedback
    const settlementTotal = parseFloat(closeForm.amountPaid || '0') + parseFloat(closeForm.discountAmount || '0');
    const isMatching = loan ? Math.abs(settlementTotal - totalOutstanding) < 1 : false;

    return (
        <div className="max-w-4xl mx-auto mt-6 mb-10">
            {/* Search Section */}
            <div className="bg-brand-gray p-6 rounded-lg border border-white/10 shadow-xl mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-brand-red" /> Search Loan to Close
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
                <div className="space-y-6">
                    {/* Loan Status Card */}
                    <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">{loan.applicantName}</h3>
                                <p className="text-gray-400 text-sm">LAN: {loan.id}</p>
                            </div>
                            <div className={`px-4 py-2 rounded font-bold ${loan.isActive ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                                {loan.isActive ? 'ACTIVE' : 'CLOSED'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                            <div>
                                <label className="text-gray-500 text-xs uppercase">Total Loan Amount</label>
                                <div className="text-white font-medium text-lg">{formatCurrency(loan.totalAmount)}</div>
                            </div>
                            <div>
                                <label className="text-gray-500 text-xs uppercase">Total Paid</label>
                                <div className="text-green-400 font-medium text-lg">{formatCurrency(totalPaidSoFar)}</div>
                            </div>
                            <div className="col-span-2 bg-brand-red/10 p-3 rounded border border-brand-red/20">
                                <label className="text-brand-red text-xs uppercase font-bold">Total Outstanding Due</label>
                                <div className="text-white font-bold text-2xl">{formatCurrency(totalOutstanding)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Closure Form */}
                    {loan.isActive ? (
                        <div className="bg-brand-gray p-8 rounded-lg border border-white/10 shadow-xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <AlertOctagon className="w-6 h-6 text-red-500" /> Close Loan Application
                            </h3>

                            <form onSubmit={handleCloseSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Input
                                        type="date"
                                        label="Closure Date"
                                        value={closeForm.paymentDate}
                                        onChange={e => setCloseForm({ ...closeForm, paymentDate: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Book No"
                                        value={closeForm.bookNumber}
                                        onChange={e => setCloseForm({ ...closeForm, bookNumber: e.target.value })}
                                    />
                                    <Input
                                        label="Voucher No"
                                        value={closeForm.voucherNumber}
                                        onChange={e => setCloseForm({ ...closeForm, voucherNumber: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded border border-white/10">
                                    <Input
                                        type="number"
                                        label="Amount Paid"
                                        value={closeForm.amountPaid}
                                        onChange={e => setCloseForm({ ...closeForm, amountPaid: e.target.value })}
                                        required
                                        className="font-bold text-green-400 text-lg"
                                    />
                                    <Input
                                        type="number"
                                        label="Discount / Waived Amount"
                                        value={closeForm.discountAmount}
                                        onChange={e => setCloseForm({ ...closeForm, discountAmount: e.target.value })}
                                        className="font-bold text-yellow-400 text-lg"
                                    />
                                </div>

                                {/* Validation Feedback */}
                                <div className={`p-4 rounded text-center border ${isMatching ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                    <div className="text-sm uppercase font-bold mb-1">Settlement Calculation</div>
                                    <div className="text-lg">
                                        (Paid: {formatCurrency(closeForm.amountPaid || 0)}) + (Discount: {formatCurrency(closeForm.discountAmount || 0)}) = <span className="font-bold">{formatCurrency(settlementTotal)}</span>
                                    </div>
                                    {!isMatching && (
                                        <div className="text-xs mt-2">Must equal Outstanding: {formatCurrency(totalOutstanding)}</div>
                                    )}
                                </div>

                                <Input
                                    label="Remarks"
                                    value={closeForm.remarks}
                                    onChange={e => setCloseForm({ ...closeForm, remarks: e.target.value })}
                                    placeholder="Reason for closure..."
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-bold bg-brand-red hover:bg-brand-red/90"
                                    isLoading={loading}
                                    disabled={!isMatching}
                                >
                                    Confirm & Close Loan
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-green-500/10 p-8 rounded-lg border border-green-500/20 text-center">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-green-500 mb-2">LOAN SUCCESSFULLY CLOSED</h3>
                            <p className="text-gray-400">This loan application has been settled and closed.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
