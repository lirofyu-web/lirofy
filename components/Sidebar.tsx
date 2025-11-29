import React from 'react';
import { View } from '../App';
import { HomeIcon } from './icons/HomeIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { LogoIcon } from './icons/LogoIcon';
import { MapIcon } from './icons/MapIcon';
import { CogIcon } from './icons/CogIcon'; // New Icon

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
    { view: 'DASHBOARD' as View, label: 'Dashboard', icon: HomeIcon },
    { view: 'CLIENTES' as View, label: 'Clientes', icon: UsersIcon },
    { view: 'COBRANCAS' as View, label: 'Cobranças', icon: ReceiptIcon },
    { view: 'DESPESAS' as View, label: 'Despesas', icon: CalculatorIcon },
    { view: 'ROTAS' as View, label: 'Rotas', icon: MapIcon },
    { view: 'RELATORIOS' as View, label: 'Relatórios', icon: ChartBarIcon },
];

const secondaryNavItems = [
    { view: 'CONFIGURACOES' as View, label: 'Configurações', icon: CogIcon },
]

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen }) => {
    
    const handleViewChange = (view: View) => {
        setView(view);
        setIsOpen(false); // Close sidebar on navigation in mobile
    };
    
    const NavButton: React.FC<{item: {view: View, label: string, icon: React.FC<any>}}> = ({ item }) => {
        const Icon = item.icon;
        const isActive = currentView === item.view;
        return (
             <li key={item.view} className="mb-2">
                <button 
                    onClick={() => handleViewChange(item.view)}
                    className={`w-full flex items-center rounded-md p-3 transition-colors text-sm font-medium ${
                        isActive 
                        ? 'bg-emerald-600 text-white shadow-lg' 
                        : 'text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <Icon className="w-5 h-5 mr-4" />
                    <span>{item.label}</span>
                </button>
            </li>
        );
    };


    return (
        <>
            {/* Overlay for mobile */}
            <div
                onClick={() => setIsOpen(false)}
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            ></div>

            <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 p-4 flex flex-col border-r border-slate-200 dark:border-slate-700 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 no-print ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="mb-8 text-center flex flex-col items-center">
                    <LogoIcon className="w-20 h-20 text-slate-700 dark:text-slate-300" />
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-2">Montanha Bilhar <span className="text-emerald-500 dark:text-emerald-400">&</span> Jukebox</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">SISTEMA DE LOCAÇÃO E COBRANÇA</p>
                </div>
                <nav className="flex-grow">
                    <ul>
                        {navItems.map(item => <NavButton key={item.view} item={item} />)}
                    </ul>
                </nav>
                <div className="mt-auto">
                     <nav>
                        <ul>
                            {secondaryNavItems.map(item => <NavButton key={item.view} item={item} />)}
                        </ul>
                    </nav>
                    <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;