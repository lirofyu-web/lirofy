// components/PixQrCode.tsx
import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';

// This component now generates a static PIX QR Code with an open value.
// It no longer needs props.
const formatField = (id: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
};

// CRC16-CCITT-FALSE implementation
const crc16ccitt = (data: string): string => {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  return ('0000' + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
};

const pixKey = "43999581993";
const recipientName = "BILHAR MONTANHA";
const recipientCity = "JAGUAPITA";

const PixQrCode: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Helper function to sanitize strings according to PIX specifications.
      const sanitize = (str: string, maxLength: number, removeSpacesAndSpecialChars: boolean = false) => {
        let sanitized = str
          .normalize("NFD") // Decompose accented characters
          .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
          .toUpperCase();
        
        // Spec allows A-Z, 0-9, and space for name. City is just A-Z, 0-9.
        const regex = removeSpacesAndSpecialChars ? /[^A-Z0-9]/g : /[^A-Z0-9\s]/g;
        sanitized = sanitized.replace(regex, "");

        return sanitized.substring(0, maxLength).trim();
      };

      // Sanitize inputs for PIX payload
      const cleanName = sanitize(recipientName, 25);
      const cleanCity = sanitize(recipientCity, 15, true); // removeSpacesAndSpecialChars = true
      
      // For a static QR Code (open value), txid is '***' and amount field is omitted.
      const staticTxId = '***';

      // Build PIX payload (BR Code)
      const payload = [
        formatField('00', '01'), // Payload Format Indicator
        formatField('26', 
          formatField('00', 'br.gov.bcb.pix') + // GUI
          formatField('01', pixKey) // Chave PIX
        ),
        formatField('52', '0000'), // Merchant Category Code
        formatField('53', '986'), // Transaction Currency (BRL)
        // OMIT field '54' (Transaction Amount) for open value
        formatField('58', 'BR'), // Country Code
        formatField('59', cleanName), // Merchant Name
        formatField('60', cleanCity), // Merchant City
        formatField('62', 
          formatField('05', staticTxId) // Reference Label (txid)
        ),
      ].join('');
      
      const payloadWithCrcPrefix = payload + '6304';
      const crc = crc16ccitt(payloadWithCrcPrefix);
      const finalPayload = payloadWithCrcPrefix + crc;

      QRCode.toCanvas(canvasRef.current, finalPayload, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('Error generating PIX QR Code:', error);
      });
    }
  }, []); // No dependencies needed for static QR code

  return (
    <div className="text-center mt-4">
        <p className="font-bold">Pague com PIX</p>
        <canvas 
            ref={canvasRef} 
            className="mx-auto mt-2 border-4 border-black" 
            style={{ width: '150px', height: '150px' }}
        />
        <p className="text-xs mt-1">Chave: {pixKey}</p>
    </div>
  );
};

export default PixQrCode;