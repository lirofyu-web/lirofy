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
        className="bg-white text-black p-2 w-full" 
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
        <div className="text-center mb-2">
            <h1 className="font-black text-sm leading-tight tracking-tighter">
                MONTANHA BILHAR E JUKEBOX
            </h1>
        </div>
        <hr className="border-dashed border-black my-1" />
        <div className="flex items-center justify-start gap-2 mt-1">
            <img src={qrCodeDataUrl} alt="QR Code" style={{ width: 70, height: 70 }} />
            <div className="text-left flex-grow overflow-hidden">
                <p className="font-bold text-xs leading-tight">{equipmentTypeText[equipment.type]}</p>
                <p className="text-base font-black tracking-wider">Nº: {equipment.numero}</p>
                <p className="text-xs leading-tight mt-1 truncate">Cliente: {equipment.customerName}</p>
            </div>
        </div>
    </div>
  );
};

export default EquipmentLabel;