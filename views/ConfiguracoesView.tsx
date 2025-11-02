// views/ConfiguracoesView.tsx
import React, { useState, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CloudUploadIcon } from '../components/icons/CloudUploadIcon';
import ActionModal from '../components/ActionModal';

interface ConfiguracoesViewProps {
  onClearData: () => void;
  onExportData: () => void;
  onMergeData: (file: File) => void;
  onAddCustomerFromText: (text: string) => void;
}

const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  onClearData,
  onExportData,
  onMergeData,
  onAddCustomerFromText,
}) => {
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [customerText, setCustomerText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };
  
  const confirmImport = () => {
    setIsImportModalOpen(false);
    fileInputRef.current?.click();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onMergeData(file);
    }
  };

  const handleTextImport = () => {
    if (customerText.trim()) {
      onAddCustomerFromText(customerText);
      setCustomerText('');
    }
  };
  
  return (
    <>
      <PageHeader
        title="Configurações e Dados"
        subtitle="Gerencie os dados do aplicativo, realize backups e importe informações."
      />

      <div className="space-y-12">
        {/* Data Management Section */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-slate-700 pb-2">Backup de Dados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Export Card */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Exportar (Backup)</h3>
              <p className="text-slate-400 mb-4 flex-grow">Salve todos os seus dados (clientes, cobranças, etc.) em um arquivo JSON. Guarde-o em um local seguro.</p>
              <button
                onClick={onExportData}
                className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500 transition-colors self-start"
              >
                <CloudUploadIcon className="w-5 h-5 transform rotate-180" />
                <span>Exportar Dados</span>
              </button>
            </div>
            {/* Import Card */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Importar e Mesclar</h3>
              <p className="text-slate-400 mb-4 flex-grow">Importe dados de um arquivo de backup. As informações serão mescladas com os dados existentes, adicionando novos registros e atualizando os existentes.</p>
              <button
                onClick={handleImportClick}
                className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500 transition-colors self-start"
              >
                <CloudUploadIcon className="w-5 h-5" />
                <span>Importar Arquivo</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>
          </div>
        </section>
        
        {/* Import from Text Section */}
        <section>
           <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
             <h3 className="text-xl font-bold text-white mb-2">Importar Cliente via Texto</h3>
             <p className="text-slate-400 mb-4">Cole os dados de um cliente (copiados da função "Compartilhar") para adicioná-lo rapidamente.</p>
             <textarea
              value={customerText}
              onChange={(e) => setCustomerText(e.target.value)}
              placeholder="Cole os dados do cliente aqui..."
              rows={8}
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
             />
             <button
              onClick={handleTextImport}
              disabled={!customerText.trim()}
              className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
             >
                Importar Cliente
             </button>
           </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-2xl font-semibold text-red-500 mb-6 border-b border-red-500/30 pb-2">Ações Perigosas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col">
                <h3 className="text-xl font-bold text-red-400 mb-2">Apagar Todos os Dados</h3>
                <p className="text-slate-400 mb-4 flex-grow">Esta ação é irreversível. Todos os clientes, cobranças e despesas serão permanentemente excluídos.</p>
                <button
                    onClick={() => setIsClearModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-500 transition-colors self-start"
                >
                    <TrashIcon className="w-5 h-5" />
                    <span>Apagar Tudo</span>
                </button>
            </div>
          </div>
        </section>
      </div>
      
      {/* Modals */}
      <ActionModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => { onClearData(); setIsClearModalOpen(false); }}
        title="Confirmar Exclusão Total"
        confirmText="Sim, Apagar Tudo"
      >
        <p><strong>ATENÇÃO:</strong> Você tem certeza que deseja apagar TODOS OS DADOS? Esta ação não pode ser desfeita.</p>
      </ActionModal>
       <ActionModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={confirmImport}
        title="Importar e Mesclar Dados?"
        confirmText="Sim, Continuar"
      >
        <p><strong>Atenção:</strong> A importação irá adicionar novos dados e atualizar registros existentes (como clientes) com base no arquivo. Dados que só existem no seu dispositivo não serão apagados. Deseja continuar?</p>
      </ActionModal>
    </>
  );
};

export default ConfiguracoesView;