export const formatDate = (date: any): string => {
    if (!date) return 'N/A';

    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && '_seconds' in date) {
        return new Date(date._seconds * 1000).toLocaleDateString('en-IN');
    }

    // Handle serialized Timestamp (if stored as object)
    if (date && typeof date === 'object' && 'seconds' in date) {
        return new Date(date.seconds * 1000).toLocaleDateString('en-IN');
    }

    // Handle Date object or String
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        return d.toLocaleDateString('en-IN');
    } catch (e) {
        return 'Invalid Date';
    }
};

// Format currency (Round Up, No Decimals)
export const formatCurrency = (amount: any): string => {
    if (amount === null || amount === undefined) return '₹ 0';
    const num = parseFloat(amount);
    if (isNaN(num)) return '₹ 0';
    return `₹ ${Math.ceil(num).toLocaleString('en-IN')}`;
};

export const parseFirestoreDate = (date: any): Date | null => {
    if (!date) return null;

    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && '_seconds' in date) {
        return new Date(date._seconds * 1000);
    }

    // Handle serialized Timestamp (if stored as object)
    if (date && typeof date === 'object' && 'seconds' in date) {
        return new Date(date.seconds * 1000);
    }

    // Handle Date object or String
    try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d;
    } catch (e) {
        return null;
    }
};

// Calculate Next Due Date
export const calculateNextDueDate = (loan: any): string => {
    if (!loan || !loan.emiDate) return 'N/A';
    if (!loan.isActive) return 'N/A'; // No due date for closed loans

    const startDate = parseFirestoreDate(loan.emiDate);
    if (!startDate) return 'N/A';

    const installmentsPaid = loan.Repayments ? loan.Repayments.length : 0;

    // Check if fully paid
    if (installmentsPaid >= loan.noOfInstallments) return 'Completed';

    const frequencyMap: { [key: string]: number } = {
        'Monthly': 1,
        'Quarterly': 3,
        'Half-yearly': 6,
        'Yearly': 12
    };

    const monthsToAdd = installmentsPaid * (frequencyMap[loan.frequency] || 1);
    const nextDueDate = new Date(startDate);
    nextDueDate.setMonth(startDate.getMonth() + monthsToAdd);


    return formatDate(nextDueDate);
};

/** Display/storage format used in Collections Update date fields */
export const COLLECTION_DATE_FORMAT = 'dd-mm-yyyy';

const pad2 = (n: number) => String(n).padStart(2, '0');

const excelSerialToDate = (serial: number): Date | null => {
    if (!Number.isFinite(serial) || serial < 1000 || serial >= 100000) return null;
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
};

/** Format a Date as dd-mm-yyyy */
export const formatCollectionDate = (date: Date): string => {
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
};

/**
 * Parse flexible date input: dd-mm-yyyy, dd/mm/yyyy, dd.mm.yyyy, yyyy-mm-dd, or native Date parse.
 * Returns dd-mm-yyyy when valid, otherwise null.
 */
export const parseFlexibleDate = (value: unknown): string | null => {
    if (value === undefined || value === null || value === '') return null;

    if (value instanceof Date && !isNaN(value.getTime())) {
        return formatCollectionDate(value);
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        const excelDate = excelSerialToDate(value);
        return excelDate ? formatCollectionDate(excelDate) : null;
    }

    const str = String(value).trim();
    if (!str) return null;

    if (/^\d+(\.\d+)?$/.test(str)) {
        const excelDate = excelSerialToDate(parseFloat(str));
        return excelDate ? formatCollectionDate(excelDate) : null;
    }

    const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmy) {
        const day = parseInt(dmy[1], 10);
        const month = parseInt(dmy[2], 10);
        const year = parseInt(dmy[3], 10);
        const date = new Date(year, month - 1, day);
        if (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
        ) {
            return formatCollectionDate(date);
        }
        return null;
    }

    const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymd) {
        const year = parseInt(ymd[1], 10);
        const month = parseInt(ymd[2], 10);
        const day = parseInt(ymd[3], 10);
        const date = new Date(year, month - 1, day);
        if (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
        ) {
            return formatCollectionDate(date);
        }
        return null;
    }

    const parsed = parseFirestoreDate(str);
    return parsed ? formatCollectionDate(parsed) : null;
};

/** Normalize any date value to dd-mm-yyyy for display, or empty string */
export const toCollectionDateString = (value: unknown): string => {
    return parseFlexibleDate(value) ?? '';
};

export const getDueDays = (dueDate: any): number => {
    const target = parseFirestoreDate(dueDate);
    if (!target) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
