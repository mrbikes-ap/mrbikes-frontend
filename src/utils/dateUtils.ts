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
