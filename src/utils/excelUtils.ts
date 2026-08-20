import * as XLSX from 'xlsx';
import { parseFlexibleDate, toCollectionDateString } from './dateUtils';
import { normalizeLanNo } from './lanUtils';

export interface ParsedCollectionRow {
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

const normalizeHeader = (header: unknown): string =>
    String(header ?? '')
        .trim()
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, ' ');

const HEADER_MAP: Record<keyof ParsedCollectionRow, string[]> = {
    date: ['date', 'collection date', 'txn date', 'transaction date'],
    lanNo: ['lan no', 'lan', 'lan number', 'loan account no', 'loan no'],
    cusName: ['cus name', 'customer name', 'name', 'customer'],
    receiptNo: ['receipt no', 'receipt', 'receipt number'],
    emi: ['emi paid', 'paid emi', 'amount paid'],
    penal: ['penal', 'penalty', 'penal charges'],
    others: ['others', 'other', 'other charges'],
    dueDate: ['due date', 'due'],
    loanAmount: ['loan amount', 'loan amt', 'principal'],
    ipm: ['ipm'],
    scheduledEmi: ['emi', 'scheduled emi', 'installment', 'installment amount'],
    countE: ['count e', 'count', 'installment no', 'inst no'],
    ipm2: ['ipm2', 'ipm 2'],
};

const toCellString = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return String(value).trim();
};

const excelCellToDateString = (value: unknown): string => {
    if (value === undefined || value === null || value === '') return '';

    if (typeof value === 'number' && Number.isFinite(value)) {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) {
            const day = String(parsed.d).padStart(2, '0');
            const month = String(parsed.m).padStart(2, '0');
            return `${day}-${month}-${parsed.y}`;
        }
    }

    if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim())) {
        const parsed = XLSX.SSF.parse_date_code(parseFloat(value));
        if (parsed) {
            const day = String(parsed.d).padStart(2, '0');
            const month = String(parsed.m).padStart(2, '0');
            return `${day}-${month}-${parsed.y}`;
        }
    }

    if (value instanceof Date) {
        return toCollectionDateString(value);
    }

    return toCollectionDateString(value);
};

const resolveField = (
    normalizedHeaders: string[],
    aliases: string[],
    usedIndices: Set<number>
): number => {
    for (const alias of aliases) {
        const idx = normalizedHeaders.findIndex(
            (h, i) => !usedIndices.has(i) && (h === alias || h.includes(alias))
        );
        if (idx >= 0) return idx;
    }
    return -1;
};

const mapHeaders = (headers: string[]): Partial<Record<keyof ParsedCollectionRow, number>> => {
    const normalized = headers.map(normalizeHeader);
    const mapping: Partial<Record<keyof ParsedCollectionRow, number>> = {};
    const usedIndices = new Set<number>();

    (Object.keys(HEADER_MAP) as (keyof ParsedCollectionRow)[]).forEach((field) => {
        const idx = resolveField(normalized, HEADER_MAP[field], usedIndices);
        if (idx >= 0) {
            mapping[field] = idx;
            usedIndices.add(idx);
        }
    });

    return mapping;
};

const rowFromCells = (
    cells: unknown[],
    mapping: Partial<Record<keyof ParsedCollectionRow, number>>
): ParsedCollectionRow | null => {
    const get = (field: keyof ParsedCollectionRow): string => {
        const idx = mapping[field];
        if (idx === undefined || idx < 0) return '';
        const value = cells[idx];
        if (field === 'date' || field === 'dueDate') {
            return excelCellToDateString(value);
        }
        if (field === 'lanNo') {
            return normalizeLanNo(toCellString(value));
        }
        return toCellString(value);
    };

    const row: ParsedCollectionRow = {
        date: get('date'),
        lanNo: get('lanNo'),
        cusName: get('cusName'),
        receiptNo: get('receiptNo'),
        emi: get('emi'),
        penal: get('penal'),
        others: get('others'),
        dueDate: get('dueDate'),
        loanAmount: get('loanAmount'),
        ipm: get('ipm'),
        scheduledEmi: get('scheduledEmi'),
        countE: get('countE'),
        ipm2: get('ipm2'),
    };

    const hasData = Object.values(row).some((v) => v.trim() !== '');
    return hasData ? row : null;
};

/**
 * Parse an Excel file into collection rows. Uses the first sheet and auto-detects column headers.
 */
export const parseCollectionsExcel = async (file: File): Promise<ParsedCollectionRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: true,
        defval: '',
    });

    if (rows.length === 0) return [];

    let headerRowIndex = 0;
    let mapping: Partial<Record<keyof ParsedCollectionRow, number>> = {};

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const candidate = (rows[i] as unknown[]).map((cell) => String(cell ?? ''));
        const candidateMap = mapHeaders(candidate);
        if (Object.keys(candidateMap).length >= 2) {
            headerRowIndex = i;
            mapping = candidateMap;
            break;
        }
    }

    const parsed: ParsedCollectionRow[] = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const cells = rows[i] as unknown[];
        if (!cells?.length) continue;
        const row = rowFromCells(cells, mapping);
        if (row) parsed.push(row);
    }

    return parsed;
};

/**
 * Exports data to an Excel file.
 * @param data Array of objects to export.
 * @param fileName Name of the file to download (without extension).
 * @param sheetName Name of the sheet in the Excel file.
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
    // 1. Create a new workbook
    const wb = XLSX.utils.book_new();

    // 2. Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // 3. Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 4. Write file and trigger download
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

/**
 * Exports multiple sheets to a single Excel file.
 * @param sheets Array of objects containing sheetName and data.
 * @param fileName Name of the file to download (without extension).
 */
export const exportMultipleSheetsToExcel = (sheets: { sheetName: string; data: any[] }[], fileName: string) => {
    const wb = XLSX.utils.book_new();

    sheets.forEach(({ sheetName, data }) => {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `${fileName}.xlsx`);
};
