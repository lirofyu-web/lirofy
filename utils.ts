// utils.ts

/**
 * Parses a string in pt-BR format (e.g., "1.500,50") into a number.
 * Returns 0 for invalid or empty strings. Handles numbers directly.
 * @param str The string or number to parse.
 * @returns The parsed number.
 */
export const safeParseFloat = (str: string | number | undefined): number => {
    if (typeof str === 'number') return str;
    if (typeof str !== 'string' || !str) return 0;

    // Remove thousand separators (dots) and then replace comma with a dot for decimal.
    // This correctly handles pt-BR format like "1.500,50" -> "1500.50"
    // It assumes users will use "," for decimals as is standard in Brazil.
    // NOTE: "1.50" will be interpreted as 150. Users must use "1,50".
    const standardized = str.toString().replace(/\./g, '').replace(',', '.');
    
    const parsed = parseFloat(standardized);
    return isNaN(parsed) ? 0 : parsed;
};