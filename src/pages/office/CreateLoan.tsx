import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/dateUtils';
import { FileText, CheckCircle, AlertCircle, IndianRupee, Calendar, Truck, Phone, User, Users, MapPin, Hash, Activity } from 'lucide-react';

export default function CreateLoan() {
    const [formData, setFormData] = useState({
        id: '', // LAN Number
        // Borrower
        applicantName: '', address: '', city: '', townVillage: '', mobile: '', aadhar: '',
        // Guarantor
        guarantorName: '', guarantorAddress: '', guarantorCity: '', guarantorTownVillage: '', guarantorMobile: '', guarantorAadhar: '',
        // Vehicle
        vehicleProduct: '', model: '', makerCompany: '', engineSerialNumber: '', vehicleNumber: '', vehiclePurchaseDate: '',
        // Loan Terms
        frequency: 'Monthly', fileDate: '', emiDate: '',
        loanAmount: 0, noOfInstallments: 0, interestRate: 0,
        // Calculated
        interestAmount: 0, totalAmount: 0, installmentAmount: 0
    });

    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Auto Calculate
    useEffect(() => {
        const P = parseFloat(formData.loanAmount.toString()) || 0;
        const T = parseFloat(formData.noOfInstallments.toString()) || 0;
        const R = parseFloat(formData.interestRate.toString()) || 0;

        // Formula: P * T * R / 100
        // Convert T (months) to years for calculation
        const timeInYears = T / 12;
        const calculatedInterest = (P * timeInYears * R) / 100;
        const calculatedTotal = P + calculatedInterest;
        const calculatedInstallment = T > 0 ? calculatedTotal / T : 0;

        setFormData(prev => ({
            ...prev,
            interestAmount: Math.ceil(calculatedInterest),
            totalAmount: Math.ceil(calculatedTotal),
            installmentAmount: Math.ceil(calculatedInstallment)
        }));
    }, [formData.loanAmount, formData.noOfInstallments, formData.interestRate]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Validation: Mobile (Max 10 digits, only numbers)
        if (name === 'mobile' || name === 'guarantorMobile') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, [name]: numericValue });
            return;
        }

        // Validation: Aadhar (Max 12 digits, only numbers)
        if (name === 'aadhar' || name === 'guarantorAadhar') {
            const numericValue = value.replace(/\D/g, '').slice(0, 12);
            setFormData({ ...formData, [name]: numericValue });
            return;
        }

        setFormData({ ...formData, [name]: value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Strict Validation Check
        if (formData.mobile.length !== 10) {
            setError('Borrower Mobile Number must be exactly 10 digits.');
            setIsLoading(false);
            return;
        }
        if (formData.aadhar.length !== 12) {
            setError('Borrower Aadhar Number must be exactly 12 digits.');
            setIsLoading(false);
            return;
        }
        if (formData.guarantorMobile.length !== 10) {
            setError('Guarantor Mobile Number must be exactly 10 digits.');
            setIsLoading(false);
            return;
        }
        if (formData.guarantorAadhar.length !== 12) {
            setError('Guarantor Aadhar Number must be exactly 12 digits.');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setSuccess('Loan Created Successfully!');
                setFormData({
                    id: '',
                    applicantName: '', address: '', city: '', townVillage: '', mobile: '', aadhar: '',
                    guarantorName: '', guarantorAddress: '', guarantorCity: '', guarantorTownVillage: '', guarantorMobile: '', guarantorAadhar: '',
                    vehicleProduct: '', model: '', makerCompany: '', engineSerialNumber: '', vehicleNumber: '', vehiclePurchaseDate: '',
                    frequency: 'Monthly', fileDate: '', emiDate: '',
                    loanAmount: 0, noOfInstallments: 0, interestRate: 0,
                    interestAmount: 0, totalAmount: 0, installmentAmount: 0
                });
                window.scrollTo(0, 0);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Create failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-6 mb-10">
            <div className="bg-brand-gray p-8 rounded-lg border border-white/10 shadow-xl">
                <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                    <FileText className="w-8 h-8 text-brand-red" />
                    <h2 className="text-2xl font-bold text-white">New Loan Application</h2>
                </div>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-500/10 text-green-500 p-3 rounded mb-4">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* LAN Section */}
                    <div className="bg-white/5 p-4 rounded-lg">
                        <label className="block text-sm text-brand-red font-bold mb-1 uppercase">LAN Number</label>
                        <Input name="id" value={formData.id} onChange={handleChange} placeholder="LAN..." required />
                    </div>

                    {/* 1. Borrower Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Borrower Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input name="applicantName" label="Name" value={formData.applicantName} onChange={handleChange} required />
                            <Input name="mobile" label="Mobile" value={formData.mobile} onChange={handleChange} required />
                            <Input name="aadhar" label="Aadhar" value={formData.aadhar} onChange={handleChange} required />
                            <Input name="address" label="Address" value={formData.address} onChange={handleChange} required className="md:col-span-3" />
                            <Input name="city" label="City" value={formData.city} onChange={handleChange} required />
                            <Input name="townVillage" label="Town/Village" value={formData.townVillage} onChange={handleChange} required />
                        </div>
                    </div>

                    {/* 2. Guarantor Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Guarantor Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input name="guarantorName" label="Name" value={formData.guarantorName} onChange={handleChange} required />
                            <Input name="guarantorMobile" label="Mobile" value={formData.guarantorMobile} onChange={handleChange} required />
                            <Input name="guarantorAadhar" label="Aadhar" value={formData.guarantorAadhar} onChange={handleChange} required />
                            <Input name="guarantorAddress" label="Address" value={formData.guarantorAddress} onChange={handleChange} required className="md:col-span-3" />
                            <Input name="guarantorCity" label="City" value={formData.guarantorCity} onChange={handleChange} required />
                            <Input name="guarantorTownVillage" label="Town/Village" value={formData.guarantorTownVillage} onChange={handleChange} required />
                        </div>
                    </div>

                    {/* 3. Vehicle Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Truck className="w-5 h-5" /> Vehicle/Product Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input name="vehicleProduct" label="Vehicle/Product" value={formData.vehicleProduct} onChange={handleChange} required />
                            <Input name="makerCompany" label="Maker/Company" value={formData.makerCompany} onChange={handleChange} required />
                            <Input name="model" label="Model" value={formData.model} onChange={handleChange} required />
                            <Input name="vehicleNumber" label="Vehicle Number" value={formData.vehicleNumber} onChange={handleChange} required />
                            <Input name="vehiclePurchaseDate" type="date" label="Purchase Date" value={formData.vehiclePurchaseDate} onChange={handleChange} required />
                            <Input name="engineSerialNumber" label="Engine/Serial No" value={formData.engineSerialNumber} onChange={handleChange} required className="md:col-span-2" />
                        </div>
                    </div>

                    {/* 4. Loan Terms & Calculations */}
                    <div className="bg-brand-dark/50 p-6 rounded-lg border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-green-400" /> Loan Calculations</h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Inputs */}
                            <div className="md:col-span-1">
                                <label className="block text-sm text-gray-400 mb-1">Frequency</label>
                                <select
                                    name="frequency"
                                    value={formData.frequency}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-brand-red focus:outline-none"
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Half-yearly">Half-yearly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>
                            <Input type="date" name="fileDate" label="File Date" value={formData.fileDate} onChange={handleChange} required />
                            <Input type="date" name="emiDate" label="EMI Date" value={formData.emiDate} onChange={handleChange} required />
                            <div className="hidden md:block"></div>

                            <Input type="number" name="loanAmount" label="Loan Amount (P)" value={formData.loanAmount} onChange={handleChange} required className="text-yellow-400 font-bold" />
                            <Input type="number" name="noOfInstallments" label="No. of Installments (T)" value={formData.noOfInstallments} onChange={handleChange} required />
                            <Input type="number" name="interestRate" label="Interest % (R)" value={formData.interestRate} onChange={handleChange} required />

                            {/* Calculated Read-Only */}
                            <div className="md:col-start-1 md:col-span-1">
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Interest (Rs)</label>
                                <div className="text-xl font-bold text-green-400">{formatCurrency(formData.interestAmount)}</div>
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Total Amount</label>
                                <div className="text-xl font-bold text-green-400">{formatCurrency(formData.totalAmount)}</div>
                            </div>

                            <div className="md:col-span-2 bg-white/10 p-3 rounded text-center border border-white/10">
                                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Installment Amount (EMI)</label>
                                <div className="text-3xl font-bold text-brand-red">{formatCurrency(formData.installmentAmount)}</div>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg" isLoading={isLoading}>
                        Create Loan Application
                    </Button>
                </form>
            </div>
        </div>
    );
}
