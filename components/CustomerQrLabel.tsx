// components/CustomerQrLabel.tsx
import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Customer } from '../types';

interface CustomerQrLabelProps {
  customer: Customer;
}

const CustomerQrLabel: React.FC<CustomerQrLabelProps> = ({ customer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, customer.id, {
        width: 128,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('Erro ao gerar QR Code:', error);
      });
    }
  }, [customer.id]);

  return (
    <div 
        className="bg-white text-black p-4 text-center" 
        style={{ width: '220px', fontFamily: "'Courier New', Courier, monospace" }}
    >
        <h2 className="font-black text-lg leading-tight tracking-tight mb-2 break-words">
            {customer.name}
        </h2>
        <canvas ref={canvasRef} className="mx-auto"></canvas>
        <p className="text-xs mt-2 text-gray-600">ID do Cliente</p>
    </div>
  );
};

export default CustomerQrLabel;
