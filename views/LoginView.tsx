// views/LoginView.tsx
import React, { useState } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { LogoIcon } from '../components/icons/LogoIcon';

interface LoginViewProps {
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const LoginView: React.FC<LoginViewProps> = ({ showNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showNotification('Login realizado com sucesso!', 'success');
    } catch (error: any) {
      console.error(error);
      let message = 'Ocorreu um erro.';
      if (error.code === 'auth/invalid-login-credentials') {
        message = 'E-mail ou senha incorretos.';
      }
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <LogoIcon className="h-24 w-auto" />
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          Bem-vindo de volta!
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
          Acesse para sincronizar seus dados.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-lime-500 text-white font-bold py-3 px-6 rounded-md hover:bg-lime-600 disabled:bg-slate-500 transition-colors"
          >
            {isSubmitting ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Para criar uma conta, entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
};

export default LoginView;