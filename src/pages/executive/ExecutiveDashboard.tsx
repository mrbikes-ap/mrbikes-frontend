import React, { useState } from 'react';
import { Search, FileText, History, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatDate, formatCurrency, calculateNextDueDate } from '../../utils/dateUtils';

export default function ExecutiveDashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loans, setLoans] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [selectedLoan, setSelectedLoan] = useState<any>(null);

    // Fetch recent loans on mount
    React.useEffect(() => {
        fetchRecentLoans();
    }, []);

    const fetchRecentLoans = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans/recent`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success && data.loans.length > 0) {
                setLoans(data.loans);
            }
        } catch (err) {
            console.error('Failed to fetch recent loans', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError('');
        setLoans([]);
        setSelectedLoan(null);

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            // New endpoint for multi-criteria search
            const response = await fetch(`${API_URL}/loans/search?q=${searchTerm}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                if (data.loans.length === 0) {
                    setError('No loans found matching your criteria.');
                } else if (data.loans.length === 1) {
                    // If exactly one result, show details directly
                    setSelectedLoan(data.loans[0]);
                } else {
                    // Show list to select
                    setLoans(data.loans);
                }
            } else {
                setError(data.message || 'Search failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            {/* Search Box */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-lg mb-6 sticky top-[72px] z-40">
                <h2 className="text-sm uppercase font-bold text-brand-red mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4" /> Search Loan
                </h2>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="LAN, Name, or Vehicle No..."
                        className="flex-1"
                    />
                    <Button type="submit" isLoading={loading} className="bg-brand-red shadow-sm">
                        Get
                    </Button>
                </form>
                {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
            </div>

            {/* Multiple Results List */}
            {loans.length > 0 && !selectedLoan && (
                <div className="space-y-3">
                    <p className="text-gray-500 text-xs uppercase font-bold text-center">
                        {searchTerm ? `Found ${loans.length} results` : 'Recent Active Loans'}
                    </p>
                    {loans.map(loan => (
                        <div
                            key={loan.id}
                            onClick={() => setSelectedLoan(loan)}
                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm active:bg-gray-50 cursor-pointer hover:border-brand-red/50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-gray-900">{loan.applicantName}</div>
                                    <div className="text-xs text-gray-500">{loan.id}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500">{loan.vehicleNumber}</div>
                                    <div className="font-mono text-brand-red text-sm">{loan.vehicleProduct}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Loan Details */}
            {selectedLoan && (
                <div className="space-y-6 fade-in">
                    {/* Status Card */}
                    {!selectedLoan.isActive ? (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center shadow-sm">
                            <FileText className="w-12 h-12 text-green-600 mx-auto mb-2" />
                            <h3 className="text-xl font-bold text-green-700">LOAN CLOSED</h3>
                            <p className="text-xs text-green-600 uppercase tracking-widest">No Dues Pending</p>
                        </div>
                    ) : (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" /> Loan Details: {selectedLoan.id}
                            </h3>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase block">Applicant Name</label>
                                    <div className="text-gray-900 font-medium truncate">{selectedLoan.applicantName}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase block">Mobile</label>
                                    <div className="text-gray-900 font-medium">{selectedLoan.mobile}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] text-gray-500 uppercase block">Vehicle</label>
                                    <div className="text-gray-900 font-medium">{selectedLoan.vehicleProduct} <span className="text-gray-500">({selectedLoan.vehicleNumber})</span></div>
                                </div>

                                <div className="col-span-2 border-t border-gray-100 my-1"></div>

                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase block">Pending Inst.</label>
                                    <div className="text-gray-900 font-bold text-lg">
                                        {/* Pending calc would need repayments list length, assuming backend sends count or we calc */}
                                        {Math.max(0, selectedLoan.noOfInstallments - (selectedLoan.Repayments?.length || 0))} / {selectedLoan.noOfInstallments}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase block">Next Due Date</label>
                                    <div className="text-brand-red font-bold text-lg">
                                        {calculateNextDueDate(selectedLoan)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase block">EMI Amount</label>
                                    <div className="text-gray-900 font-bold text-lg">{formatCurrency(selectedLoan.installmentAmount)}</div>
                                </div>

                                <div className="col-span-2 bg-red-50 p-3 rounded-lg border border-red-100 mt-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] text-red-700 uppercase font-bold">Total Outstanding</label>
                                        <div className="text-red-600 font-bold text-xl">
                                            {formatCurrency(parseFloat(selectedLoan.totalAmount) - (selectedLoan.Repayments?.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0) || 0))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Repayment History Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <History className="w-4 h-4 text-orange-500" /> Repayment History
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-600">
                                <thead className="bg-gray-100 text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Amount</th>
                                        <th className="px-4 py-3 font-medium">Penalty</th>
                                        <th className="px-4 py-3 font-medium text-right">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedLoan.Repayments && selectedLoan.Repayments.length > 0 ? (
                                        selectedLoan.Repayments.map((pay: any) => (
                                            <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-900">{formatDate(pay.paymentDate)}</td>
                                                <td className="px-4 py-3 text-green-600 font-bold">{formatCurrency(pay.amount)}</td>
                                                <td className="px-4 py-3 text-red-500">{formatCurrency(pay.penalty)}</td>
                                                <td className="px-4 py-3 text-right font-mono">{pay.bookNumber}/{pay.voucherNumber}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                                No repayments recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="h-10"></div>
                </div>
            )}
        </div>
    );
}
