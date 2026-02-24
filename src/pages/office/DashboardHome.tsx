import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Users, TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import { formatCurrency } from '../../utils/dateUtils';

export default function DashboardHome() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return <div className="text-gray-800 p-8">Loading Dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto mt-6 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-8 h-8 text-brand-red" /> Financial Overview
            </h2>

            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Active Loans */}
                <div
                    onClick={() => navigate('/office/loan-status?filter=ACTIVE')}
                    className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:border-brand-red/50 transition-colors cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase font-bold">Active Loans</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats?.activeLoans || 0}</div>
                    <div className="text-sm text-gray-500 mt-1">Files Currently Open</div>
                </div>

                {/* Today's Collection */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:border-green-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase font-bold">Today's Collection</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(stats?.todaysCollection)}</div>
                    <div className="text-sm text-gray-500 mt-1">Received Today</div>
                </div>

                {/* Today's Disbursement */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:border-red-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase font-bold">Today's Disbursement</span>
                    </div>
                    <div className="text-3xl font-bold text-brand-red">{formatCurrency(stats?.todaysDisbursement)}</div>
                    <div className="text-sm text-gray-500 mt-1">New Loans Issued</div>
                </div>

                {/* Monthly Collection */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:border-purple-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase font-bold">Month's Collection</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">{formatCurrency(stats?.monthlyCollection)}</div>
                    <div className="text-sm text-gray-500 mt-1">Total for this Month</div>
                </div>
            </div>

            {/* Big Stat: Total Outstanding */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-xl border border-gray-200 shadow-lg relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <IndianRupee className="w-64 h-64 text-white" />
                </div>

                <h3 className="text-gray-300 text-sm uppercase font-bold tracking-wider mb-2">Total Market Outstanding</h3>
                <div className="text-5xl md:text-6xl font-extrabold text-white mb-4">
                    {formatCurrency(stats?.totalOutstanding)}
                </div>
                <p className="text-gray-300 max-w-xl">
                    This is the estimated total amount pending collection from the market (Total Loan Value - Total Repayments Received).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">

                    <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <a href="/office/create-loan" className="block p-4 bg-brand-red hover:bg-brand-red/90 rounded-lg text-white font-bold text-center transition-colors shadow-sm">
                            New Loan
                        </a>
                        <a href="/office/repayment" className="block p-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-700 font-bold text-center transition-colors shadow-sm">
                            Repayment
                        </a>
                        <a href="/office/loan-status" className="block p-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-700 font-bold text-center transition-colors shadow-sm">
                            Loan Status
                        </a>
                        <a href="/office/report" className="block p-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-700 font-bold text-center transition-colors shadow-sm">
                            Finance Report
                        </a>
                        <a href="/office/close-loan" className="block p-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-700 font-bold text-center transition-colors shadow-sm">
                            Close Loan
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
