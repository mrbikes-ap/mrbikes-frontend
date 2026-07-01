import React, { useState, useEffect } from 'react';
import { Search, FileText, History, ArrowLeft, User } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatDate, formatCurrency, calculateNextDueDate } from '../../utils/dateUtils';
import { matchesLoanSearch } from '../../utils/loanSearchUtils';

type View = 'search' | 'results' | 'profile';

export default function ExecutiveDashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [allLoans, setAllLoans] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [view, setView] = useState<View>('search');

    useEffect(() => {
        fetchAllLoans();
    }, []);

    const fetchAllLoans = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans?includeRepayments=true`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setAllLoans(data.loans);
            }
        } catch (err) {
            console.error('Failed to fetch loans', err);
        }
    };

    const resetToSearch = () => {
        setView('search');
        setSelectedLoan(null);
        setSearchResults([]);
        setError('');
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError('');
        setSelectedLoan(null);

        let loans = allLoans;
        if (loans.length === 0) {
            try {
                const token = localStorage.getItem('token');
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const response = await fetch(`${API_URL}/loans?includeRepayments=true`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                if (data.success) {
                    loans = data.loans;
                    setAllLoans(data.loans);
                }
            } catch {
                setError('Connection error. Please try again.');
                setLoading(false);
                return;
            }
        }

        const results = loans.filter((loan) => matchesLoanSearch(loan, searchTerm));
        setLoading(false);

        if (results.length === 0) {
            setSearchResults([]);
            setView('search');
            setError('No loans found matching your search.');
            return;
        }

        setSearchResults(results);

        if (results.length === 1) {
            setSelectedLoan(results[0]);
            setView('profile');
        } else {
            setView('results');
        }
    };

    const handleSelectLoan = (loan: any) => {
        setSelectedLoan(loan);
        setView('profile');
    };

    const handleBack = () => {
        if (view === 'profile' && searchResults.length > 1) {
            setSelectedLoan(null);
            setView('results');
            return;
        }
        resetToSearch();
    };

    const backLabel =
        view === 'profile' && searchResults.length > 1
            ? `Back to Results (${searchResults.length})`
            : 'Back to Search';

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-lg mb-6 sticky top-[72px] z-40">
                <h2 className="text-sm uppercase font-bold text-brand-red mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4" /> Search Loan
                </h2>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Name, phone, LAN, vehicle, Aadhar..."
                        className="flex-1"
                    />
                    <Button type="submit" isLoading={loading} className="bg-brand-red shadow-sm">
                        Get
                    </Button>
                </form>
                {error && view === 'search' && (
                    <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
                )}
            </div>

            {view === 'search' && !loading && (
                <div className="text-center py-16 px-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Search for a customer</p>
                    <p className="text-gray-400 text-xs mt-1">
                        Enter name, phone number, LAN, vehicle no, or any customer detail
                    </p>
                </div>
            )}

            {view === 'results' && (
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={resetToSearch}
                        className="flex items-center gap-2 text-gray-600 hover:text-brand-red mb-2 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Search
                    </button>

                    <p className="text-gray-500 text-xs uppercase font-bold text-center">
                        Found {searchResults.length} matching customers
                    </p>

                    {searchResults.map((loan) => (
                        <div
                            key={loan.id}
                            onClick={() => handleSelectLoan(loan)}
                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm active:bg-gray-50 cursor-pointer hover:border-brand-red/50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-gray-900">{loan.applicantName}</div>
                                    <div className="text-xs text-gray-500">{loan.id}</div>
                                    {loan.mobile && (
                                        <div className="text-xs text-gray-400 mt-0.5">{loan.mobile}</div>
                                    )}
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

            {view === 'profile' && selectedLoan && (
                <div className="space-y-4 fade-in">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-brand-red transition-colors text-sm font-medium py-1"
                    >
                        <ArrowLeft className="w-4 h-4" /> {backLabel}
                    </button>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900">{selectedLoan.applicantName}</h2>
                        <p className="text-xs text-gray-500 font-mono">{selectedLoan.id}</p>
                        {selectedLoan.mobile && (
                            <p className="text-sm text-gray-600 mt-1">{selectedLoan.mobile}</p>
                        )}
                    </div>

                    {!selectedLoan.isActive ? (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center shadow-sm">
                            <FileText className="w-12 h-12 text-green-600 mx-auto mb-2" />
                            <h3 className="text-xl font-bold text-green-700">LOAN CLOSED</h3>
                            <p className="text-xs text-green-600 uppercase tracking-widest">No Dues Pending</p>
                        </div>
                    ) : (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" /> Loan Details
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
                                    <div className="text-gray-900 font-medium">
                                        {selectedLoan.vehicleProduct}{' '}
                                        <span className="text-gray-500">({selectedLoan.vehicleNumber})</span>
                                    </div>
                                </div>

                                <div className="col-span-2 border-t border-gray-100 my-1"></div>

                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase block">Pending Inst.</label>
                                    <div className="text-gray-900 font-bold text-lg">
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
                                            {formatCurrency(
                                                parseFloat(selectedLoan.totalAmount) -
                                                    (selectedLoan.Repayments?.reduce(
                                                        (sum: number, r: any) => sum + parseFloat(r.amount),
                                                        0
                                                    ) || 0)
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                                <td className="px-4 py-3 text-right font-mono">
                                                    {pay.bookNumber}/{pay.voucherNumber}
                                                </td>
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
