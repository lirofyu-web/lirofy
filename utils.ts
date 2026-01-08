// utils.ts

/**
 * Parses a string (potentially with a comma decimal separator) into a float.
 * Returns 0 for invalid or empty strings.
 * @param str The string or number to parse.
 * @returns The parsed number.
 */
export const safeParseFloat = (str: string | number | undefined): number => {
    if (typeof str === 'number') return str;
    if (typeof str !== 'string' || !str) return 0;

    // Standardize to use dot as decimal separator
    const cleaned = str.replace(/[^0-9,.]/g, '');
    const withDot = cleaned.replace(',', '.');
    
    // In case of multiple dots (e.g., from thousand separators), remove all but the last one
    const parts = withDot.split('.');
    if (parts.length > 2) {
        const lastPart = parts.pop();
        const firstPart = parts.join('');
        return parseFloat(`${firstPart}.${lastPart}`) || 0;
    }

    return parseFloat(withDot) || 0;
};
