// components/EquipmentLabel.tsx
import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Equipment } from '../types';

interface EquipmentLabelProps {
  equipment: Equipment;
}

const EquipmentLabel: React.FC<EquipmentLabelProps> = ({ equipment }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
        const qrData = JSON.stringify({
            type: 'equipment',
            id: equipment.id,
        });
        QRCode.toCanvas(canvasRef.current, qrData, {
            width: 80,
            margin: 1,
            errorCorrectionLevel: 'H',
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error) => {
            if (error) console.error('Erro ao gerar QR Code da Etiqueta:', error);
        });
    }
  }, [equipment.id]);
  
  const equipmentTypeText = {
      'mesa': 'Mesa de Sinuca',
      'jukebox': 'Jukebox',
      'grua': 'Grua de Pelúcia'
  };

  return (
    <div 
        className="bg-white text-black p-2" 
        style={{ width: '57mm', fontFamily: "'Courier New', Courier, monospace" }}
    >
        <div className="text-center mb-2">
            <h1 className="font-black text-sm leading-tight tracking-tighter">
                MONTANHA BILHAR E JUKEBOX
            </h1>
        </div>
        <hr className="border-dashed border-black my-2" />
        <p className="text-center font-bold text-xs">EQUIPAMENTO</p>
        <div className="flex items-center justify-center gap-2 mt-2">
            <canvas ref={canvasRef}></canvas>
            <div className="text-left">
                <p className="font-bold text-sm leading-tight">{equipmentTypeText[equipment.type]}</p>
                <p className="text-lg font-black tracking-wider">Nº: {equipment.numero}</p>
            </div>
        </div>
    </div>
  );
};

export default EquipmentLabel;