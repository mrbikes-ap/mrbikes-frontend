import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';

export default function ExecutiveLayout() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'executive') {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-brand-dark text-white flex flex-col">
            {/* Mobile Header */}
            <header className="bg-black/40 backdrop-blur-md border-b border-white/10 p-4 sticky top-0 z-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm leading-tight">MR Bikes</h1>
                        <p className="text-[10px] text-gray-400">Executive Panel</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                >
                    <LogOut className="w-4 h-4 text-gray-400" />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
