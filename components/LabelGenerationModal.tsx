// components/LabelGenerationModal.tsx
import React, { useState, useMemo } from 'react';
// FIX: Combined imports from the same module ('../types') into a single statement.
import { Customer, EquipmentWithCustomer } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { PrinterIcon } from './icons/PrinterIcon';

interface LabelGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  showNotification: (message: string, type?: 'success' | 'error') => void;
  onConfirm: (equipments: EquipmentWithCustomer[]) => void;
}

const LabelGenerationModal: React.FC<LabelGenerationModalProps> = ({ isOpen, onClose, customers, showNotification, onConfirm }) => {
  const [selectionMode, setSelectionMode] = useState<'all' | 'select'>('all');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const sortedCustomers = useMemo(() => {
    return customers
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.cidade.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, searchQuery]);

  const handleToggleCustomer = (customerId: string) => {
    setSelectedCustomerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };
  
  const handleSelectAll = () => {
    if (selectedCustomerIds.size === sortedCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(sortedCustomers.map(c => c.id)));
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const targetCustomers = selectionMode === 'all'
        ? customers
        : customers.filter(c => selectedCustomerIds.has(c.id));

      if (targetCustomers.length === 0) {
        showNotification('Nenhum cliente selecionado para gerar etiquetas.', 'error');
        return;
      }

      const allEquipment: EquipmentWithCustomer[] = targetCustomers.flatMap(customer =>
        (customer.equipment || []).map(equip => ({
          ...equip,
          customerName: customer.name,
          customerId: customer.id,
        }))
      );
      
      if (allEquipment.length === 0) {
        showNotification('Os clientes selecionados não possuem equipamentos.', 'error');
        return;
      }
      
      onConfirm(allEquipment);

    } catch (error) {
      console.error("Erro ao preparar etiquetas:", error);
      showNotification('Ocorreu um erro ao preparar as etiquetas.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Gerar Etiquetas de Equipamento (PDF)</h2>
          <p className="text-slate-400 mt-1">Escolha os equipamentos para incluir no arquivo PDF.</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex gap-4 p-1 bg-slate-700/50 rounded-lg">
            <button onClick={() => setSelectionMode('all')} className={`flex-1 py-2 text-sm font-bold rounded-md ${selectionMode === 'all' ? 'bg-lime-600 text-white' : 'text-slate-300'}`}>Todos os Clientes</button>
            <button onClick={() => setSelectionMode('select')} className={`flex-1 py-2 text-sm font-bold rounded-md ${selectionMode === 'select' ? 'bg-lime-600 text-white' : 'text-slate-300'}`}>Selecionar Clientes</button>
          </div>

          {selectionMode === 'select' && (
            <div className="animate-fade-in">
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-slate-400" /></div>
                <input type="text" placeholder="Filtrar clientes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500" />
              </div>
              <div className="flex items-center p-2 border-b border-slate-700">
                <input type="checkbox" id="select-all" checked={selectedCustomerIds.size === sortedCustomers.length && sortedCustomers.length > 0} onChange={handleSelectAll} className="h-4 w-4 rounded border-slate-500 text-lime-600 bg-slate-700 focus:ring-lime-500" />
                <label htmlFor="select-all" className="ml-2 text-sm font-medium text-slate-300">Selecionar Todos ({selectedCustomerIds.size}/{sortedCustomers.length})</label>
              </div>
              <ul className="h-64 overflow-y-auto divide-y divide-slate-700 border-b border-slate-700">
                {sortedCustomers.map(customer => (
                  <li key={customer.id} onClick={() => handleToggleCustomer(customer.id)} className="flex items-center p-3 cursor-pointer hover:bg-slate-700/50">
                    <input type="checkbox" checked={selectedCustomerIds.has(customer.id)} readOnly className="h-4 w-4 rounded border-slate-500 text-lime-600 bg-slate-700 focus:ring-lime-500 pointer-events-none" />
                    <div className="ml-3"><p className="font-medium text-white">{customer.name}</p><p className="text-sm text-slate-400">{customer.cidade}</p></div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="p-6 mt-auto bg-slate-800/50 rounded-b-lg flex justify-end gap-4 border-t border-slate-700">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
          <button onClick={handleGenerate} disabled={isGenerating || (selectionMode === 'select' && selectedCustomerIds.size === 0)} className="inline-flex items-center gap-2 bg-lime-600 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-500 disabled:bg-slate-500 disabled:cursor-not-allowed">
            <PrinterIcon className="w-5 h-5" />
            <span>{isGenerating ? 'Gerando...' : `Gerar PDF (${selectionMode === 'all' ? customers.reduce((acc, c) => acc + (c.equipment || []).length, 0) : customers.filter(c => selectedCustomerIds.has(c.id)).reduce((acc, c) => acc + (c.equipment || []).length, 0)})`}</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LabelGenerationModal;