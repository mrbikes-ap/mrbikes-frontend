import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';

export default function OfficeLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'office') {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login', { replace: true });
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-brand-dark text-white flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-brand-dark/95 backdrop-blur border-b border-white/10 p-4 sticky top-0 z-50 flex justify-between items-center">
                <span className="font-bold text-brand-red">Office Panel</span>
                <button onClick={toggleSidebar} className="p-2 text-white">
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
            </header>

            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-brand-dark border-r border-white/10 p-4 flex flex-col z-50 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <h2 className="text-xl font-bold text-brand-red mb-6 hidden md:block">Office Panel</h2>

                <nav className="space-y-2 flex-1 overflow-y-auto">
                    <NavLink
                        to="/office"
                        end
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block p-2 rounded text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/office/create-agent"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block p-2 rounded text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        Create Executive
                    </NavLink>
                    <NavLink
                        to="/office/create-loan"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block p-2 rounded text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        Create Loan
                    </NavLink>
                    <NavLink
                        to="/office/repayment"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block p-2 rounded text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        Loan Repayment
                    </NavLink>
                    <NavLink
                        to="/office/close-loan"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block p-2 rounded text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        Close Loan
                    </NavLink>
                    <NavLink
                        to="/office/report"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block p-2 rounded text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        Payment Report
                    </NavLink>
                </nav>

                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-2 text-sm text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
