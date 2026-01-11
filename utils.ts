// utils.ts

/**
 * Parses a string (potentially with thousand separators and a comma decimal) into a float.
 * Returns 0 for invalid or empty strings. Handles formats like '1.234,56'.
 * @param str The string or number to parse.
 * @returns The parsed number.
 */
export const safeParseFloat = (str: string | number | undefined): number => {
    if (typeof str === 'number') return str;
    if (typeof str !== 'string' || !str) return 0;

    // Clean the string: remove anything that isn't a digit, comma, or dot.
    const cleaned = str.replace(/[^0-9,.]/g, '');
    
    // Remove thousand separators (dots)
    const withoutThousands = cleaned.replace(/\./g, '');
    
    // Replace the decimal comma with a dot
    const withDot = withoutThousands.replace(',', '.');

    return parseFloat(withDot) || 0;
};