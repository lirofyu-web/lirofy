
// components/EditCustomerModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Equipment } from '../types';
import CityAutocomplete from './CityAutocomplete';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';
import { CraneIcon } from './icons/CraneIcon';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customer: Customer) => Promise<void>;
  customer: Customer;
  isSaving: boolean;
}

const FormField: React.FC<{ 
  label: string; 
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; 
  required?: boolean; 
  step?: string;
}> = React.memo(({ label, name, value, onChange, type = 'text', required = false, step }) => (
    <div>
        <label htmlFor={`edit-${name}`} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input type={type} id={`edit-${name}`} name={name} value={value} onChange={onChange} required={required} step={step} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    </div>
));


const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ isOpen, onClose, onConfirm, customer, isSaving }) => {
  const [formData, setFormData] = useState<Omit<Customer, 'equipment'> & { equipment: Partial<Equipment>[] }>(customer);
  const [openEquipmentIndex, setOpenEquipmentIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
        setFormData(customer);
        if (customer.equipment?.length > 0) {
            setOpenEquipmentIndex(0);
        } else {
            setOpenEquipmentIndex(null);
        }
    }
  }, [customer, isOpen]);
  
  const handleBaseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEquipmentChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newEquipment = [...prev.equipment];
        const currentItem = { ...newEquipment[index], [name]: value };
        
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
            const remaining = String(100 - numericValue);
            if (name === 'parteFirma') {
                currentItem.parteCliente = remaining;
            } else if (name === 'parteCliente') {
                currentItem.parteFirma = remaining;
            } else if (name === 'porcentagemJukeboxFirma') {
                currentItem.porcentagemJukeboxCliente = remaining;
            } else if (name === 'porcentagemJukeboxCliente') {
                currentItem.porcentagemJukeboxFirma = remaining;
            }
        }

        newEquipment[index] = currentItem;
        return { ...prev, equipment: newEquipment };
    });
  }, []);

  const addEquipment = useCallback((type: 'mesa' | 'jukebox' | 'grua') => {
      let newEquipment: Partial<Equipment>;
      if (type === 'mesa') {
          newEquipment = { id: `new_${new Date().getTime()}`, type: 'mesa', numero: '', relogioNumero: '', relogioAnterior: 0, valorFicha: 2.00, parteFirma: 50, parteCliente: 50 };
      } else if (type === 'jukebox') {
          newEquipment = { id: `new_${new Date().getTime()}`, type: 'jukebox', numero: '', relogioNumero: '', relogioAnterior: 0, porcentagemJukeboxFirma: 50, porcentagemJukeboxCliente: 50 };
      } else { // grua
          newEquipment = { id: `new_${new Date().getTime()}`, type: 'grua', numero: '', relogioAnterior: 0, aluguelValor: 0, saldo: 0, reposicaoPelucia: 0, recebimentoEspecie: 0, recebimentoPix: 0 };
      }
      setFormData(prev => {
        const newEquipmentList = [...(prev.equipment || []), newEquipment];
        setOpenEquipmentIndex(newEquipmentList.length - 1);
        return { ...prev, equipment: newEquipmentList };
      });
  }, []);

  const removeEquipment = useCallback((index: number) => {
    setFormData(prev => ({...prev, equipment: prev.equipment.filter((_, i) => i !== index)}));
    setOpenEquipmentIndex(prevOpenIndex => {
      if (prevOpenIndex === index) {
        return null;
      }
      if (prevOpenIndex !== null && prevOpenIndex > index) {
        return prevOpenIndex - 1;
      }
      return prevOpenIndex;
    });
  }, []);

  const handleCityChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, cidade: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEquipment = formData.equipment.map(e => ({
        ...e,
        id: e.id!,
        type: e.type!,
        numero: e.numero || '',
        relogioNumero: e.relogioNumero || '',
        relogioAnterior: Number(e.relogioAnterior) || 0,
        valorFicha: Number(e.valorFicha) || 0,
        parteFirma: Number(e.parteFirma) || 0,
        parteCliente: Number(e.parteCliente) || 0,
        porcentagemJukeboxFirma: Number(e.porcentagemJukeboxFirma) || 0,
        porcentagemJukeboxCliente: Number(e.porcentagemJukeboxCliente) || 0,
        aluguelPercentual: Number(e.aluguelPercentual) || 0,
        aluguelValor: Number(e.aluguelValor) || 0,
        saldo: Number(e.saldo) || 0,
        quantidadePelucia: Number(e.quantidadePelucia) || 0,
        reposicaoPelucia: Number(e.reposicaoPelucia) || 0,
        recebimentoEspecie: Number(e.recebimentoEspecie) || 0,
        recebimentoPix: Number(e.recebimentoPix) || 0,
    }));
    
    await onConfirm({ ...formData, equipment: finalEquipment as Equipment[] });
  }, [formData, onConfirm]);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-customer-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 id="edit-customer-modal-title" className="text-2xl font-bold text-white">Editar Cliente</h2>
          <p className="text-slate-400">Alterando dados de: {customer.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4">Informações do Cliente</h3>
              </div>
              <FormField label="Nome Completo" name="name" required value={formData.name} onChange={handleBaseChange} />
              <FormField label="CPF/RG" name="cpfRg" value={formData.cpfRg} onChange={handleBaseChange}/>
              <FormField label="Telefone" name="telefone" value={formData.telefone} onChange={handleBaseChange} type="tel"/>
              <FormField label="Endereço" name="endereco" value={formData.endereco} onChange={handleBaseChange}/>
              <div>
                   <label htmlFor="edit-cidade" className="block text-sm font-medium text-slate-300 mb-1">Cidade</label>
                   <CityAutocomplete id="edit-cidade" value={formData.cidade} onChange={handleCityChange} required />
              </div>
              <FormField label="Número da Linha/Rota" name="linhaNumero" value={formData.linhaNumero} onChange={handleBaseChange}/>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Equipamentos</h3>
            <div className="space-y-2">
                {(formData.equipment || []).map((equip, index) => {
                    const EquipmentIcon = equip.type === 'mesa' ? BilliardIcon : equip.type === 'jukebox' ? JukeboxIcon : CraneIcon;
                    const equipmentTitle = equip.type === 'mesa' ? `Mesa de Sinuca` : equip.type === 'jukebox' ? `Jukebox` : `Grua de Pelúcia`;
                    
                    return (
                        <div key={equip.id} className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden transition-all duration-300">
                            <button
                                type="button"
                                onClick={() => setOpenEquipmentIndex(openEquipmentIndex === index ? null : index)}
                                className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-700/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                            >
                                <div className="flex items-center gap-3">
                                    <EquipmentIcon className="w-5 h-5 text-emerald-400" />
                                    <h4 className="text-md font-bold text-white capitalize">
                                        {equipmentTitle}: <span className="font-normal text-slate-300">{equip.numero || '(Novo)'}</span>
                                    </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); removeEquipment(index); }} className="text-slate-500 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${openEquipmentIndex === index ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {openEquipmentIndex === index && (
                                <div className="p-4 border-t border-slate-700 bg-slate-800/20">
                                    {equip.type === 'mesa' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField label="Número da Mesa" name="numero" value={String(equip.numero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Nº Relógio da Mesa" name="relogioNumero" value={String(equip.relogioNumero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Leitura Anterior" name="relogioAnterior" type="number" value={String(equip.relogioAnterior || '0')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Valor da Ficha (R$)" name="valorFicha" type="number" step="0.01" value={String(equip.valorFicha || '2.00')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Parte da Firma (%)" name="parteFirma" type="number" value={String(equip.parteFirma || '50')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Parte do Cliente (%)" name="parteCliente" type="number" value={String(equip.parteCliente || '50')} onChange={e => handleEquipmentChange(index, e)} />
                                        </div>
                                    ) : equip.type === 'jukebox' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField label="Número da Jukebox" name="numero" value={String(equip.numero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Nº Relógio da Jukebox" name="relogioNumero" value={String(equip.relogioNumero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Leitura Anterior" name="relogioAnterior" type="number" value={String(equip.relogioAnterior || '0')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="% da Firma" name="porcentagemJukeboxFirma" type="number" value={String(equip.porcentagemJukeboxFirma || '50')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="% do Cliente" name="porcentagemJukeboxCliente" type="number" value={String(equip.porcentagemJukeboxCliente || '50')} onChange={e => handleEquipmentChange(index, e)} />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField label="Número da Grua" name="numero" value={String(equip.numero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Leitura Anterior" name="relogioAnterior" type="number" value={String(equip.relogioAnterior || '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Qtd. Pelúcias (Capacidade)" name="quantidadePelucia" type="number" value={String(equip.quantidadePelucia ?? '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Aluguel (%)" name="aluguelPercentual" type="number" value={String(equip.aluguelPercentual ?? '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Aluguel Fixo (R$)" name="aluguelValor" type="number" step="0.01" value={String(equip.aluguelValor || '')} onChange={e => handleEquipmentChange(index, e)} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
                <button type="button" onClick={() => addEquipment('mesa')} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500">Adicionar Mesa</button>
                <button type="button" onClick={() => addEquipment('jukebox')} className="bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-md hover:bg-fuchsia-500">Adicionar Jukebox</button>
                <button type="button" onClick={() => addEquipment('grua')} className="bg-orange-600 text-white font-bold py-2 px-4 rounded-md hover:bg-orange-500">Adicionar Grua</button>
            </div>
        </div>
        </form>
        <div className="p-6 mt-auto bg-slate-800/50 rounded-b-lg flex justify-end gap-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={isSaving} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-500 transition-colors disabled:bg-slate-500 disabled:cursor-wait">
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default EditCustomerModal;
