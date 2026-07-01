import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { parseFirestoreDate } from '../../utils/dateUtils';

interface CollectionRow {
    id: string;
    date: string;
    lanNo: string;
    cusName: string;
    receiptNo: string;
    emi: string;
    penal: string;
    others: string;
    dueDate: string;
    loanAmount: string;
    ipm: string;
    scheduledEmi: string;
    countE: string;
    ipm2: string;
}

const emptyRow = (): CollectionRow => ({
    id: crypto.randomUUID(),
    date: new Date().toISOString().split('T')[0],
    lanNo: '',
    cusName: '',
    receiptNo: '',
    emi: '',
    penal: '',
    others: '',
    dueDate: '',
    loanAmount: '',
    ipm: '',
    scheduledEmi: '',
    countE: '',
    ipm2: '',
});

const toDateInputValue = (date: unknown): string => {
    const parsed = parseFirestoreDate(date);
    if (!parsed) return '';
    return parsed.toISOString().split('T')[0];
};

const toInputString = (value: unknown): string => {
    if (value === undefined || value === null || value === '') return '';
    return String(value);
};

const calcTotal = (row: CollectionRow) => {
    const emi = parseFloat(row.emi) || 0;
    const penal = parseFloat(row.penal) || 0;
    const others = parseFloat(row.others) || 0;
    return emi + penal + others;
};

const rowHasContent = (row: CollectionRow) =>
    Boolean(
        row.lanNo.trim() ||
        row.cusName.trim() ||
        row.receiptNo.trim() ||
        row.date ||
        row.dueDate ||
        row.emi ||
        row.penal ||
        row.others ||
        row.loanAmount ||
        row.ipm ||
        row.scheduledEmi ||
        row.countE ||
        row.ipm2
    );

const cellInput =
    'w-full min-w-[80px] px-2 py-1.5 text-xs border border-gray-200 rounded focus:border-brand-red focus:ring-1 focus:ring-brand-red focus:outline-none bg-white';

const mapEntryToRow = (entry: Record<string, unknown>): CollectionRow => ({
    id: String(entry.id),
    date: toInputString(entry.date) || new Date().toISOString().split('T')[0],
    lanNo: toInputString(entry.lanNo),
    cusName: toInputString(entry.cusName),
    receiptNo: toInputString(entry.receiptNo),
    emi: toInputString(entry.emi),
    penal: toInputString(entry.penal),
    others: toInputString(entry.others),
    dueDate: toInputString(entry.dueDate),
    loanAmount: toInputString(entry.loanAmount),
    ipm: toInputString(entry.ipm),
    scheduledEmi: toInputString(entry.scheduledEmi),
    countE: toInputString(entry.countE),
    ipm2: toInputString(entry.ipm2),
});

