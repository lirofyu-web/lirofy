// components/EquipmentSelectionModal.tsx
import React from 'react';
import { Customer, Equipment } from '../types';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';
import { CraneIcon } from './icons/CraneIcon';

interface EquipmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSelect: (equipment: Equipment) => void;
}

const EquipmentSelectionModal: React.FC<EquipmentSelectionModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSelect,
}) => {
  if (!isOpen) return null;

  const EquipmentIcon: React.FC<{type: Equipment['type']}> = ({ type }) => {
    switch(type) {
        case 'mesa': return <BilliardIcon className="w-6 h-6 text-cyan-400" />;
        case 'jukebox': return <JukeboxIcon className="w-6 h-6 text-fuchsia-400" />;
        case 'grua': return <CraneIcon className="w-6 h-6 text-orange-400" />;
        default: return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="equipment-selection-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 id="equipment-selection-modal-title" className="text-2xl font-bold text-white">Selecionar Equipamento</h2>
          <p className="text-slate-400">Escolha um equipamento de {customer.name} para faturar.</p>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          {(customer.equipment || []).length > 0 ? (
            (customer.equipment || []).map(equip => (
              <button
                key={equip.id}
                onClick={() => onSelect(equip)}
                className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-emerald-500 transition-colors"
              >
                <div className="flex-shrink-0">
                  <EquipmentIcon type={equip.type} />
                </div>
                <div>
                  <p className="font-bold text-white capitalize">{equip.type} {equip.numero}</p>
                  <p className="text-sm text-slate-400">Leitura Anterior: {equip.relogioAnterior}</p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-slate-400 py-8">Nenhum equipamento cadastrado para este cliente.</p>
          )}
        </div>
        <div className="p-6 mt-auto bg-slate-800/50 rounded-b-lg flex justify-end gap-4 border-t border-slate-700">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default EquipmentSelectionModal;