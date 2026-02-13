import React, { useState, useEffect } from 'react';
import { IndianRupee, Users, TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import { formatCurrency } from '../../utils/dateUtils';

export default function DashboardHome() {
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
        return <div className="text-white p-8">Loading Dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto mt-6 mb-10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-8 h-8 text-brand-red" /> Financial Overview
            </h2>

            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Active Loans */}
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-brand-red/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-xs text-gray-400 uppercase font-bold">Active Loans</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats?.activeLoans || 0}</div>
                    <div className="text-sm text-gray-400 mt-1">Files Currently Open</div>
                </div>

                {/* Today's Collection */}
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-green-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                        </div>
                        <span className="text-xs text-gray-400 uppercase font-bold">Today's Collection</span>
                    </div>
                    <div className="text-3xl font-bold text-green-400">{formatCurrency(stats?.todaysCollection)}</div>
                    <div className="text-sm text-gray-400 mt-1">Received Today</div>
                </div>

                {/* Today's Disbursement */}
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-red-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500/20 rounded-lg">
                            <TrendingDown className="w-6 h-6 text-red-500" />
                        </div>
                        <span className="text-xs text-gray-400 uppercase font-bold">Today's Disbursement</span>
                    </div>
                    <div className="text-3xl font-bold text-red-400">{formatCurrency(stats?.todaysDisbursement)}</div>
                    <div className="text-sm text-gray-400 mt-1">New Loans Issued</div>
                </div>

                {/* Monthly Collection */}
                <div className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-purple-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                            <Calendar className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="text-xs text-gray-400 uppercase font-bold">Month's Collection</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-400">{formatCurrency(stats?.monthlyCollection)}</div>
                    <div className="text-sm text-gray-400 mt-1">Total for this Month</div>
                </div>
            </div>

            {/* Big Stat: Total Outstanding */}
            <div className="bg-gradient-to-r from-brand-dark to-brand-gray p-8 rounded-xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <IndianRupee className="w-64 h-64 text-white" />
                </div>

                <h3 className="text-gray-400 text-sm uppercase font-bold tracking-wider mb-2">Total Market Outstanding</h3>
                <div className="text-5xl md:text-6xl font-extrabold text-white mb-4">
                    {formatCurrency(stats?.totalOutstanding)}
                </div>
                <p className="text-gray-400 max-w-xl">
                    This is the estimated total amount pending collection from the market (Total Loan Value - Total Repayments Received).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <a href="/office/create-loan" className="block p-4 bg-brand-red hover:bg-brand-red/80 rounded-lg text-white font-bold text-center transition-colors">
                            New Loan
                        </a>
                        <a href="/office/repayment" className="block p-4 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-center transition-colors">
                            Repayment
                        </a>
                        <a href="/office/report" className="block p-4 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-center transition-colors">
                            Reports
                        </a>
                        <a href="/office/close-loan" className="block p-4 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-center transition-colors">
                            Close Loan
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
