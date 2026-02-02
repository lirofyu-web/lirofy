// utils.ts

/**
 * Parses a string in pt-BR format (e.g., "1.500,50") or standard format ("338.4") into a number.
 * Returns 0 for invalid or empty strings. Handles numbers directly.
 * @param str The string or number to parse.
 * @returns The parsed number.
 */
export const safeParseFloat = (str: string | number | undefined): number => {
    if (typeof str === 'number') {
        return isNaN(str) ? 0 : str;
    }
    if (typeof str !== 'string' || str.trim() === '') {
        return 0;
    }

    let s = str.trim();

    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');

    // If comma is present and it appears after the last dot, it's the decimal separator (pt-BR style)
    // e.g., "1.234,56"
    if (lastComma > lastDot) {
        s = s.replace(/\./g, '').replace(',', '.');
    } 
    // If dot is present and it appears after the last comma, it's the decimal separator (en-US style)
    // e.g., "1,234.56"
    else if (lastDot > lastComma) {
        s = s.replace(/,/g, '');
    }
    // If only commas are present, check if it's a decimal or thousands
    else if (lastComma !== -1) {
        const afterComma = s.substring(lastComma + 1);
        // If it's not 1 or 2 digits after the final comma, treat all commas as thousand separators
        if (afterComma.length < 1 || afterComma.length > 2) {
            s = s.replace(/,/g, '');
        } else {
            // It is likely a decimal, replace only the last comma with a dot
            s = s.substring(0, lastComma) + '.' + afterComma;
        }
    }
    // If only dots are present, they are thousands separators, except maybe the last one
    else if (lastDot !== -1) {
       const parts = s.split('.');
       if (parts.length > 2) { // e.g. "1.000.000"
           s = s.replace(/\./g, '');
       } else if (parts.length === 2 && parts[1].length === 3) {
           // Ambiguous: "1.000" is usually a thousand, not a decimal
           s = s.replace('.', '');
       }
       // A single dot with 1 or 2 decimal places like "123.45" is handled correctly by parseFloat
    }

    const parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : parsed;
};