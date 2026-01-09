// components/ShareCustomerModal.tsx
import React from 'react';
import { Customer } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';


interface ShareCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  onPrintCustomer: (customer: Customer) => void;
}

const ShareCustomerModal: React.FC<ShareCustomerModalProps> = ({ isOpen, onClose, customer, showNotification, onPrintCustomer }) => {
  
  const handleCopyJson = () => {
    const customerDataToShare = {
      name: customer.name,
      cpfRg: customer.cpfRg,
      cidade: customer.cidade,
      endereco: customer.endereco,
      telefone: customer.telefone,
      linhaNumero: customer.linhaNumero,
      latitude: customer.latitude,
      longitude: customer.longitude,
      equipment: customer.equipment.map(({ id, ...rest }) => rest) // Remove runtime ID
    };

    const textToCopy = JSON.stringify(customerDataToShare, null, 2);

    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification('Dados do cliente copiados para a área de transferência!');
    }).catch(err => {
        showNotification('Erro ao copiar dados.', 'error');
        console.error('Could not copy text: ', err);
    });
    onClose();
  };
  
  const handlePrint = () => {
    onPrintCustomer(customer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6">
          <h2 id="share-modal-title" className="text-2xl font-bold text-white">Exportar Cliente</h2>
          <p className="text-slate-400 mt-2">Como você deseja exportar os dados de {customer.name}?</p>
        </div>
        <div className="p-6 space-y-4">
            <button
                onClick={handlePrint}
                className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-cyan-500 transition-colors"
            >
                <PrinterIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-white">Gerar Ficha (PDF/Impressão)</h3>
                    <p className="text-sm text-slate-400">Abre a opção de impressão para salvar como PDF ou imprimir em A4.</p>
                </div>
            </button>
            <button
                onClick={handleCopyJson}
                className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-lime-500 transition-colors"
            >
                <DocumentDuplicateIcon className="w-8 h-8 text-lime-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-white">Copiar Dados (JSON)</h3>
                    <p className="text-sm text-slate-400">Copia os dados brutos. Útil para backups ou importação em texto.</p>
                </div>
            </button>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors"
          >
            Fechar
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

export default ShareCustomerModal;