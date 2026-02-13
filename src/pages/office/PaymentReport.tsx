import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Calendar, FileText, Download } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/dateUtils';

export default function PaymentReport() {
    const [dates, setDates] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState<{ repayments: any[], newLoans: any[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        setReportData(null);

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // Fallback for dev
            const { startDate, endDate } = dates; // Destructure startDate and endDate from dates state
            const response = await fetch(`${API_URL}/repayments/report?startDate=${startDate}&endDate=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setReportData({
                    repayments: data.repayments || [],
                    newLoans: data.newLoans || []
                });
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    // Calculate Totals
    const totalCollection = reportData ? reportData.repayments.reduce((sum, item) => sum + parseFloat(item.amount), 0) : 0;
    const totalDisbursed = reportData ? reportData.newLoans.reduce((sum, item) => sum + parseFloat(item.loanAmount), 0) : 0;

    // Net Calculation
    const netCashFlow = totalCollection - totalDisbursed;

    return (
        <div className="max-w-7xl mx-auto mt-6 mb-10">
            <div className="bg-brand-gray p-6 rounded-lg border border-white/10 shadow-xl mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-red" /> Financial Report (Tally)
                </h2>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <Input
                        type="date"
                        label="From Date"
                        value={dates.startDate}
                        onChange={(e) => setDates({ ...dates, startDate: e.target.value })}
                    />
                    <Input
                        type="date"
                        label="To Date"
                        value={dates.endDate}
                        onChange={(e) => setDates({ ...dates, endDate: e.target.value })}
                    />
                    <Button onClick={fetchReport} isLoading={loading} className="mb-[2px]">
                        Generate Tally
                    </Button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            {reportData && (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/20">
                            <h4 className="text-green-500 text-sm uppercase font-bold mb-1">Total Collection (Income)</h4>
                            <div className="text-3xl font-bold text-white">{formatCurrency(totalCollection)}</div>
                            <div className="text-gray-400 text-xs mt-2">{reportData.repayments.length} Transactions</div>
                        </div>
                        <div className="bg-red-500/10 p-6 rounded-lg border border-red-500/20">
                            <h4 className="text-red-500 text-sm uppercase font-bold mb-1">Total Disbursed (Expense)</h4>
                            <div className="text-3xl font-bold text-white">{formatCurrency(totalDisbursed)}</div>
                            <div className="text-gray-400 text-xs mt-2">{reportData.newLoans.length} New Loans</div>
                        </div>
                        <div className={`p-6 rounded-lg border ${netCashFlow >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                            <h4 className={`${netCashFlow >= 0 ? 'text-blue-500' : 'text-orange-500'} text-sm uppercase font-bold mb-1`}>Net Cash Flow</h4>
                            <div className="text-3xl font-bold text-white">
                                {netCashFlow >= 0 ? '+' : ''} {formatCurrency(netCashFlow)}
                            </div>
                            <div className="text-gray-400 text-xs mt-2">Income - Expense</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Income Table */}
                        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                            <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                                <Download className="w-5 h-5 rotate-180" /> Incoming Payments (Credits)
                            </h3>
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full text-sm text-left text-gray-400">
                                    <thead className="text-xs text-gray-200 uppercase bg-white/10 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2">LAN</th>
                                            <th className="px-4 py-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.repayments.map((item) => (
                                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="px-4 py-2">{formatDate(item.paymentDate)}</td>
                                                <td className="px-4 py-2">
                                                    <div className="text-white">{item.Loan?.id}</div>
                                                    <div className="text-xs">{item.Loan?.applicantName}</div>
                                                </td>
                                                <td className="px-4 py-2 text-right text-green-400 font-bold">{formatCurrency(item.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Expense Table */}
                        <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                                <Download className="w-5 h-5" /> Outgoing Loans (Debits)
                            </h3>
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full text-sm text-left text-gray-400">
                                    <thead className="text-xs text-gray-200 uppercase bg-white/10 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2">LAN</th>
                                            <th className="px-4 py-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.newLoans.map((loan) => (
                                            <tr key={loan.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="px-4 py-2">{formatDate(loan.fileDate)}</td>
                                                <td className="px-4 py-2">
                                                    <div className="text-white">{loan.id}</div>
                                                    <div className="text-xs">{loan.applicantName}</div>
                                                </td>
                                                <td className="px-4 py-2 text-right text-red-400 font-bold">{formatCurrency(loan.loanAmount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
