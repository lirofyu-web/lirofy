// views/ConfiguracoesView.tsx
import React from 'react';
import PageHeader from '../components/PageHeader';

// --- ICONS (inlined to avoid creating new files) ---
const GoogleDriveIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className || 'w-6 h-6'} fill="currentColor">
        <path d="M339 39l-114 198-114-198h228z" fill="#3777e3" /><path d="M111 43l114 198-171 298-54-94z" fill="#ffcf63" /><path d="M401 43l-54 94 54 94-171-298z" fill="#1aa260" /><path d="M401 43l-54 94-114 198h168z" />
    </svg>
);

interface ConfiguracoesViewProps {
    userProfile: any;
    onSignOut: () => void;
}

const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ userProfile, onSignOut }) => {
    return (
        <div>
            <PageHeader
                title="Configurações da Conta"
                subtitle="Gerencie sua sessão e dados de usuário."
            />

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 max-w-lg mx-auto">
                <h3 className="text-xl font-semibold text-white mb-6 border-b border-slate-700 pb-4">
                    Conta Conectada
                </h3>
                
                {userProfile ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                             {userProfile.photoLink && (
                                <img src={userProfile.photoLink} alt="Foto do perfil" className="w-16 h-16 rounded-full" />
                             )}
                            <div>
                                <p className="text-lg font-bold text-white">{userProfile.displayName}</p>
                                <p className="text-sm text-slate-400">{userProfile.emailAddress}</p>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm">
                            Todos os seus dados (clientes, cobranças, etc.) estão sendo salvos automaticamente e de forma segura na sua conta do Google Drive.
                        </p>

                        <div className="pt-6 border-t border-slate-700">
                             <button
                                onClick={onSignOut}
                                className="w-full bg-red-600 text-white font-bold py-2 px-6 rounded-md hover:bg-red-500 transition-colors"
                            >
                                Sair (Logout)
                            </button>
                             <p className="text-xs text-slate-500 mt-3 text-center">
                                Ao sair, você precisará fazer login novamente para acessar seus dados.
                            </p>
                        </div>

                    </div>
                ) : (
                     <p className="text-slate-400">
                        Não foi possível carregar as informações do usuário.
                    </p>
                )}
            </div>
        </div>
    );
};

export default ConfiguracoesView;
