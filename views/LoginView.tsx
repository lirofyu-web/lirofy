// views/LoginView.tsx
import React from 'react';
import { LogoIcon } from '../components/icons/LogoIcon';

const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.317-11.28-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.24 44 30.022 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);


interface LoginViewProps {
    onSignIn: () => void;
    isConfigured: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onSignIn, isConfigured }) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-4">
            <div className="text-center">
                <LogoIcon className="w-28 h-28 text-slate-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white">Montanha Bilhar & Jukebox</h1>
                <p className="text-slate-400 mt-2">Seu painel de gestão na nuvem.</p>
            </div>

            <div className="mt-12 w-full max-w-xs">
                {isConfigured ? (
                     <button
                        onClick={onSignIn}
                        className="w-full inline-flex items-center justify-center gap-3 bg-white text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors shadow-lg"
                    >
                        <GoogleIcon className="w-5 h-5" />
                        <span>Entrar com Google</span>
                    </button>
                ) : (
                    <div className="text-center text-amber-300 bg-amber-900/50 border border-amber-700 p-4 rounded-md text-sm">
                        <strong className="text-amber-200 block mb-2">Configuração Incompleta:</strong>
                        <p>A funcionalidade de login está desabilitada. As credenciais da API do Google não foram configuradas corretamente no código-fonte da aplicação.</p>
                    </div>
                )}
            </div>
             <div className="absolute bottom-4 text-center text-xs text-slate-600">
                <p>&copy; {new Date().getFullYear()} Todos os direitos reservados.</p>
            </div>
        </div>
    );
};

export default LoginView;
