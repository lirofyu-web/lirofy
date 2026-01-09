// views/EquipamentosView.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Customer, Equipment, Billing } from '../types';
import PageHeader from '../components/PageHeader';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import { QrCodeIcon } from '../components/icons/QrCodeIcon';
import { CurrencyDollarIcon } from '../components/icons/CurrencyDollarIcon';
import EquipmentQrCodeModal from '../components/EquipmentQrCodeModal';


interface EquipamentosViewProps {
  customers: Customer[];
  billings: Billing[];
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

type EquipmentWithCustomer = Equipment & {
  customerName: string;
  customerId: string;
};

const EquipmentCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  equipments: EquipmentWithCustomer[];
  billings: Billing[];
  type: Equipment['type'];
  onGenerateLabel: (equipment: EquipmentWithCustomer) => void;
}> = ({ title, icon, equipments, billings, type, onGenerateLabel }) => {
    const equipmentWithRevenue = useMemo(() => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const relevantBillings = billings.filter(b => 
            new Date(b.settledAt) >= sixMonthsAgo && b.equipmentType === type
        );

        return equipments.map(equip => {
            const equipBillings = relevantBillings.filter(b => b.equipmentId === equip.id);
            const revenue = equipBillings.reduce((sum, b) => {
                const billingRevenue = (b.equipmentType === 'grua') ? b.valorTotal : b.valorTotal - (b.valorPagoFiado || 0);
                return sum + billingRevenue;
            }, 0);
            return { ...equip, revenue };
        });

    }, [equipments, billings, type]);

    const totalSixMonthRevenue = useMemo(() => {
        return equipmentWithRevenue.reduce((sum, equip) => sum + equip.revenue, 0);
    }, [equipmentWithRevenue]);
  
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-2">
          {icon}
          {title} ({equipments.length})
        </h3>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 flex-grow">
          {equipmentWithRevenue.length > 0 ? (
            equipmentWithRevenue.map(equip => (
              <div key={equip.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-start gap-4">
                <div className="flex-grow">
                  <p className="font-bold text-slate-800 dark:text-white">Nº: {equip.numero}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 break-words">Cliente: {equip.customerName}</p>
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Arrecadado (6m)</p>
                    <p className="font-mono font-semibold text-sm text-lime-600 dark:text-lime-400">
                        R$ {equip.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onGenerateLabel(equip)}
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-slate-600 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-slate-500 mt-1"
                  title="Gerar Etiqueta com QR Code"
                >
                  <QrCodeIcon className="w-4 h-4" />
                  <span>Etiqueta</span>
                </button>
              </div>
            ))
          ) : (
            <p className="text-center py-6 text-slate-500 dark:text-slate-400 italic">Nenhum equipamento deste tipo cadastrado.</p>
          )}
        </div>
         <div className="mt-4 pt-4 border-t border-dashed border-slate-300 dark:border-slate-600">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Arrecadado (últimos 6 meses)</p>
            <p className="font-mono font-bold text-lg text-lime-600 dark:text-lime-400">
                R$ {totalSixMonthRevenue.toFixed(2)}
            </p>
        </div>
      </div>
    );
};

const GrandTotalCard: React.FC<{ billings: Billing[] }> = ({ billings }) => {
    const grandTotal = useMemo(() => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        return billings
            .filter(b => new Date(b.settledAt) >= sixMonthsAgo)
            .reduce((sum, b) => {
                const revenue = (b.equipmentType === 'grua') ? b.valorTotal : b.valorTotal - (b.valorPagoFiado || 0);
                return sum + revenue;
            }, 0);
    }, [billings]);

    return (
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-2">
                <CurrencyDollarIcon className="w-6 h-6 text-amber-500" />
                Resumo Geral de Arrecadação
            </h3>
            <div className="text-center">
                <p className="text-base text-slate-500 dark:text-slate-400">Total arrecadado nos últimos 6 meses (todos os equipamentos)</p>
                <p className="font-mono font-black text-4xl text-lime-600 dark:text-lime-400 mt-2">
                    R$ {grandTotal.toFixed(2)}
                </p>
            </div>
        </div>
    );
};


const EquipamentosView: React.FC<EquipamentosViewProps> = ({ customers, billings, showNotification }) => {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithCustomer | null>(null);

  const allEquipment = useMemo(() => {
    const flatList: EquipmentWithCustomer[] = customers.flatMap(customer =>
      customer.equipment.map(equip => ({
        ...equip,
        customerName: customer.name,
        customerId: customer.id,
      }))
    ).sort((a,b) => (a.numero || '').localeCompare(b.numero || ''));

    return {
      mesas: flatList.filter(e => e.type === 'mesa'),
      jukeboxes: flatList.filter(e => e.type === 'jukebox'),
      gruas: flatList.filter(e => e.type === 'grua'),
    };
  }, [customers]);

  const handleGenerateLabel = useCallback((equipment: EquipmentWithCustomer) => {
    setSelectedEquipment(equipment);
  }, []);

  return (
    <>
      <PageHeader
        title="Inventário e Desempenho"
        subtitle="Visualize seus equipamentos, clientes associados e histórico de arrecadação."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <EquipmentCard
          title="Mesas de Sinuca"
          icon={<BilliardIcon className="w-6 h-6 text-cyan-500" />}
          equipments={allEquipment.mesas}
          billings={billings}
          type="mesa"
          onGenerateLabel={handleGenerateLabel}
        />
        <EquipmentCard
          title="Jukeboxes"
          icon={<JukeboxIcon className="w-6 h-6 text-fuchsia-500" />}
          equipments={allEquipment.jukeboxes}
          billings={billings}
          type="jukebox"
          onGenerateLabel={handleGenerateLabel}
        />
        <EquipmentCard
          title="Gruas de Pelúcia"
          icon={<CraneIcon className="w-6 h-6 text-orange-500" />}
          equipments={allEquipment.gruas}
          billings={billings}
          type="grua"
          onGenerateLabel={handleGenerateLabel}
        />
        <GrandTotalCard billings={billings} />
      </div>

      {selectedEquipment && (
        <EquipmentQrCodeModal
          isOpen={!!selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          equipment={selectedEquipment}
          showNotification={showNotification}
        />
      )}
    </>
  );
};

export default EquipamentosView;