export default function CollectionsUpdate() {
    const [rows, setRows] = useState<CollectionRow[]>(() =>
        Array.from({ length: 10 }, () => emptyRow())
    );
    const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        setFetching(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/collections`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success && data.entries?.length > 0) {
                const loaded = data.entries.map(mapEntryToRow);
                setRows(loaded.length >= 10 ? loaded : [...loaded, ...Array.from({ length: 10 - loaded.length }, () => emptyRow())]);
                setLoadedIds(new Set(loaded.map((r: CollectionRow) => r.id)));
            }
        } catch {
            // keep empty rows
        } finally {
            setFetching(false);
        }
    };

    const updateRow = (id: string, field: keyof CollectionRow, value: string) => {
        setRows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    const fetchLoanForRow = async (id: string, lanNo: string) => {
        if (!lanNo.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/loans/${lanNo.trim()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!data.success) return;

            const loan = data.loan;
            const loanAmt = parseFloat(loan.loanAmount) || 0;
            const interestAmt = parseFloat(loan.interestAmount) || 0;
            const installments = loan.noOfInstallments || 1;
            const ipm = Math.round(interestAmt / installments);
            const repayCount = loan.Repayments?.length || 0;

            setRows((prev) =>
                prev.map((row) => {
                    if (row.id !== id) return row;
                    return {
                        ...row,
                        cusName: row.cusName || loan.applicantName || '',
                        dueDate: row.dueDate || toDateInputValue(loan.emiDate),
                        loanAmount: row.loanAmount || String(loanAmt),
                        ipm: row.ipm || String(ipm),
                        scheduledEmi: row.scheduledEmi || String(loan.installmentAmount || ''),
                        countE: row.countE || String(repayCount + 1),
                        ipm2: row.ipm2 || String(ipm),
                        emi: row.emi || String(loan.installmentAmount || ''),
                    };
                })
            );
        } catch {
            // ignore lookup errors
        }
    };

    const addRow = () => setRows((prev) => [...prev, emptyRow()]);

    const removeRow = (id: string) => {
        if (rows.length <= 1) return;
        if (loadedIds.has(id)) {
            setDeletedIds((prev) => [...prev, id]);
        }
        setRows((prev) => prev.filter((row) => row.id !== id));
    };

    const handleUpdate = async () => {
        const rowsToSave = rows.filter(rowHasContent);

        if (rowsToSave.length === 0 && deletedIds.length === 0) {
            setError('Enter at least one row with data before updating.');
            setSuccess('');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const entries = rowsToSave.map((row) => ({
                id: row.id,
                date: row.date,
                lanNo: row.lanNo.trim(),
                cusName: row.cusName.trim(),
                receiptNo: row.receiptNo.trim(),
                emi: parseFloat(row.emi) || 0,
                penal: parseFloat(row.penal) || 0,
                others: parseFloat(row.others) || 0,
                total: calcTotal(row),
                dueDate: row.dueDate,
                loanAmount: parseFloat(row.loanAmount) || 0,
                ipm: parseFloat(row.ipm) || 0,
                scheduledEmi: parseFloat(row.scheduledEmi) || 0,
                countE: parseInt(row.countE, 10) || 0,
                ipm2: parseFloat(row.ipm2) || 0,
            }));

            const response = await fetch(`${API_URL}/collections/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ entries, deletedIds }),
            });

            const data = await response.json();
            if (data.success) {
                const customerMsg =
                    data.customersUpdated > 0
                        ? ` ${data.customersUpdated} customer loan(s) updated.`
                        : '';
                setSuccess(`${data.message}.${customerMsg}`);
                if (data.errors?.length > 0) {
                    setError(
                        data.errors.map((e: { lanNo: string; message: string }) => `${e.lanNo}: ${e.message}`).join('; ')
                    );
                }
                setDeletedIds([]);
                await fetchCollections();
            } else {
                setError(data.message || 'Update failed');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const totals = rows.reduce(
        (acc, row) => {
            if (!rowHasContent(row)) return acc;
            acc.emi += parseFloat(row.emi) || 0;
            acc.penal += parseFloat(row.penal) || 0;
            acc.others += parseFloat(row.others) || 0;
            acc.total += calcTotal(row);
            return acc;
        },
        { emi: 0, penal: 0, others: 0, total: 0 }
    );

    if (fetching) {
        return <div className="p-8 text-gray-600">Loading collections...</div>;
    }

    return (
        <div className="max-w-[100%] mx-auto mt-2 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-7 h-7 text-brand-red" /> Collections Update
                </h2>
                <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={addRow}>
                        <Plus className="w-4 h-4 mr-2" /> Add Row
                    </Button>
                    <Button type="button" isLoading={loading} onClick={handleUpdate}>
                        Update
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4 border border-red-200">{error}</div>
            )}
            {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded mb-4 border border-green-200">{success}</div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse min-w-[1400px]">
                        <thead>
                            <tr className="bg-green-700 text-white">
                                <th className="px-2 py-2 font-semibold border border-green-600 w-10">S.N.</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[100px]">Date</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[90px]">LAN No</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[120px]">Cus Name</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[90px]">Receipt No.</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[80px]">EMI Paid</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[70px]">Penal</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[70px]">Others</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[80px]">Total</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[100px]">Due Date</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[90px]">Loan Amount</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[70px]">IPM</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[80px]">EMI</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[60px]">Count E</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 min-w-[70px]">IPM2</th>
                                <th className="px-2 py-2 font-semibold border border-green-600 w-10"></th>
                            </tr>
                            <tr className="bg-green-100 text-green-900 font-bold">
                                <td className="border border-green-200 px-2 py-1" colSpan={5}></td>
                                <td className="border border-green-200 px-2 py-1 text-right">{totals.emi.toLocaleString('en-IN')}</td>
                                <td className="border border-green-200 px-2 py-1 text-right">{totals.penal.toLocaleString('en-IN')}</td>
                                <td className="border border-green-200 px-2 py-1 text-right">{totals.others.toLocaleString('en-IN')}</td>
                                <td className="border border-green-200 px-2 py-1 text-right">{totals.total.toLocaleString('en-IN')}</td>
                                <td className="border border-green-200 px-2 py-1" colSpan={7}></td>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="border border-gray-200 px-2 py-1 text-center text-gray-500">
                                        {index + 1}
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="date"
                                            className={cellInput}
                                            value={row.date}
                                            onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            className={cellInput}
                                            value={row.lanNo}
                                            placeholder="LAN001"
                                            onChange={(e) => updateRow(row.id, 'lanNo', e.target.value)}
                                            onBlur={(e) => fetchLoanForRow(row.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            className={cellInput}
                                            value={row.cusName}
                                            placeholder="Customer name"
                                            onChange={(e) => updateRow(row.id, 'cusName', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            className={cellInput}
                                            value={row.receiptNo}
                                            placeholder="MRB001"
                                            onChange={(e) => updateRow(row.id, 'receiptNo', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="number"
                                            className={cellInput}
                                            value={row.emi}
                                            placeholder="0"
                                            onChange={(e) => updateRow(row.id, 'emi', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="number"
                                            className={cellInput}
                                            value={row.penal}
                                            placeholder="0"
                                            onChange={(e) => updateRow(row.id, 'penal', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="number"
                                            className={cellInput}
                                            value={row.others}
                                            placeholder="0"
                                            onChange={(e) => updateRow(row.id, 'others', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-2 py-1 text-right font-semibold text-gray-900 bg-green-50">
                                        {calcTotal(row) > 0 ? calcTotal(row).toLocaleString('en-IN') : ''}
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="date"
                                            className={cellInput}
                                            value={row.dueDate}
                                            onChange={(e) => updateRow(row.id, 'dueDate', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="number"
                                            className={cellInput}
                                            value={row.loanAmount}
                                            placeholder="0"
                                            onChange={(e) => updateRow(row.id, 'loanAmount', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="number"
                                            className={cellInput}
                                            value={row.ipm}
                                            placeholder="0"
                                            onChange={(e) => updateRow(row.id, 'ipm', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="number"
                                            className={cellInput}
                                            value={row.scheduledEmi}
                                            placeholder="0"
                                            onChange={(e) => updateRow(row.id, 'scheduledEmi', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="number"
                                            className={cellInput}
                                            value={row.countE}
                                            placeholder="0"
                                            onChange={(e) => updateRow(row.id, 'countE', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1">
                                        <input
                                            type="number"
                                            className={cellInput}
                                            value={row.ipm2}
                                            placeholder="0"
                                            onChange={(e) => updateRow(row.id, 'ipm2', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-gray-200 px-1 py-1 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(row.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove row"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* <p className="text-xs text-gray-500 mt-3">
                Each row is linked to a customer by <strong>LAN No</strong>. On Update, customer loan data is synced:
                name, due date, loan amount, EMI, interest (IPM), and payments are saved to that customer&apos;s profile and repayment history.
                Enter LAN No and tab out to auto-fill from the customer record.
            </p> */}
        </div>
    );
}
