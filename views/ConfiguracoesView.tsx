// views/ConfiguracoesView.tsx
import React, { useState, useRef, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { CloudUploadIcon } from '../components/icons/CloudUploadIcon';
import ActionModal from '../components/ActionModal';
import { Theme } from '../App';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { InstallIcon } from '../components/icons/InstallIcon';
import { applyThemeColors, defaultColors, AppThemeColors } from '../utils/theme';
import { BluetoothIcon } from '../components/icons/BluetoothIcon';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { SunmiIcon } from '../components/icons/SunmiIcon';

interface ConfiguracoesViewProps {
  onExportData: () => void;
  onMergeData: (file: File) => void;
  onAddCustomerFromText: (text: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  deferredPrompt: any;
  onInstallPrompt: () => void;
  // Bluetooth Printer Props
  btPrinterStatus: { isConnected: boolean; deviceName: string | null };
  onConnectBtPrinter: () => void;
  onDisconnectBtPrinter: () => void;
  onPrintTestPage: () => void;
  // Sunmi Printer Props
  isSunmiAvailable: boolean;
  onSunmiPrintTestPage: () => void;
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
  btPrinterStatus,
  onConnectBtPrinter,
  onDisconnectBtPrinter,
  onPrintTestPage,
  isSunmiAvailable,
  onSunmiPrintTestPage,
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

  const handleManualSwRegister = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                showNotification('Service Worker registrado com sucesso!', 'success');
                console.log('Service Worker registered successfully from manual trigger:', registration.scope);
            })
            .catch(error => {
                showNotification('Falha ao registrar o Service Worker.', 'error');
                console.error('Service Worker registration failed from manual trigger:', error);
            });
    } else {
        showNotification('Service Workers não são suportados neste navegador.', 'error');
    }
  };
  
  return (
    <>
      <PageHeader
        title="Configurações e Dados"
        subtitle="Gerencie os dados do aplicativo, realize backups e importe informações."
      />

      <div className="space-y-12">
        {/* Printer Section */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Impressoras</h2>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Impressora Interna (POS Android / Sunmi)</h3>
            {isSunmiAvailable ? (
              <p className="text-green-600 dark:text-green-400 mb-4">
                Impressora interna detectada e pronta para uso.
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Nenhuma impressora interna (Sunmi) foi detectada neste dispositivo.
              </p>
            )}
            {isSunmiAvailable && (
                <div className="mt-4">
                    <button onClick={onSunmiPrintTestPage} className="inline-flex items-center gap-2 bg-orange-600 text-white font-bold py-2 px-4 rounded-md hover:bg-orange-500">
                        <SunmiIcon className="w-5 h-5" /> Imprimir Página de Teste
                    </button>
                </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Impressora Térmica Bluetooth</h3>
            {btPrinterStatus.isConnected ? (
              <p className="text-green-600 dark:text-green-400 mb-4">
                Conectado a: <strong>{btPrinterStatus.deviceName || 'Dispositivo Desconhecido'}</strong>
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Nenhuma impressora conectada. Conecte-se para imprimir recibos térmicos diretamente.
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              {!btPrinterStatus.isConnected ? (
                <button onClick={onConnectBtPrinter} className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500">
                  <BluetoothIcon className="w-5 h-5" /> Conectar Impressora
                </button>
              ) : (
                <>
                  <button onClick={onDisconnectBtPrinter} className="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-500">
                    <BluetoothIcon className="w-5 h-5" /> Desconectar
                  </button>
                  <button onClick={onPrintTestPage} className="inline-flex items-center gap-2 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500">
                    <PrinterIcon className="w-5 h-5" /> Imprimir Teste
                  </button>
                </>
              )}
            </div>
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
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Gerenciamento de Dados</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Backup e Restauração</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Exporte todos os seus dados para um arquivo de backup ou importe um arquivo existente para mesclar com os dados atuais.
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
                  <span>Importar e Mesclar Dados</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".json"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Importar Cliente por Texto (JSON)</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Cole os dados de um cliente no formato JSON (copiado de outro dispositivo) para adicioná-lo rapidamente.
              </p>
              <textarea
                value={customerText}
                onChange={(e) => setCustomerText(e.target.value)}
                placeholder='Cole o JSON do cliente aqui...'
                rows={5}
                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <div className="text-right mt-4">
                <button
                  onClick={handleTextImport}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-500 transition-colors"
                >
                  <CloudUploadIcon className="w-5 h-5" />
                  <span>Adicionar Cliente</span>
                </button>
              </div>
            </div>
        </section>

         {/* Advanced Section */}
        <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Avançado</h2>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Service Worker</h3>
                 <p className="text-slate-500 dark:text-slate-400 mb-4">
                    O Service Worker é responsável pela funcionalidade offline. Se o aplicativo não estiver funcionando sem internet, tente registrá-lo novamente.
                 </p>
                 <button
                    onClick={handleManualSwRegister}
                    className="bg-amber-600 text-white font-bold py-2 px-4 rounded-md hover:bg-amber-500"
                >
                    Forçar Registro do Service Worker
                </button>
             </div>
        </section>

      </div>

      <ActionModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={confirmImport}
        title="Importar e Mesclar Dados"
        confirmText="Sim, continuar"
      >
        <p>
          Tem certeza de que deseja importar um arquivo de backup? Os dados do arquivo serão mesclados com os dados existentes no aplicativo.
        </p>
        <p className="mt-2 font-semibold text-amber-600 dark:text-amber-400">
          Recomenda-se exportar um backup dos seus dados atuais antes de prosseguir.
        </p>
      </ActionModal>
    </>
  );
};

export default ConfiguracoesView;