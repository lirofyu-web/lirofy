// components/BillingSlipSheet.tsx
import React from 'react';
import { Customer, Equipment } from '../types';
import { UserIcon } from './icons/UserIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { PhoneIcon } from './icons/PhoneIcon';

const DateField: React.FC<{ label: string; className?: string }> = ({ label, className }) => (
    <div className={`flex items-baseline gap-2 text-sm ${className}`}>
        <label className="text-gray-500 whitespace-nowrap font-semibold">{label}:</label>
        <div className="w-10 border-b-2 border-black"></div>
        <span className="text-gray-500">/</span>
        <div className="w-10 border-b-2 border-black"></div>
        <span className="text-gray-500">/</span>
        <div className="w-16 border-b-2 border-black"></div>
    </div>
);

const DottedField: React.FC<{ label: string; className?: string }> = ({ label, className }) => (
    <div className={`flex items-end gap-2 text-sm ${className}`}>
        <label className="text-gray-500 whitespace-nowrap font-semibold">{label}:</label>
        <div className="flex-grow border-b-2 border-dotted border-gray-400 h-6"></div>
    </div>
);

const FilledField: React.FC<{ label: string; value: string | number | null; icon?: React.ReactNode; className?: string; valueClassName?: string }> = ({ label, value, icon, className, valueClassName }) => (
     <div className={`flex items-center gap-2 text-xs ${className}`}>
        {icon && <div className="text-gray-500">{icon}</div>}
        <div className="flex-grow flex items-baseline gap-1.5">
            <label className="text-gray-500 whitespace-nowrap">{label}:</label>
            <p className={`font-bold text-black truncate leading-tight ${valueClassName}`}>{value ?? '---'}</p>
        </div>
    </div>
);

const CheckboxField: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-black bg-white"></div>
        <span className="font-semibold text-gray-800">{label}</span>
    </div>
);


interface BillingSlipSheetProps {
  customer: Customer;
  equipment: Equipment;
  lastBillingAmount: number | null;
}

const BillingSlipSheet: React.FC<BillingSlipSheetProps> = ({ customer, equipment, lastBillingAmount }) => {
    return (
        <div className="bg-white text-black p-4 border border-gray-300 flex flex-col h-full font-sans">
            {/* Header */}
            <header className="flex justify-between items-baseline border-b-2 border-gray-800 pb-2 mb-3">
                <h1 className="text-base font-black tracking-tight" style={{ fontFamily: "'Times New Roman', serif" }}>MONTANHA BILHAR & JUKEBOX</h1>
                <p className="text-xs font-semibold text-gray-600 uppercase">{customer.cidade}</p>
            </header>
            
            {/* Customer & Equipment Info */}
            <section className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {/* Customer Info */}
                <FilledField label="Cliente" value={customer.name} icon={<UserIcon className="w-3.5 h-3.5"/>} valueClassName="text-sm" className="col-span-2"/>
                <FilledField label="Endereço" value={customer.endereco} icon={<LocationMarkerIcon className="w-3.5 h-3.5"/>} />
                <FilledField label="Telefone" value={customer.telefone} icon={<PhoneIcon className="w-3.5 h-3.5"/>} />
                
                {/* Equipment Info */}
                <FilledField label="Equip." value={`${equipment.type === 'mesa' ? 'Mesa' : 'Jukebox'} Nº ${equipment.numero}`} className="col-span-2 mt-1 pt-1 border-t border-gray-200" />
                
                {equipment.type === 'mesa' && equipment.billingType === 'monthly' && (
                    <FilledField 
                        label="Mensalidade Fixa" 
                        value={`R$ ${(equipment.monthlyFeeValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        className="col-span-2"
                        valueClassName="text-base"
                    />
                )}

                {equipment.type === 'mesa' && equipment.billingType !== 'monthly' && (
                    <>
                        <FilledField label="Vlr Ficha" value={`R$ ${(equipment.valorFicha ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                        <div />
                        <FilledField label="Firma" value={`${equipment.parteFirma ?? 0}%`} />
                        <FilledField label="Cliente" value={`${equipment.parteCliente ?? 0}%`} />
                    </>
                )}

                {equipment.type === 'jukebox' && (
                    <>
                        <FilledField label="Firma" value={`${equipment.porcentagemJukeboxFirma ?? 0}%`} />
                        <FilledField label="Cliente" value={`${equipment.porcentagemJukeboxCliente ?? 0}%`} />
                    </>
                )}
            </section>
            
            {/* Billing Section */}
            <section className="mt-2 pt-2 border-t-2 border-gray-400 space-y-3 flex-grow">
                <DateField label="Data da Cobrança" />
                 <div className="grid grid-cols-2 gap-x-6 items-end">
                    <FilledField label="Leit. Anterior" value={equipment.relogioAnterior} valueClassName="text-lg" />
                    <DottedField label="Leit. Atual" />
                 </div>
                 <DottedField label="Partidas Jogadas" />
                 
                 <div className="mt-3 pt-3 border-t border-dashed border-gray-400">
                    {equipment.type === 'mesa' && equipment.billingType === 'monthly' ? (
                        <div className="flex justify-between items-baseline text-lg font-bold text-sm">
                            <label className="text-gray-500 whitespace-nowrap font-semibold">R$ TOTAL A PAGAR:</label>
                            <p className="font-bold text-black text-lg">{`R$ ${(equipment.monthlyFeeValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
                        </div>
                    ) : (
                        <DottedField label="R$ TOTAL A PAGAR" className="text-lg font-bold" />
                    )}
                 </div>
            </section>
            
            {/* Payment & Footer */}
            <footer className="mt-3 pt-2 border-t-2 border-double border-gray-800 space-y-2">
                <div className="flex justify-around items-center text-sm">
                    <span className="font-bold text-gray-600">Forma de Pagamento:</span>
                    <CheckboxField label="Dinheiro" />
                    <CheckboxField label="PIX" />
                    <CheckboxField label="Negativo" />
                </div>
                <div className="grid grid-cols-2 gap-x-4 pt-2 border-t border-gray-200">
                    <FilledField label="Última Cobrança" value={lastBillingAmount !== null ? `R$ ${lastBillingAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'} />
                    {customer.debtAmount > 0 && (
                        <FilledField label="Saldo Devedor" value={`R$ ${customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueClassName="text-red-600" />
                    )}
                </div>
            </footer>
        </div>
    );
};

export default BillingSlipSheet;
