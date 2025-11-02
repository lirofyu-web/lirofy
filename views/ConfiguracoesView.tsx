// views/ConfiguracoesView.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import { Customer, Billing, Expense, DebtPayment } from '../types';

// --- ICONS (inlined to avoid creating new files) ---
const GoogleDriveIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className || 'w-6 h-6'} fill="currentColor">
        <path d="M339 39l-114 198-114-198h228z" fill="#3777e3" /><path d="M111 43l114 198-171 298-54-94z" fill="#ffcf63" /><path d="M401 43l-54 94 54 94-171-298z" fill="#1aa260" /><path d="M401 43l-54 94-114 198h168z" />
    </svg>
);
const CloudDownloadIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const SyncingIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5 animate-spin"}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
const CheckCircleIcon = ({ className }: { className?: string }) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-5 h-5'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);
const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-5 h-5'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);


// --- Google Drive Logic (Hook) ---
const useGoogleDriveSync = () => {
    const [gapi, setGapi] = useState<any>(null);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [status, setStatus] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');

    const API_KEY = 'AIzaSyDiSMwt9hwZrE0Jvt_OGDnxyxWdADupvj8';
    const CLIENT_ID: string = '998744714177-bvvgdulte02cjkg5ijtm19udthuvcjm8.apps.googleusercontent.com';
    const SCOPES = 'https://www.googleapis.com/auth/drive.file';
    const FILENAME = 'montanha_bilhar_data.json';

    useEffect(() => {
        const gapiUrl = 'https://apis.google.com/js/api.js';
        const gisUrl = 'https://accounts.google.com/gsi/client';

        const loadScript = (src: string) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve(true);
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.defer = true;
                script.onload = () => resolve(true);
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                document.body.appendChild(script);
            });
        };

        Promise.all([loadScript(gapiUrl), loadScript(gisUrl)])
            .then(() => {
                (window as any).gapi.load('client', () => {
                    setGapi((window as any).gapi);
                });
            })
            .catch(error => {
                console.error(error);
                setStatus('ERROR');
            });
    }, []);
    
    useEffect(() => {
        if (gapi && (window as any).google?.accounts?.oauth2 && CLIENT_ID !== 'YOUR_GOOGLE_DRIVE_CLIENT_ID') {
            gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            }).then(() => {
                const client = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: async (tokenResponse: any) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            gapi.client.setToken(tokenResponse);
                            setIsSignedIn(true);
                            try {
                                const profile = await gapi.client.drive.about.get({ fields: 'user' });
                                setUserProfile(profile.result.user);
                            } catch (e) {
                                console.error("Error fetching user profile", e)
                            }
                        }
                    },
                });
                setTokenClient(client);
                setStatus('READY');
            }).catch(() => setStatus('ERROR'));
        } else if (CLIENT_ID === 'YOUR_GOOGLE_DRIVE_CLIENT_ID') {
            setStatus('READY'); 
        }
    }, [gapi, API_KEY, CLIENT_ID]);

    const signIn = () => {
        if (!tokenClient) return;
        tokenClient.requestAccessToken({ prompt: 'consent' });
    };

    const signOut = () => {
        if (gapi) {
            const token = gapi.client.getToken();
            if (token) {
                (window as any).google.accounts.oauth2.revoke(token.access_token, () => {});
                gapi.client.setToken(null);
            }
        }
        setIsSignedIn(false);
        setUserProfile(null);
    };

    const findFile = async (): Promise<string | null> => {
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${FILENAME}' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name)',
            });
            const files = response.result.files;
            return files.length > 0 ? files[0].id : null;
        } catch (error) {
            console.error("Error finding file:", error);
            return null;
        }
    };

    const loadFile = async (): Promise<string | null> => {
        const fileId = await findFile();
        if (!fileId) {
            alert("Nenhum arquivo de backup encontrado no seu Google Drive.");
            return null;
        }
        try {
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media',
            });
            return response.body;
        } catch (error) {
            console.error("Error loading file:", error);
            alert("Erro ao carregar dados do Google Drive.");
            return null;
        }
    };
    
    const saveFile = async (content: string): Promise<boolean> => {
        const fileId = await findFile();
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const metadata = { name: FILENAME, mimeType: 'application/json' };
        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            content +
            close_delim;
        
        try {
            const path = fileId ? `/upload/drive/v3/files/${fileId}` : '/upload/drive/v3/files';
            const method = fileId ? 'PATCH' : 'POST';

            await gapi.client.request({
                path: path,
                method: method,
                params: { uploadType: 'multipart' },
                headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                body: multipartRequestBody,
            });
            return true;
        } catch (error) {
            console.error("Error saving file:", error);
            return false;
        }
    };

    return { signIn, signOut, loadFile, saveFile, isSignedIn, userProfile, status, isConfigured: CLIENT_ID && CLIENT_ID !== 'YOUR_GOOGLE_DRIVE_CLIENT_ID' };
};

