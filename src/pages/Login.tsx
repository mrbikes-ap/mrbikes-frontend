import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, Key, User } from 'lucide-react';

export default function Login() {
    const [role, setRole] = useState<'office' | 'executive'>('office');
    const [formData, setFormData] = useState({ id: '', code: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, role }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store JWT
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', role);

                if (role === 'office') {
                    navigate('/office');
                } else {
                    navigate('/executive');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Failed to connect to server. Ensure backend is running.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-gray flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex flex-col items-center mb-8">
                        <img src="/logo.png" alt="MR Bikes Logo" className="w-32 h-32 object-contain mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">MR Bikes</h1>
                        <p className="text-gray-500 text-sm">Finance & Consultancy Platform</p>
                    </div>

                    <div className="bg-gray-100 p-1 rounded-lg flex mb-8 w-full">
                        <button
                            onClick={() => setRole('office')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'office'
                                ? 'bg-white text-brand-red shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Office Login
                        </button>
                        <button
                            onClick={() => setRole('executive')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'executive'
                                ? 'bg-white text-brand-red shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Executive Login
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 w-full">
                        <Input
                            name="id"
                            label="Login ID"
                            placeholder="Enter your ID"
                            value={formData.id}
                            onChange={handleChange}
                            icon={<User className="w-5 h-5" />}
                        />
                        <Input
                            name="code"
                            label="Security Code"
                            type="password"
                            placeholder="••••••••"
                            value={formData.code}
                            onChange={handleChange}
                            icon={<Key className="w-5 h-5" />}
                        />

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-200">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Login
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400">
                            Secure Access • v1.0.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
