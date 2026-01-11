// components/CustomerSelectionForSlipsModal.tsx
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { SearchIcon } from './icons/SearchIcon';

interface CustomerSelectionForSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onConfirm: (selectedCustomers: Customer[]) => void;
}

const CustomerSelectionForSlipsModal: React.FC<CustomerSelectionForSlipsModalProps> = ({ isOpen, onClose, customers, onConfirm }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.cidade.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [customers, searchQuery]);

  const handleToggle = (customerId: string) => {
    setSelectedIds(prev => {
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
    if (selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const handleConfirm = () => {
    const selectedCustomers = customers.filter(c => selectedIds.has(c.id));
    onConfirm(selectedCustomers);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Selecionar Clientes para Talões</h2>
          <p className="text-slate-400 mt-1">Selecione os clientes para gerar os talões de cobrança manual.</p>
        </div>
        
        <div className="p-4 flex-shrink-0">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Filtrar por nome ou cidade..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
            </div>
        </div>

        <div className="px-6 py-2 border-b border-t border-slate-700 flex justify-between items-center">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-500 text-lime-600 bg-slate-700 focus:ring-lime-500"
                />
                <label htmlFor="select-all" className="ml-2 text-sm font-medium text-slate-300">
                    Selecionar todos ({selectedIds.size}/{filteredCustomers.length})
                </label>
            </div>
        </div>

        <div className="overflow-y-auto flex-grow">
            <ul className="divide-y divide-slate-700">
                {filteredCustomers.map(customer => (
                    <li key={customer.id} onClick={() => handleToggle(customer.id)} className="flex items-center p-4 cursor-pointer hover:bg-slate-700/50">
                        <input
                            type="checkbox"
                            checked={selectedIds.has(customer.id)}
                            readOnly
                            className="h-4 w-4 rounded border-slate-500 text-lime-600 bg-slate-700 focus:ring-lime-500 pointer-events-none"
                        />
                        <div className="ml-3">
                            <p className="text-md font-medium text-white">{customer.name}</p>
                            <p className="text-sm text-slate-400">{customer.cidade}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>

        <div className="p-6 mt-auto bg-slate-800/50 rounded-b-lg flex justify-end gap-4 border-t border-slate-700">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
          <button 
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="bg-lime-600 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-500 disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            Gerar Talões ({selectedIds.size})
          </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CustomerSelectionForSlipsModal;
