// views/ConfiguracoesView.tsx
import React, { useState, useRef, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { CloudUploadIcon } from '../components/icons/CloudUploadIcon';
import ActionModal from '../components/ActionModal';
import { Theme } from '../App';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { InstallIcon } from '../components/icons/InstallIcon';
import { AndroidIcon } from '../components/icons/AndroidIcon';

interface ConfiguracoesViewProps {
  onExportData: () => void;
  onMergeData: (file: File) => void;
  onAddCustomerFromText: (text: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  installPrompt: any;
  onInstallClick: () => void;
  isStandalone: boolean;
}

const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  onExportData,
  onMergeData,
  onAddCustomerFromText,
  theme,
  setTheme,
  installPrompt,
  onInstallClick,
  isStandalone
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [customerText, setCustomerText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = useCallback(() => {
    setIsImportModalOpen(true);
  }, []);
  
  const confirmImport = useCallback(() => {
    setIsImportModalOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onMergeData(file);
    }
  }, [onMergeData]);

  const handleTextImport = useCallback(() => {
    if (customerText.trim()) {
      onAddCustomerFromText(customerText);
      setCustomerText('');
    }
  }, [customerText, onAddCustomerFromText]);

  const handleThemeChange = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <>
      <PageHeader
        title="Configurações e Dados"
        subtitle="Gerencie os dados do aplicativo, realize backups e importe informações."
      />

      <div className="space-y-12">
        {/* Appearance Section */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Aparência</h2>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tema do Aplicativo</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Escolha entre o tema claro ou escuro.</p>
            <div className="flex items-center gap-4">
              <span className="text-slate-500 dark:text-slate-400">Claro</span>
              <button
                onClick={handleThemeChange}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 ${
                  theme === 'dark' ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  <span
                    className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
                      theme === 'light' ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
                    }`}
                  >
                    <SunIcon className="h-3 w-3 text-slate-500" />
                  </span>
                  <span
                    className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
                      theme === 'dark' ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
                    }`}
                  >
                    <MoonIcon className="h-3 w-3 text-emerald-600" />
                  </span>
                </span>
              </button>
              <span className="text-slate-500 dark:text-slate-400">Escuro</span>
            </div>
          </div>
        </section>

        {/* PWA Install Section */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Instalação para Dispositivos</h2>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <AndroidIcon className="w-12 h-12 text-green-500 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Instalar no Android (Recomendado)</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Adicione o aplicativo à tela de início para acesso rápido e uso offline, como um app nativo, sem a barra de endereço do navegador.
                </p>
              </div>
            </div>
            <div className="mt-6 sm:pl-[64px]">
              {isStandalone ? (
                <p className="text-emerald-500 dark:text-emerald-400 font-semibold">
                  O aplicativo já está instalado neste dispositivo!
                </p>
              ) : installPrompt ? (
                <button
                  onClick={onInstallClick}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-500 transition-colors"
                >
                  <InstallIcon className="w-5 h-5" />
                  <span>Adicionar à Tela de Início</span>
                </button>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm p-4 bg-slate-100 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700">
                  Para habilitar a instalação, continue usando o aplicativo por alguns instantes no Google Chrome. O botão aparecerá aqui assim que estiver disponível.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Backup de Dados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Export Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Exportar (Backup)</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4 flex-grow">Salve todos os seus dados (clientes, cobranças, etc.) em um arquivo JSON. Guarde-o em um local seguro.</p>
              <button
                onClick={onExportData}
                className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500 transition-colors self-start"
              >
                <CloudUploadIcon className="w-5 h-5 transform rotate-180" />
                <span>Exportar Dados</span>
              </button>
            </div>
            {/* Import Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Importar e Mesclar</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4 flex-grow">Importe dados de um arquivo de backup. As informações serão mescladas com os dados existentes, adicionando novos registros e atualizando os existentes.</p>
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
           <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Importar Cliente via Texto</h3>
             <p className="text-slate-500 dark:text-slate-400 mb-4">Cole os dados de um cliente (copiados da função "Compartilhar") para adicioná-lo rapidamente.</p>
             <textarea
              value={customerText}
              onChange={(e) => setCustomerText(e.target.value)}
              placeholder="Cole os dados do cliente aqui..."
              rows={8}
              className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
      </div>
      
      {/* Modals */}
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