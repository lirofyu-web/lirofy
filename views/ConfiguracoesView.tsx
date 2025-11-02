// views/ConfiguracoesView.tsx
import React, { useRef } from 'react';
import PageHeader from '../components/PageHeader';
import { CloudUploadIcon } from '../components/icons/CloudUploadIcon';

const ConfiguracoesView: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            const dataToExport = {
                customers: JSON.parse(localStorage.getItem('customers') || '[]'),
                billings: JSON.parse(localStorage.getItem('billings') || '[]'),
                expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
                debtPayments: JSON.parse(localStorage.getItem('debtPayments') || '[]'),
            };

            const jsonString = JSON.stringify(dataToExport, null, 2);
            const date = new Date().toISOString().split('T')[0];
            const fileName = `montanha_backup_${date}.json`;
            const file = new File([jsonString], fileName, { type: 'application/json' });

            // Use Web Share API if available (great for mobile to share to Google Drive, etc.)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Backup Montanha Bilhar',
                    text: `Backup dos dados do dia ${date}.`
                });
            } else {
                // Fallback for desktop browsers
                const link = document.createElement('a');
                link.href = URL.createObjectURL(file);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }
        } catch (error) {
             if (error instanceof DOMException && error.name === 'AbortError') {
                // User cancelled the share operation, which is normal.
                console.log('Compartilhamento cancelado pelo usuário.');
            } else {
                console.error("Erro ao exportar/compartilhar dados:", error);
                alert("Ocorreu um erro ao exportar os dados.");
            }
        }
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
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("Formato de arquivo inválido.");
                }
                const importedData = JSON.parse(text);

                // Basic validation
                if (!importedData.customers || !importedData.billings || !importedData.expenses || !importedData.debtPayments) {
                   throw new Error("O arquivo de backup é inválido ou está corrompido.");
                }

                const confirmation = window.confirm(
                    "ATENÇÃO: Importar este backup substituirá TODOS os dados existentes. Esta ação não pode ser desfeita. Deseja continuar?"
                );

                if (confirmation) {
                    localStorage.setItem('customers', JSON.stringify(importedData.customers));
                    localStorage.setItem('billings', JSON.stringify(importedData.billings));
                    localStorage.setItem('expenses', JSON.stringify(importedData.expenses));
                    localStorage.setItem('debtPayments', JSON.stringify(importedData.debtPayments));
                    alert("Dados importados com sucesso! A aplicação será recarregada.");
                    window.location.reload();
                }

            } catch (error) {
                 console.error("Erro ao importar dados:", error);
                 alert(`Ocorreu um erro ao importar os dados: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                // Reset file input
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <PageHeader
                title="Configurações e Dados"
                subtitle="Gerencie os dados da sua aplicação, realize backups e restaure informações."
            />

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Backup de Dados</h3>
                <p className="text-slate-400 mb-6">
                    Salve um backup de todos os dados da aplicação. Em dispositivos móveis, isso abrirá a opção de compartilhamento para salvar no Google Drive, enviar por e-mail, etc. Em computadores, o arquivo será baixado.
                </p>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-500 transition-colors"
                >
                    <CloudUploadIcon className="w-5 h-5" />
                    <span>Salvar Backup na Nuvem / Exportar</span>
                </button>
            </div>

            <div className="mt-8 bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Restaurar Dados</h3>
                <p className="text-slate-400 mb-2">
                    Importe um arquivo de backup para restaurar os dados da aplicação.
                </p>
                <p className="text-amber-400 bg-amber-900/50 border border-amber-700 p-3 rounded-md mb-6 text-sm">
                    <strong>Atenção:</strong> A importação substituirá todos os dados atuais. Faça um backup dos seus dados atuais antes de prosseguir, se necessário.
                </p>
                <button
                    onClick={handleImportClick}
                    className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors"
                >
                    Importar de Arquivo
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
    );
};

export default ConfiguracoesView;