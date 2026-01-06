// components/ShareCustomerModal.tsx
import React from 'react';
import { Customer } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import CustomerSheet from './CustomerSheet';
import ReactDOMServer from 'react-dom/server';

interface ShareCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const ShareCustomerModal: React.FC<ShareCustomerModalProps> = ({ isOpen, onClose, customer, showNotification }) => {

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
  
  const handleSaveAsPdf = () => {
    const printWindow = window.open('', '', 'height=1123,width=794'); // A4 dimensions in pixels approx
    if (printWindow) {
        const sheetHtml = ReactDOMServer.renderToString(<CustomerSheet customer={customer} />);
        printWindow.document.write(`
            <html>
                <head>
                    <title>Ficha Cadastral - ${customer.name}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        body { 
                            font-family: 'Inter', sans-serif;
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact;
                        }
                    </style>
                </head>
                <body onload="setTimeout(() => { window.print(); window.close(); }, 250);">
                    ${sheetHtml}
                </body>
            </html>
        `);
        printWindow.document.close();
        onClose();
    }
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
                onClick={handleSaveAsPdf}
                className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-cyan-500 transition-colors"
            >
                <PrinterIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-white">Salvar como PDF</h3>
                    <p className="text-sm text-slate-400">Gera um arquivo PDF da ficha do cliente utilizando a função de impressão do navegador.</p>
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