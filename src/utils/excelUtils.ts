
import * as XLSX from 'xlsx';

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
