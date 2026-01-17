// views/ConfiguracoesView.tsx
import React, { useState, useRef, useCallback } from 'react';
import { signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { auth } from '../firebase';
import PageHeader from '../components/PageHeader';
import { CloudUploadIcon } from '../components/icons/CloudUploadIcon';
import ActionModal from '../components/ActionModal';
import { Theme } from '../App';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { InstallIcon } from '../components/icons/InstallIcon';
import { applyThemeColors, defaultColors, AppThemeColors } from '../utils/theme';

interface ConfiguracoesViewProps {
  onExportData: () => void;
  onMergeData: (file: File) => void;
  onAddCustomerFromText: (text: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  deferredPrompt: any;
  onInstallPrompt: () => void;
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
  deferredPrompt,
  onInstallPrompt,
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
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onMergeData(file);
    }
    // Limpa o valor para permitir a seleção do mesmo arquivo novamente
    event.target.value = '';
  };

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

  const handleThemeChange = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const handleLogout = async () => {
    try {
        await signOut(auth);
        showNotification('Você saiu com sucesso.', 'success');
    } catch (error) {
        console.error("Erro ao sair: ", error);
        showNotification('Erro ao tentar sair.', 'error');
    }
  };
  
  return (
    <>
      <PageHeader
        title="Configurações e Dados"
        subtitle="Gerencie os dados do aplicativo, realize backups e importe informações."
      />

      <div className="space-y-12">
        {/* Account Section */}
        <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Conta</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Você está logado como: <strong className="text-slate-800 dark:text-slate-200">{auth.currentUser?.email}</strong>
              </p>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-500 transition-colors"
              >
                Sair (Logout)
              </button>
            </div>
        </section>


        {/* Install App Section */}
        {deferredPrompt && (
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Instalação do Aplicativo</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Instalar na Área de Trabalho</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Instale este aplicativo em seu computador ou celular para um acesso mais rápido e para habilitar funcionalidades offline, como um aplicativo nativo.
              </p>
              <button
                onClick={onInstallPrompt}
                className="inline-flex items-center gap-2 bg-lime-500 text-white font-bold py-2 px-4 rounded-md hover:bg-lime-600 transition-colors"
              >
                <InstallIcon className="w-5 h-5" />
                <span>Instalar Aplicativo</span>
              </button>
            </div>
          </section>
        )}
        
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
             <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button onClick={restoreDefaultColors} className="bg-slate-500 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-400">Restaurar Padrão</button>
                <button onClick={saveThemeColors} className="bg-lime-500 text-white font-bold py-2 px-4 rounded-md hover:bg-lime-600">Salvar Cores</button>
             </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Backup e Restauração</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Backup e Importação de Dados</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Exporte um backup de segurança. A importação <strong className="text-red-500">substituirá todos os dados atuais</strong> na nuvem. Use com cuidado.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={onExportData}
                  className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500 transition-colors"
                >
                  <CloudUploadIcon className="w-5 h-5 transform rotate-180" />
                  <span>Exportar Dados (Backup)</span>
                </button>
                <button
                  onClick={handleImportClick}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-500 transition-colors"
                >
                  <CloudUploadIcon className="w-5 h-5" />
                  <span>Importar e Substituir</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/json"
                  className="hidden"
                />
              </div>
            </div>
        </section>
      </div>
    </>
  );
};

export default ConfiguracoesView;