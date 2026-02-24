import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export default function CreateAgent() {
    const [formData, setFormData] = useState({
        name: '',
        id: '',
        code: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/agents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Agent created successfully!');
                setFormData({ name: '', id: '', code: '' });
            } else {
                setError(data.message || 'Failed to create agent');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-brand-red" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Create Executive</h2>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4 flex items-center text-sm">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded mb-4 flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Login ID</label>
                        <Input
                            name="id"
                            value={formData.id}
                            onChange={handleChange}
                            placeholder="e.g. agent001"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Security Code</label>
                        <Input
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            type="password"
                            placeholder="e.g. 1234"
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Create Agent
                    </Button>
                </form>
            </div>
        </div>
    );
}
