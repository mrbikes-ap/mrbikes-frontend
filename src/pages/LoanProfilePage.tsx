import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Users, Truck, Activity, Pencil, X, Check, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatDate, formatCurrency, parseFirestoreDate } from '../utils/dateUtils';
import type { LoanEditForm, LoanProfile } from '../types/loan';

function Field({ label, value }: { label: string; value?: string | number | null }) {
    const display = value !== undefined && value !== null && value !== '' ? String(value) : 'N/A';
    return (
        <div>
            <label className="text-gray-500 block text-xs uppercase tracking-wide">{label}</label>
            <div className="text-gray-900 font-medium mt-0.5">{display}</div>
        </div>
    );
}

function Section({
    title,
    icon,
    iconBg,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    iconBg: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className={`p-1 rounded ${iconBg}`}>{icon}</div>
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {children}
            </div>
        </div>
    );
}

const emptyForm = (): LoanEditForm => ({
    applicantName: '',
    mobile: '',
    aadhar: '',
    address: '',
    city: '',
    townVillage: '',
    guarantorName: '',
    guarantorMobile: '',
    guarantorAadhar: '',
    guarantorAddress: '',
    guarantorCity: '',
    guarantorTownVillage: '',
    vehicleProduct: '',
    makerCompany: '',
    model: '',
    vehicleNumber: '',
    vehiclePurchaseDate: '',
    engineSerialNumber: '',
    frequency: 'Monthly',
    fileDate: '',
    emiDate: '',
    loanAmount: 0,
    noOfInstallments: 0,
    interestRate: 0,
    interestAmount: 0,
    totalAmount: 0,
    installmentAmount: 0,
});

function toDateInputValue(date: unknown): string {
    const parsed = parseFirestoreDate(date);
    if (!parsed) return '';
    return parsed.toISOString().split('T')[0];
}

function loanToForm(loan: LoanProfile): LoanEditForm {
    return {
        applicantName: loan.applicantName || '',
        mobile: loan.mobile || '',
        aadhar: loan.aadhar || '',
        address: loan.address || '',
        city: loan.city || '',
        townVillage: loan.townVillage || '',
        guarantorName: loan.guarantorName || '',
        guarantorMobile: loan.guarantorMobile || '',
        guarantorAadhar: loan.guarantorAadhar || '',
        guarantorAddress: loan.guarantorAddress || '',
        guarantorCity: loan.guarantorCity || '',
        guarantorTownVillage: loan.guarantorTownVillage || '',
        vehicleProduct: loan.vehicleProduct || '',
        makerCompany: loan.makerCompany || '',
        model: loan.model || '',
        vehicleNumber: loan.vehicleNumber || '',
        vehiclePurchaseDate: toDateInputValue(loan.vehiclePurchaseDate),
        engineSerialNumber: loan.engineSerialNumber || '',
        frequency: loan.frequency || 'Monthly',
        fileDate: toDateInputValue(loan.fileDate),
        emiDate: toDateInputValue(loan.emiDate),
        loanAmount: parseFloat(String(loan.loanAmount || 0)),
        noOfInstallments: loan.noOfInstallments || 0,
        interestRate: parseFloat(String(loan.interestRate || 0)),
        interestAmount: parseFloat(String(loan.interestAmount || 0)),
        totalAmount: parseFloat(String(loan.totalAmount || 0)),
        installmentAmount: parseFloat(String(loan.installmentAmount || 0)),
    };
}

function recalculateLoanTerms(form: LoanEditForm): LoanEditForm {
    const P = parseFloat(String(form.loanAmount)) || 0;
    const T = parseFloat(String(form.noOfInstallments)) || 0;
    const R = parseFloat(String(form.interestRate)) || 0;
    const timeInYears = T / 12;
    const calculatedInterest = (P * timeInYears * R) / 100;
    const calculatedTotal = P + calculatedInterest;
    const calculatedInstallment = T > 0 ? calculatedTotal / T : 0;

    return {
        ...form,
        interestAmount: Math.ceil(calculatedInterest),
        totalAmount: Math.ceil(calculatedTotal),
        installmentAmount: Math.ceil(calculatedInstallment),
    };
}