// --- Helper Components ---
type SyncStatus = 'UNSAVED' | 'SYNCING' | 'SYNCED' | 'ERROR';

const SyncStatusIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
    const statusConfig = {
        UNSAVED: { text: "Alterações pendentes", color: "text-amber-400", Icon: ExclamationTriangleIcon },
        SYNCING: { text: "Salvando automaticamente...", color: "text-sky-400", Icon: SyncingIcon },
        SYNCED: { text: "Todos os dados foram salvos", color: "text-emerald-400", Icon: CheckCircleIcon },
        ERROR: { text: "Erro ao salvar. Verifique a conexão.", color: "text-red-400", Icon: ExclamationTriangleIcon },
    };

    const { text, color, Icon } = statusConfig[status];

    return (
        <div className={`flex items-center gap-3 p-3 rounded-md bg-slate-700/50 border border-slate-600 ${color}`}>
            <Icon className={`w-5 h-5 ${status === 'SYNCING' ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{text}</span>
        </div>
    );
};

const TroubleshootingGuide = () => {
    const [origin, setOrigin] = useState('');
    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    if (!origin) return null;

    return (
        <div className="mt-8 pt-6 border-t border-slate-700">
            <h4 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span>Solução de Problemas: Erro de Autorização</span>
            </h4>
            <div className="text-slate-400 bg-slate-700/50 p-4 rounded-md text-sm space-y-4">
                <p>
                    O erro <code className="bg-slate-800 text-red-300 px-1 py-0.5 rounded text-xs font-mono">Erro 400: invalid_request</code> que você está vendo significa que o Google está bloqueando a tentativa de login por segurança.
                </p>
                <p>
                    <strong>A solução é simples:</strong> você precisa informar ao Google que a URL deste aplicativo é segura e autorizada.
                </p>
                <div className="space-y-2">
                    <p className="font-bold text-slate-200">Siga estes 4 passos exatamente:</p>
                    <ol className="list-decimal list-inside space-y-3 pl-2">
                        <li>
                            Acesse a página de <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 font-semibold">Credenciais da API do Google</a>.
                        </li>
                        <li>
                            Na seção "IDs de cliente OAuth 2.0", encontre e clique no ID do cliente que você está usando para este app.
                        </li>
                        <li>
                            Role a página até a seção <strong className="text-slate-300">"Origens JavaScript autorizadas"</strong> e clique em <strong className="text-slate-300">"+ ADICIONAR URI"</strong>.
                        </li>
                        <li>
                            No campo de texto que aparecer, cole <strong className="text-amber-300">exatamente</strong> a URL abaixo:
                            <div className="mt-2">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={origin} 
                                    className="w-full bg-slate-800 border border-slate-600 rounded-md py-1.5 px-3 text-white font-mono"
                                    onClick={(e) => {
                                        (e.target as HTMLInputElement).select();
                                        navigator.clipboard.writeText(origin).catch(err => console.error('Falha ao copiar:', err));
                                    }}
                                />
                                <small className="text-slate-500">Clique no campo para selecionar e copiar a URL.</small>
                            </div>
                        </li>
                    </ol>
                </div>
                <p className="pt-3 border-t border-slate-600/50">
                    Após salvar a alteração no painel do Google, <strong className="text-slate-300">aguarde cerca de 5 minutos</strong> e tente conectar novamente. Às vezes, a mudança pode levar um tempo para ser aplicada.
                </p>
            </div>
        </div>
    );
};


// --- Main Component ---
interface AppData {
  customers: Customer[];
  billings: Billing[];
  expenses: Expense[];
  debtPayments: DebtPayment[];
}
interface ConfiguracoesViewProps {
    appData: AppData;
    onRestore: (data: AppData) => void;
    isDataDirty: boolean;
    onSyncComplete: () => void;
}

const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ appData, onRestore, isDataDirty, onSyncComplete }) => {
    const { signIn, signOut, loadFile, saveFile, isSignedIn, userProfile, status, isConfigured } = useGoogleDriveSync();
    const [isLoadInProgress, setIsLoadInProgress] = useState(false);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('SYNCED');
    const debounceTimeoutRef = useRef<number | null>(null);

    const handleAutomaticSave = useCallback(async () => {
        setSyncStatus('SYNCING');
        const success = await saveFile(JSON.stringify(appData, null, 2));
        if (success) {
            onSyncComplete();
            setSyncStatus('SYNCED');
        } else {
            setSyncStatus('ERROR');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appData, onSyncComplete, saveFile]);


    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (isDataDirty && isSignedIn) {
            setSyncStatus('UNSAVED');
            debounceTimeoutRef.current = window.setTimeout(() => {
                handleAutomaticSave();
            }, 2500); // Debounce time: 2.5 seconds
        } else if (!isDataDirty) {
            setSyncStatus('SYNCED');
        }

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [appData, isDataDirty, isSignedIn, handleAutomaticSave]);

    const handleLoad = async () => {
        setIsLoadInProgress(true);
        const content = await loadFile();
        if (content) {
            try {
                const parsedData = JSON.parse(content);
                onRestore(parsedData);
            } catch (e) {
                alert('O arquivo de backup no Google Drive parece estar corrompido.');
            }
        }
        setIsLoadInProgress(false);
    };
    
    const isConfigMissing = !isConfigured;

    if (isConfigMissing && status === 'READY') {
        return (
             <div>
                <PageHeader title="Configurações e Sincronização" subtitle="Gerencie os dados da sua aplicação." />
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                    <h3 className="text-xl font-semibold text-white mb-4">Sincronização com Google Drive</h3>
                    <div className="text-amber-300 bg-amber-900/50 border border-amber-700 p-4 rounded-md text-sm">
                        <strong className="text-amber-200 block mb-2">Configuração Incompleta:</strong>
                        <p className="mb-3">Um <strong>Client ID</strong> do Google é necessário para a sincronização. Siga os passos abaixo:</p>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Acesse o <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-amber-200">Google Cloud Console</a>.</li>
                            <li>Crie um "ID do cliente OAuth 2.0" para um "Aplicativo da Web".</li>
                            <li>Copie o Client ID gerado.</li>
                            <li>Cole o ID no arquivo <code>views/ConfiguracoesView.tsx</code>, substituindo o valor de <code>'YOUR_GOOGLE_DRIVE_CLIENT_ID'</code>.</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <PageHeader
                title="Configurações e Sincronização"
                subtitle="Mantenha seus dados seguros com o salvamento automático no Google Drive."
            />

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Sincronização com Google Drive</h3>
                {status === 'LOADING' && <p className="text-slate-400">Iniciando serviço de sincronização...</p>}
                {status === 'ERROR' && <p className="text-red-400">Erro ao iniciar a API do Google. Verifique sua conexão e as configurações.</p>}
                
                {status === 'READY' && (
                    !isSignedIn ? (
                        <div>
                            <p className="text-slate-400 mb-6">
                                Conecte sua conta Google para salvar e carregar seus dados na nuvem, permitindo o acesso em múltiplos dispositivos. O salvamento será automático.
                            </p>
                            <button
                                onClick={signIn}
                                className="inline-flex items-center gap-3 bg-white text-slate-800 font-bold py-2 px-6 rounded-md hover:bg-slate-200 transition-colors shadow"
                            >
                                <GoogleDriveIcon className="w-5 h-5" />
                                <span>Conectar com Google Drive</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <p className="text-slate-300">Conectado como: <span className="font-bold text-white">{userProfile?.displayName}</span> ({userProfile?.emailAddress})</p>
                                 <button onClick={signOut} className="text-sm text-cyan-400 hover:text-cyan-300">
                                    Desconectar
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                               <h4 className="font-semibold text-white">Status da Sincronização</h4>
                               <SyncStatusIndicator status={syncStatus} />
                            </div>

                            <div className="pt-4 border-t border-slate-700">
                               <h4 className="font-semibold text-white mb-2">Restaurar Backup</h4>
                               <p className="text-slate-400 text-sm mb-4">
                                   Se precisar restaurar os dados de um backup anterior, use o botão abaixo. Isso substituirá todos os dados locais.
                               </p>
                               <button
                                    onClick={handleLoad}
                                    disabled={isLoadInProgress}
                                    className="inline-flex items-center justify-center gap-2 bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-500 transition-colors disabled:bg-slate-500 disabled:cursor-wait"
                                >
                                    <CloudDownloadIcon className="w-5 h-5" />
                                    <span>{isLoadInProgress ? 'Carregando...' : 'Carregar do Drive'}</span>
                                </button>
                            </div>
                        </div>
                    )
                )}
                {status === 'READY' && isConfigured && <TroubleshootingGuide />}
            </div>
        </div>
    );
};

export default ConfiguracoesView;