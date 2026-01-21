// components/EquipmentLabel.tsx
import React from 'react';
import { EquipmentWithCustomer } from '../types';

interface EquipmentLabelProps {
  equipment: EquipmentWithCustomer;
  qrCodeDataUrl: string;
}

const EquipmentLabel: React.FC<EquipmentLabelProps> = ({ equipment, qrCodeDataUrl }) => {
  const equipmentTypeText = {
      'mesa': 'Mesa de Sinuca',
      'jukebox': 'Jukebox',
      'grua': 'Grua de Pelúcia'
  };

  return (
    <div 
        className="bg-white text-black p-2 w-full flex flex-col items-center" 
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
        <div className="text-center mb-1">
            <h1 className="font-black text-sm leading-tight tracking-tighter">
                MONTANHA BILHAR E JUKEBOX
            </h1>
        </div>
        <img src={qrCodeDataUrl} alt="QR Code" style={{ width: 180, height: 180, margin: '4px 0' }} />
        <div className="text-center mt-1 w-full border-t border-dashed border-black pt-2">
            <p className="font-bold text-base leading-tight">{equipmentTypeText[equipment.type]}</p>
            <p className="text-xl font-black tracking-wider">Nº: {equipment.numero}</p>
            <p className="text-sm leading-tight mt-1 truncate">Cliente: {equipment.customerName}</p>
        </div>
    </div>
  );
};

export default EquipmentLabel;