export default function LoanProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const canEdit = role === 'office';
    const canRepay = role === 'office';
    const backPath = role === 'executive' ? '/executive/loan-status' : '/office/loan-status';

    const [loan, setLoan] = useState<LoanProfile | null>(null);
    const [editForm, setEditForm] = useState<LoanEditForm>(emptyForm());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchLoan = async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setLoan(data.loan);
                setEditForm(loanToForm(data.loan));
            } else {
                setError(data.message || 'Loan not found');
            }
        } catch {
            setError('Failed to load loan profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoan();
    }, [id]);

    useEffect(() => {
        if (!isEditing) return;
        setEditForm((prev) => recalculateLoanTerms(prev));
    }, [isEditing, editForm.loanAmount, editForm.noOfInstallments, editForm.interestRate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'mobile' || name === 'guarantorMobile') {
            setEditForm({ ...editForm, [name]: value.replace(/\D/g, '').slice(0, 10) });
            return;
        }
        if (name === 'aadhar' || name === 'guarantorAadhar') {
            setEditForm({ ...editForm, [name]: value.replace(/\D/g, '').slice(0, 12) });
            return;
        }
        if (name === 'loanAmount' || name === 'noOfInstallments' || name === 'interestRate') {
            setEditForm({ ...editForm, [name]: value === '' ? 0 : parseFloat(value) });
            return;
        }

        setEditForm({ ...editForm, [name]: value });
    };

    const handleCancelEdit = () => {
        if (loan) setEditForm(loanToForm(loan));
        setIsEditing(false);
        setError('');
    };

    const validateForm = (): string | null => {
        if (editForm.mobile.length !== 10) return 'Borrower mobile must be exactly 10 digits.';
        if (editForm.aadhar.length !== 12) return 'Borrower Aadhar must be exactly 12 digits.';
        if (editForm.guarantorMobile.length !== 10) return 'Guarantor mobile must be exactly 10 digits.';
        if (editForm.guarantorAadhar.length !== 12) return 'Guarantor Aadhar must be exactly 12 digits.';
        return null;
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        const payload = recalculateLoanTerms(editForm);
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans/${id}/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (data.success) {
                setLoan(data.loan);
                setEditForm(loanToForm(data.loan));
                setSuccess('Loan profile updated successfully.');
                setIsEditing(false);
            } else {
                setError(data.message || 'Update failed');
            }
        } catch {
            setError('Failed to update loan profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto mt-6 text-center text-gray-500">
                Loading profile...
            </div>
        );
    }

    if (error && !loan) {
        return (
            <div className="max-w-4xl mx-auto mt-6">
                <button
                    type="button"
                    onClick={() => navigate(backPath)}
                    className="flex items-center gap-2 text-gray-600 hover:text-brand-red mb-4"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Loan Status Report
                </button>
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>
            </div>
        );
    }

    if (!loan) return null;

    return (
        <div className="max-w-4xl mx-auto mt-6 mb-10 px-4">
            <button
                type="button"
                onClick={() => navigate(backPath)}
                className="flex items-center gap-2 text-gray-600 hover:text-brand-red mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Loan Status Report
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{loan.id}</h1>
                    <p className="text-gray-500">{loan.applicantName || 'N/A'}</p>
                </div>
                {canEdit && !isEditing && (
                    <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                )}
                {canEdit && isEditing && (
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button type="button" isLoading={isSaving} onClick={handleSave}>
                            <Check className="w-4 h-4 mr-2" /> Save Changes
                        </Button>
                    </div>
                )}
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 border border-red-200">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 border border-green-200">{success}</div>}

            <div className="space-y-6">
                <Section title="Borrower Details" icon={<User className="w-4 h-4 text-blue-600" />} iconBg="bg-blue-100">
                    {isEditing ? (
                        <>
                            <Input name="applicantName" label="Name" value={editForm.applicantName} onChange={handleChange} required />
                            <Input name="mobile" label="Mobile" value={editForm.mobile} onChange={handleChange} required />
                            <Input name="aadhar" label="Aadhar" value={editForm.aadhar} onChange={handleChange} required />
                            <div className="sm:col-span-2 md:col-span-3">
                                <Input name="address" label="Address" value={editForm.address} onChange={handleChange} required />
                            </div>
                            <Input name="city" label="City" value={editForm.city} onChange={handleChange} required />
                            <Input name="townVillage" label="Town/Village" value={editForm.townVillage} onChange={handleChange} required />
                        </>
                    ) : (
                        <>
                            <Field label="Name" value={loan.applicantName} />
                            <Field label="Mobile" value={loan.mobile} />
                            <Field label="Aadhar" value={loan.aadhar} />
                            <Field label="Address" value={loan.address} />
                            <Field label="City" value={loan.city} />
                            <Field label="Town/Village" value={loan.townVillage} />
                        </>
                    )}
                </Section>

                <Section title="Guarantor Details" icon={<Users className="w-4 h-4 text-purple-600" />} iconBg="bg-purple-100">
                    {isEditing ? (
                        <>
                            <Input name="guarantorName" label="Name" value={editForm.guarantorName} onChange={handleChange} required />
                            <Input name="guarantorMobile" label="Mobile" value={editForm.guarantorMobile} onChange={handleChange} required />
                            <Input name="guarantorAadhar" label="Aadhar" value={editForm.guarantorAadhar} onChange={handleChange} required />
                            <div className="sm:col-span-2 md:col-span-3">
                                <Input name="guarantorAddress" label="Address" value={editForm.guarantorAddress} onChange={handleChange} required />
                            </div>
                            <Input name="guarantorCity" label="City" value={editForm.guarantorCity} onChange={handleChange} required />
                            <Input name="guarantorTownVillage" label="Town/Village" value={editForm.guarantorTownVillage} onChange={handleChange} required />
                        </>
                    ) : (
                        <>
                            <Field label="Name" value={loan.guarantorName} />
                            <Field label="Mobile" value={loan.guarantorMobile} />
                            <Field label="Aadhar" value={loan.guarantorAadhar} />
                            <Field label="Address" value={loan.guarantorAddress} />
                            <Field label="City" value={loan.guarantorCity} />
                            <Field label="Town/Village" value={loan.guarantorTownVillage} />
                        </>
                    )}
                </Section>

                <Section title="Vehicle/Product Details" icon={<Truck className="w-4 h-4 text-orange-600" />} iconBg="bg-orange-100">
                    {isEditing ? (
                        <>
                            <Input name="vehicleProduct" label="Vehicle/Product" value={editForm.vehicleProduct} onChange={handleChange} required />
                            <Input name="makerCompany" label="Maker/Company" value={editForm.makerCompany} onChange={handleChange} required />
                            <Input name="model" label="Model" value={editForm.model} onChange={handleChange} required />
                            <Input name="vehicleNumber" label="Vehicle Number" value={editForm.vehicleNumber} onChange={handleChange} required />
                            <Input type="date" name="vehiclePurchaseDate" label="Purchase Date" value={editForm.vehiclePurchaseDate} onChange={handleChange} required />
                            <Input name="engineSerialNumber" label="Engine/Serial No" value={editForm.engineSerialNumber} onChange={handleChange} required />
                        </>
                    ) : (
                        <>
                            <Field label="Vehicle/Product" value={loan.vehicleProduct} />
                            <Field label="Maker/Company" value={loan.makerCompany} />
                            <Field label="Model" value={loan.model} />
                            <Field label="Vehicle Number" value={loan.vehicleNumber} />
                            <Field label="Purchase Date" value={formatDate(loan.vehiclePurchaseDate)} />
                            <Field label="Engine/Serial No" value={loan.engineSerialNumber} />
                        </>
                    )}
                </Section>

                <Section title="Loan Terms" icon={<Activity className="w-4 h-4 text-green-600" />} iconBg="bg-green-100">
                    {isEditing ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                <select
                                    name="frequency"
                                    value={editForm.frequency}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-brand-red focus:ring-1 focus:ring-brand-red focus:outline-none"
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Half-yearly">Half-yearly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>
                            <Input type="date" name="fileDate" label="File Date" value={editForm.fileDate} onChange={handleChange} required />
                            <Input type="date" name="emiDate" label="EMI Date" value={editForm.emiDate} onChange={handleChange} required />
                            <Input type="number" name="loanAmount" label="Loan Amount (P)" value={editForm.loanAmount} onChange={handleChange} required />
                            <Input type="number" name="noOfInstallments" label="No. of Installments (T)" value={editForm.noOfInstallments} onChange={handleChange} required />
                            <Input type="number" name="interestRate" label="Interest % (R)" value={editForm.interestRate} onChange={handleChange} required />
                            <Field label="Interest Amount" value={formatCurrency(editForm.interestAmount)} />
                            <Field label="Total Amount" value={formatCurrency(editForm.totalAmount)} />
                            <Field label="Installment (EMI)" value={formatCurrency(editForm.installmentAmount)} />
                            <Field label="Status" value={loan.isActive ? 'Active' : 'Closed'} />
                        </>
                    ) : (
                        <>
                            <Field label="Frequency" value={loan.frequency} />
                            <Field label="File Date" value={formatDate(loan.fileDate)} />
                            <Field label="EMI Date" value={formatDate(loan.emiDate)} />
                            <Field label="Loan Amount (P)" value={formatCurrency(loan.loanAmount)} />
                            <Field label="No. of Installments (T)" value={loan.noOfInstallments} />
                            <Field label="Interest % (R)" value={loan.interestRate != null ? `${loan.interestRate}%` : undefined} />
                            <Field label="Interest Amount" value={formatCurrency(loan.interestAmount)} />
                            <Field label="Total Amount" value={formatCurrency(loan.totalAmount)} />
                            <Field label="Installment (EMI)" value={formatCurrency(loan.installmentAmount)} />
                            <Field label="Status" value={loan.isActive ? 'Active' : 'Closed'} />
                            {canRepay && loan.isActive && (
                                <div className="sm:col-span-2 md:col-span-3 flex justify-end pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => navigate(`/office/repayment?loanId=${loan.id}`)}
                                    >
                                        <CreditCard className="w-4 h-4 mr-2" /> Loan Repay
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Section>
            </div>
        </div>
    );
}
