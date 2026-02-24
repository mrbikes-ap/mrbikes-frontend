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
        <div className="min-h-screen bg-brand-gray text-gray-900 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-brand-red">MR Bikes</span>
                </div>
                <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
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
                fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-white border-r border-gray-200 p-4 flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-sm
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex items-center gap-3 mb-8 px-2">
                    <img src="/logo.png" alt="MR Bikes" className="w-12 h-12 object-contain" />
                    <div>
                        <h2 className="text-2xl font-bold text-brand-red leading-none">MR Bikes</h2>
                    </div>
                </div>

                <nav className="space-y-1 flex-1 overflow-y-auto">
                    <NavLink
                        to="/office"
                        end
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:text-brand-red hover:bg-red-50'
                            }`
                        }
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/office/create-agent"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:text-brand-red hover:bg-red-50'
                            }`
                        }
                    >
                        Create Executive
                    </NavLink>
                    <NavLink
                        to="/office/create-loan"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:text-brand-red hover:bg-red-50'
                            }`
                        }
                    >
                        Create Loan
                    </NavLink>
                    <NavLink
                        to="/office/repayment"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:text-brand-red hover:bg-red-50'
                            }`
                        }
                    >
                        Loan Repayment
                    </NavLink>
                    <NavLink
                        to="/office/close-loan"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:text-brand-red hover:bg-red-50'
                            }`
                        }
                    >
                        Close Loan
                    </NavLink>
                    <NavLink
                        to="/office/report"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:text-brand-red hover:bg-red-50'
                            }`
                        }
                    >
                        Payment Report
                    </NavLink>
                    <NavLink
                        to="/office/loan-status"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                ? 'bg-brand-red text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:text-brand-red hover:bg-red-50'
                            }`
                        }
                    >
                        Loan Status Report
                    </NavLink>
                </nav>

                <div className="pt-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full bg-brand-gray">
                <Outlet />
            </main>
        </div>
    );
}
