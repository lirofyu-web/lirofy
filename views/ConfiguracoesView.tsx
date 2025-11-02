// Fix: Implement the ConfiguracoesView component.
import React, { useRef } from 'react';
import PageHeader from '../components/PageHeader';
import { CloudUploadIcon } from '../components/icons/CloudUploadIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { ShareIcon } from '../components/icons/ShareIcon';

interface ConfiguracoesViewProps {
    onSeedData: () => void;
    onClearData: () => void;
    onExportData: () => void;
    onImportData: (file: File) => void;
}

const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ onSeedData, onClearData, onExportData, onImportData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImportData(file);
        }
    };

    return (
        <div>
            <PageHeader
                title="Configurações e Dados"
                subtitle="Gerencie os dados da sua aplicação."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Import/Export Card */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-xl font-semibold text-white mb-4">Backup de Dados</h3>
                    <p className="text-slate-400 mb-6">Salve uma cópia de segurança dos seus dados ou restaure a partir de um arquivo.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onExportData}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-500 transition-colors"
                        >
                            <ShareIcon className="w-5 h-5" />
                            <span>Exportar Dados (JSON)</span>
                        </button>
                        <button
                            onClick={handleImportClick}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-3 px-4 rounded-md hover:bg-slate-500 transition-colors"
                        >
                             <CloudUploadIcon className="w-5 h-5" />
                            <span>Importar Dados (JSON)</span>
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

                {/* Data Actions Card */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-xl font-semibold text-white mb-4">Ações de Dados</h3>
                     <p className="text-slate-400 mb-6">Use com cuidado. Estas ações podem modificar ou apagar seus dados permanentemente.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                         <button
                            onClick={onSeedData}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-700 text-white font-bold py-3 px-4 rounded-md hover:bg-emerald-600 transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>Carregar Dados de Exemplo</span>
                        </button>
                        <button
                            onClick={onClearData}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-red-700 text-white font-bold py-3 px-4 rounded-md hover:bg-red-600 transition-colors"
                        >
                            <TrashIcon className="w-5 h-5" />
                            <span>Apagar Todos os Dados</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracoesView;
