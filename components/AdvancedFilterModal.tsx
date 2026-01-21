// components/AdvancedFilterModal.tsx
import React, { useState, useEffect } from 'react';
import { FilterIcon } from './icons/FilterIcon';

export interface AdvancedFilters {
  debtMin: string;
  notVisitedDays: string;
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedFilters) => void;
  initialFilters: AdvancedFilters;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({ isOpen, onClose, onApply, initialFilters }) => {
  const [filters, setFilters] = useState<AdvancedFilters>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, isOpen]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };
  
  const handleReset = () => {
    const resetFilters = { debtMin: '', notVisitedDays: '' };
    setFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><FilterIcon className="w-6 h-6" />Filtros Avançados</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Dívida Mínima (R$)</label>
            <input
              type="number"
              name="debtMin"
              value={filters.debtMin}
              onChange={handleInputChange}
              placeholder="Ex: 50"
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Não visitado nos últimos (dias)</label>
            <input
              type="number"
              name="notVisitedDays"
              value={filters.notVisitedDays}
              onChange={handleInputChange}
              placeholder="Ex: 30"
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-between gap-4">
          <button onClick={handleReset} className="bg-red-600 text-white font-bold py-2 px-6 rounded-md hover:bg-red-500">Limpar Filtros</button>
          <div className="flex gap-4">
            <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
            <button onClick={handleApply} className="bg-lime-600 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-500">Aplicar</button>
          </div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AdvancedFilterModal;
