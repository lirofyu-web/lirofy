// views/AdesivosView.tsx
import React from 'react';
import { Adesivo } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusIcon } from '../components/icons/PlusIcon';

interface AdesivosViewProps {
  adesivos: Adesivo[];
  onAdd: () => void;
  onSelect: (adesivo: Adesivo) => void;
}

const AdesivosView: React.FC<AdesivosViewProps> = ({ adesivos, onAdd, onSelect }) => {
  const sortedAdesivos = React.useMemo(() => {
    // Sort stickers by number, handling numeric and alphanumeric sorting
    return [...adesivos].sort((a, b) => {
      return a.numero.localeCompare(b.numero, undefined, { numeric: true });
    });
  }, [adesivos]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Adesivos de Equipamentos"
        subtitle="Gerencie os adesivos com QR Code para seus equipamentos."
      />

      <div className="text-center">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold py-3 px-6 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors shadow-lg"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Adicionar Novo Adesivo</span>
        </button>
      </div>

      {sortedAdesivos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {sortedAdesivos.map(adesivo => (
            <button
              key={adesivo.id}
              onClick={() => onSelect(adesivo)}
              className="group bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-lime-500"
            >
              <div className="aspect-square bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <img
                  src={adesivo.imageUrl}
                  alt={`Adesivo ${adesivo.numero}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-3 text-center">
                <p className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-lime-500 transition-colors">
                  Nº {adesivo.numero}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            <p>Nenhum adesivo encontrado.</p>
            <p className="mt-2 text-sm">Clique em "Adicionar Novo Adesivo" para começar.</p>
        </div>
      )}
    </div>
  );
};

export default AdesivosView;
