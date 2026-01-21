// components/PixQrCode.tsx
import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';

const pixKey = "+5543999581993";
const pixPayload = "00020126360014BR.GOV.BCB.PIX0114+55439995819935204000053039865802BR5915BILHAR MONTANHA6012Jaguapita-PR62070503***6304F96E";

const PixQrCode: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, pixPayload, {
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
  }, []);

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