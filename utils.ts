// utils.ts

/**
 * Parses a string containing only digits into a number.
 * Returns 0 for invalid or empty strings. Handles numbers directly.
 * @param str The string or number to parse.
 * @returns The parsed number.
 */
export const safeParseFloat = (str: string | number | undefined): number => {
    if (typeof str === 'number') return str;
    if (typeof str !== 'string' || !str) return 0;

    // Standardize decimal separator to '.'
    const standardized = str.replace(',', '.');
    
    // parseFloat will parse until it hits a non-numeric character (after the first dot)
    const parsed = parseFloat(standardized);
    return isNaN(parsed) ? 0 : parsed;
};
