import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, FileText, CheckCircle, AlertOctagon, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../../utils/dateUtils';

export default function CloseLoan() {
    const [searchTerm, setSearchTerm] = useState('');
    const [allLoans, setAllLoans] = useState<any[]>([]);
    const [filteredLoans, setFilteredLoans] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const justSelected = useRef(false); // flag to suppress dropdown after selection

    // Remove searchId as it is replaced by searchTerm logic
    // const [searchId, setSearchId] = useState(''); 

    const [loan, setLoan] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [repayments, setRepayments] = useState<any[]>([]);

    useEffect(() => {
        fetchAllActiveLoans();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredLoans([]);
            setShowSuggestions(false);
            return;
        }
        // Skip showing suggestions right after a loan is selected
        if (justSelected.current) {
            justSelected.current = false;
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
                setAllLoans(data.loans.filter((l: any) => l.isActive));
            }
        } catch (error) {
            console.error("Failed to fetch loans", error);
        }
    };

    const handleSelectLoan = (selectedLoan: any) => {
        justSelected.current = true; // prevent useEffect from re-opening suggestions
        setSearchTerm(`${selectedLoan.id} - ${selectedLoan.applicantName}`);
        setShowSuggestions(false);
        fetchLoanDetails(selectedLoan.id);
    };

    const [closeForm, setCloseForm] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        bookNumber: '',
        voucherNumber: '',
        amountPaid: '',
        discountAmount: '0',
        remarks: ''
    });

    const fetchLoanDetails = async (id: string) => {
        if (!id) return;
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
                fetchLoanDetails(loan.id); // Refresh to show closed status
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
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 relative">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-brand-red" /> Search Loan to Close
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
                <div className="space-y-6">
                    {/* Loan Status Card */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{loan.applicantName}</h3>
                                <p className="text-gray-500 text-sm">LAN: {loan.id}</p>
                            </div>
                            <div className={`px-4 py-2 rounded font-bold ${loan.isActive ? 'bg-yellow-50 text-yellow-500 border border-yellow-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                                {loan.isActive ? 'ACTIVE' : 'CLOSED'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                            <div>
                                <label className="text-gray-500 text-xs uppercase">Total Loan Amount</label>
                                <div className="text-gray-900 font-medium text-lg">{formatCurrency(loan.totalAmount)}</div>
                            </div>
                            <div>
                                <label className="text-gray-500 text-xs uppercase">Total Paid</label>
                                <div className="text-green-600 font-medium text-lg">{formatCurrency(totalPaidSoFar)}</div>
                            </div>
                            <div className="col-span-2 bg-red-50 p-3 rounded border border-red-100">
                                <label className="text-brand-red text-xs uppercase font-bold">Total Outstanding Due</label>
                                <div className="text-gray-900 font-bold text-2xl">{formatCurrency(totalOutstanding)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Closure Form */}
                    {loan.isActive ? (
                        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded border border-gray-200">
                                    <Input
                                        type="number"
                                        label="Amount Paid"
                                        value={closeForm.amountPaid}
                                        onChange={e => setCloseForm({ ...closeForm, amountPaid: e.target.value })}
                                        required
                                        className="font-bold text-green-600 text-lg border-green-200 focus:border-green-500 focus:ring-green-500"
                                    />
                                    <Input
                                        type="number"
                                        label="Discount / Waived Amount"
                                        value={closeForm.discountAmount}
                                        onChange={e => setCloseForm({ ...closeForm, discountAmount: e.target.value })}
                                        className="font-bold text-yellow-600 text-lg border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500"
                                    />
                                </div>

                                {/* Validation Feedback */}
                                <div className={`p-4 rounded text-center border ${isMatching ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
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
                                    className="w-full h-12 text-lg font-bold bg-brand-red hover:bg-brand-red/90 shadow-md"
                                    isLoading={loading}
                                    disabled={!isMatching}
                                >
                                    Confirm & Close Loan
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-green-50 p-8 rounded-lg border border-green-200 text-center shadow-sm">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-green-600 mb-2">LOAN SUCCESSFULLY CLOSED</h3>
                            <p className="text-gray-500">This loan application has been settled and closed.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
