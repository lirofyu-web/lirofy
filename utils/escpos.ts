// utils/escpos.ts

const encoder = new TextEncoder();

export const ESC = 0x1B;
export const GS = 0x1D;

export const INIT = new Uint8Array([ESC, 0x40]);
export const ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00]);
export const ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01]);
export const ALIGN_RIGHT = new Uint8Array([ESC, 0x61, 0x02]);
export const BOLD_ON = new Uint8Array([ESC, 0x45, 0x01]);
export const BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00]);
export const CUT_PAPER = new Uint8Array([GS, 0x56, 0x42, 0x00]);

export function text(str: string): Uint8Array {
    // Replace special Brazilian characters with their closest ASCII equivalents
    // This is important for many thermal printers that don't support full UTF-8
    const normalized = str
        .replace(/[áàâã]/gi, 'a')
        .replace(/[éê]/gi, 'e')
        .replace(/[í]/gi, 'i')
        .replace(/[óôõ]/gi, 'o')
        .replace(/[úü]/gi, 'u')
        .replace(/[ç]/gi, 'c');
    return encoder.encode(normalized);
}

export function combine(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}