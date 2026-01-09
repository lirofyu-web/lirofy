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
    const normalized = str
        .replace(/[áàâã]/g, 'a')
        .replace(/[ÁÀÂÃ]/g, 'A')
        .replace(/[éê]/g, 'e')
        .replace(/[ÉÊ]/g, 'E')
        .replace(/[í]/g, 'i')
        .replace(/[Í]/g, 'I')
        .replace(/[óôõ]/g, 'o')
        .replace(/[ÓÔÕ]/g, 'O')
        .replace(/[úü]/g, 'u')
        .replace(/[ÚÜ]/g, 'U')
        .replace(/[ç]/g, 'c')
        .replace(/[Ç]/g, 'C');
    return encoder.encode(normalized);
}

export function qrCode(data: string): Uint8Array {
    const dataBytes = text(data);
    const dataLength = dataBytes.length + 3;
    const pL = dataLength % 256;
    const pH = Math.floor(dataLength / 256);

    const commands = [
        // Set QR model to Model 2
        new Uint8Array([GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]),
        // Set module size to 5
        new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x05]),
        // Set error correction level to M
        new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]),
        // Store data in symbol storage
        new Uint8Array([GS, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...dataBytes]),
        // Print QR code
        new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]),
    ];
    return combine(...commands);
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