// views/ConfiguracoesView.tsx
import React, { useState, useRef, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { CloudUploadIcon } from '../components/icons/CloudUploadIcon';
import ActionModal from '../components/ActionModal';
import { Theme } from '../App';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { applyThemeColors, defaultColors, AppThemeColors } from '../utils/theme';

interface ConfiguracoesViewProps {
  onExportData: () => void;
  onMergeData: (file: File) => void;
  onAddCustomerFromText: (text: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const ColorPicker: React.FC<{ label: string, color: string, onChange: (color: string) => void }> = ({ label, color, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer"
            />
            <span className="font-mono text-slate-500 dark:text-slate-400">{color}</span>
        </div>
    </div>
);


const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  onExportData,
  onMergeData,
  onAddCustomerFromText,
  theme,
  setTheme,
  showNotification,
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [customerText, setCustomerText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [themeColors, setThemeColors] = useState<AppThemeColors>(() => {
    const savedColors = localStorage.getItem('appThemeColors');
    try {
        return savedColors ? JSON.parse(savedColors) : defaultColors;
    } catch (e) {
        return defaultColors;
    }
  });

  const handleColorChange = (colorType: keyof AppThemeColors, value: string) => {
    const newColors = { ...themeColors, [colorType]: value };
    setThemeColors(newColors);
    applyThemeColors(newColors); // Live preview
  };

  const saveThemeColors = () => {
    localStorage.setItem('appThemeColors', JSON.stringify(themeColors));
    showNotification('Tema de cores salvo com sucesso!', 'success');
  };

  const restoreDefaultColors = () => {
    setThemeColors(defaultColors);
    applyThemeColors(defaultColors);
    localStorage.removeItem('appThemeColors');
    showNotification('Cores padrão restauradas.', 'success');
  };

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
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tema do Aplicativo</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Escolha entre o tema claro ou escuro.</p>
            <div className="flex items-center gap-4">
              <span className="text-slate-500 dark:text-slate-400">Claro</span>
              <button
                onClick={handleThemeChange}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 ${
                  theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-slate-300'
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
                    <MoonIcon className="h-3 w-3 text-[var(--color-primary)]" />
                  </span>
                </span>
              </button>
              <span className="text-slate-500 dark:text-slate-400">Escuro</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cores do Tema</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Personalize as cores primária e de destaque do aplicativo.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ColorPicker label="Cor Primária" color={themeColors.primary} onChange={(c) => handleColorChange('primary', c)} />
                <ColorPicker label="Cor de Destaque" color={themeColors.accent} onChange={(c) => handleColorChange('accent', c)} />
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
                <button onClick={saveThemeColors} className="bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold py-2 px-4 rounded-md hover:bg-[var(--color-primary-hover)]">Salvar Cores</button>
                <button onClick={restoreDefaultColors} className="bg-slate-500 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-400">Restaurar Padrão</button>
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
              className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
             />
             <button
              onClick={handleTextImport}
              disabled={!customerText.trim()}
              className="mt-4 inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold py-2 px-4 rounded-md hover:bg-[var(--color-primary-hover)] transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
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