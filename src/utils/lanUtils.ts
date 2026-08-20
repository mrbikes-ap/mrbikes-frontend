/** Normalize LAN number for lookup and storage */
export function normalizeLanNo(value: unknown): string {
    let trimmed = String(value ?? '')
        .trim()
        .toUpperCase()
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, '');

    if (!trimmed) return '';

    // LAN-787 / LAN_787 / LAN.787 -> LAN787
    trimmed = trimmed.replace(/^LAN[-_./]*/, 'LAN');

    if (/^LAN\d+$/.test(trimmed)) {
        return `LAN${String(parseInt(trimmed.slice(3), 10))}`;
    }

    if (/^\d+$/.test(trimmed)) {
        return `LAN${String(parseInt(trimmed, 10))}`;
    }

    return trimmed;
}
