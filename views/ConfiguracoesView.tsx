// views/ConfiguracoesView.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { auth } from '../firebase';
import PageHeader from '../components/PageHeader';
import { CloudUploadIcon } from '../components/icons/CloudUploadIcon';
// FIX: Import Theme from types.ts to break circular dependency.
import { Theme, SavedUser } from '../types';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { InstallIcon } from '../components/icons/InstallIcon';
import { applyThemeColors, defaultColors, AppThemeColors } from '../utils/theme';
import { TrashIcon } from '../components/icons/TrashIcon';
import { UserIcon } from '../components/icons/UserIcon';
import { XIcon } from '../components/icons/XIcon';
import { LockClosedIcon } from '../components/icons/LockClosedIcon';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';

interface ConfiguracoesViewProps {
  onExportData: () => void;
  onMergeData: (file: File) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  deferredPrompt: any;
  onInstallPrompt: () => void;
  onDeleteAllData: () => void;
  onLogout: () => void;
  onSwitchAccount: (email: string) => void;
  onAddNewAccount: () => void;
  isPrivacyModeEnabled: boolean;
  onActivatePrivacyMode: () => void;
  onDeactivatePrivacyMode: () => void;
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
  theme,
  setTheme,
  showNotification,
  deferredPrompt,
  onInstallPrompt,
  onDeleteAllData,
  onLogout,
  onSwitchAccount,
  onAddNewAccount,
  isPrivacyModeEnabled,
  onActivatePrivacyMode,
  onDeactivatePrivacyMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);
  const currentUserEmail = auth.currentUser?.email;
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  useEffect(() => {
    try {
        const usersStr = localStorage.getItem('savedUsers');
        const users: SavedUser[] = usersStr ? JSON.parse(usersStr) : [];
        setSavedUsers(users.filter((user) => user.email !== currentUserEmail));
    } catch (error) {
        console.error("Failed to load saved users:", error);
    }
  }, [currentUserEmail]);
  
  useEffect(() => {
    const getStorageEstimate = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                setStorageInfo({
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 0,
                });
            } catch (error) {
                console.error('Erro ao estimar o armazenamento:', error);
                setStorageInfo(null);
            } finally {
                setIsLoadingStorage(false);
            }
        } else {
            console.log('API de estimativa de armazenamento não suportada.');
            setIsLoadingStorage(false);
            setStorageInfo(null);
        }
    };
    getStorageEstimate();
  }, []);

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
  
  const handleRemoveAccount = (emailToRemove: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja remover a conta '${emailToRemove}' da lista de acesso rápido?`);
    if (confirmed) {
      try {
        const usersStr = localStorage.getItem('savedUsers');
        const allUsers: SavedUser[] = usersStr ? JSON.parse(usersStr) : [];
        const newAllUsers = allUsers.filter(user => user.email !== emailToRemove);
        localStorage.setItem('savedUsers', JSON.stringify(newAllUsers));
        setSavedUsers(newAllUsers.filter(user => user.email !== currentUserEmail));
        showNotification(`Conta ${emailToRemove} removida da lista.`, 'success');
      } catch(e) {
        console.error("Error removing account", e);
        showNotification('Erro ao remover conta.', 'error');
      }
    }
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
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
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Gerenciamento de Contas</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Conta Ativa</h3>
              <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-lime-500/20 rounded-full"><UserIcon className="w-6 h-6 text-lime-400"/></div>
                      <div>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Conectado como:</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{currentUserEmail}</p>
                      </div>
                  </div>
                  <button onClick={onLogout} className="w-full sm:w-auto bg-slate-500 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-400 transition-colors">
                    Sair
                  </button>
              </div>

              {savedUsers.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Outras contas salvas</h3>
                    <ul className="space-y-3">
                        {savedUsers.map(user => (
                            <li key={user.email} className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                                <span className="font-medium text-slate-700 dark:text-slate-300 break-all">{user.email}</span>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button onClick={() => handleRemoveAccount(user.email)} title="Remover da lista" className="flex-1 sm:flex-initial bg-red-600/20 text-red-400 font-bold py-2 px-3 rounded-md hover:bg-red-600/40 transition-colors"><XIcon className="w-5 h-5 mx-auto"/></button>
                                    <button onClick={() => onSwitchAccount(user.email)} className="flex-1 sm:flex-initial bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500 transition-colors text-sm">Trocar</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button onClick={onAddNewAccount} className="w-full sm:w-auto bg-lime-500 text-white font-bold py-2 px-4 rounded-md hover:bg-lime-600 transition-colors">
                    + Adicionar nova conta
                  </button>
              </div>

            </div>
        </section>

        {/* Security Section */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Segurança</h2>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Modo de Privacidade</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Oculte todos os valores financeiros do aplicativo. Um PIN será necessário para desbloquear a visualização dos valores temporariamente.
            </p>
            {isPrivacyModeEnabled ? (
              <button
                onClick={onDeactivatePrivacyMode}
                className="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                <LockClosedIcon className="w-5 h-5" />
                <span>Desativar Modo de Privacidade</span>
              </button>
            ) : (
              <button
                onClick={onActivatePrivacyMode}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors"
              >
                <LockClosedIcon className="w-5 h-5" />
                <span>Ativar Modo de Privacidade</span>
              </button>
            )}
          </div>
        </section>

        {/* Storage Section */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Armazenamento</h2>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <DatabaseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              Uso de Armazenamento Offline
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              O aplicativo armazena dados localmente para funcionar offline. Este é o espaço utilizado no seu dispositivo.
            </p>
            {isLoadingStorage ? (
              <p className="text-slate-500 dark:text-slate-400">Calculando uso de armazenamento...</p>
            ) : storageInfo && storageInfo.quota > 0 ? (
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Usado: {formatBytes(storageInfo.usage)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Total: {formatBytes(storageInfo.quota)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-lime-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${(storageInfo.usage / storageInfo.quota) * 100}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {((storageInfo.usage / storageInfo.quota) * 100).toFixed(2)}% utilizado
                </p>
              </div>
            ) : (
              <p className="text-amber-500 dark:text-amber-400">Não foi possível obter informações de armazenamento do seu navegador.</p>
            )}
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
             <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button onClick={restoreDefaultColors} className="flex-1 bg-slate-500 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-400">Restaurar Padrão</button>
                <button onClick={saveThemeColors} className="flex-1 bg-lime-500 text-white font-bold py-2 px-4 rounded-md hover:bg-lime-600">Salvar Cores</button>
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

         {/* Danger Zone Section */}
        <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Zona de Perigo</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border-2 border-red-500 dark:border-red-700">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Apagar Todos os Dados</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Esta ação é <strong className="font-bold">permanente e irreversível</strong>. Todos os seus clientes, cobranças, despesas e históricos serão excluídos da sua conta.
              </p>
              <button
                onClick={onDeleteAllData}
                className="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
                <span>Apagar Tudo Permanentemente</span>
              </button>
            </div>
        </section>
      </div>
    </>
  );
};

export default ConfiguracoesView;