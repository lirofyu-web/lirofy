// views/ConfiguracoesView.tsx
import React, { useState, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import { AppData } from '../App';
import ActionModal from '../components/ActionModal';

// --- ICONS (inlined to avoid creating new files) ---
const DownloadIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);


interface ConfiguracoesViewProps {
    appData: AppData;
    onRestoreData: (data: AppData) => void;
    onClearData: () => void;
}

const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ appData, onRestoreData, onClearData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const handleExportData = () => {
        const dataStr = JSON.stringify(appData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `montanha_bilhar_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parsedData = JSON.parse(text);
                // Basic validation
                if (parsedData.customers && parsedData.billings && parsedData.expenses && parsedData.debtPayments) {
                    if(window.confirm("Tem certeza que deseja restaurar os dados? A ação substituirá todos os dados atuais.")) {
                        onRestoreData(parsedData as AppData);
                        alert("Dados restaurados com sucesso!");
                    }
                } else {
                    throw new Error("Formato do arquivo inválido.");
                }
            } catch (error) {
                console.error("Erro ao importar dados:", error);
                alert("Falha ao importar dados. Verifique se o arquivo é um backup válido.");
            }
        };
        reader.readAsText(file);
        // Reset file input to allow re-uploading the same file
        event.target.value = '';
    };

    const handleConfirmClear = () => {
        onClearData();
        setIsClearModalOpen(false);
        alert("Todos os dados foram apagados.");
    };

    return (
        <>
            <div>
                <PageHeader
                    title="Configurações e Dados"
                    subtitle="Gerencie os dados salvos no seu dispositivo."
                />

                <div className="space-y-8 max-w-2xl mx-auto">
                    {/* Backup Section */}
                    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                        <h3 className="text-xl font-semibold text-white mb-3">Backup e Restauração</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Salve uma cópia de segurança dos seus dados ou restaure a partir de um arquivo de backup. Útil para transferir dados entre dispositivos.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={handleExportData} className="flex-1 inline-flex items-center justify-center gap-2 bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-500 transition-colors">
                                <DownloadIcon className="w-5 h-5" />
                                <span>Exportar Dados (Backup)</span>
                            </button>
                            <button onClick={handleImportClick} className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3 px-4 rounded-md hover:bg-emerald-500 transition-colors">
                                <UploadIcon className="w-5 h-5" />
                                <span>Importar Dados</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                        </div>
                    </div>
                    
                    {/* Danger Zone */}
                    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-red-700/50">
                        <h3 className="text-xl font-semibold text-red-400 mb-3">Zona de Perigo</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            A ação abaixo é irreversível. Tenha certeza do que está fazendo e considere criar um backup antes de continuar.
                        </p>
                        <button onClick={() => setIsClearModalOpen(true)} className="w-full inline-flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-500 transition-colors">
                            <TrashIcon className="w-5 h-5" />
                            <span>Limpar Todos os Dados</span>
                        </button>
                    </div>
                </div>
            </div>

            <ActionModal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={handleConfirmClear}
                title="Limpar Todos os Dados"
                confirmText="Sim, Apagar Tudo"
            >
                <p>
                    Você tem certeza absoluta que deseja apagar todos os clientes, cobranças, despesas e dívidas? 
                    <strong className="text-red-400 block mt-2">Esta ação não pode ser desfeita.</strong>
                </p>
            </ActionModal>
        </>
    );
};

export default ConfiguracoesView;