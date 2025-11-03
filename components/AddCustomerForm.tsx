// components/AddCustomerForm.tsx
import React, { useState, useCallback } from 'react';
import { Customer, Equipment } from '../types';
import CityAutocomplete from './CityAutocomplete';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface AddCustomerFormProps {
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'latitude' | 'longitude' | 'lastVisitedAt'>) => Promise<void>;
  isSaving: boolean;
}

const initialFormState = {
    name: '',
    cpfRg: '',
    cidade: '',
    endereco: '',
    telefone: '',
    linhaNumero: '',
    assinaturaFirma: '',
    assinaturaCliente: '',
    equipment: [],
};

const FormField: React.FC<{ 
  label: string; 
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; 
  required?: boolean; 
  step?: string;
}> = React.memo(({ label, name, value, onChange, type = 'text', required = false, step }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} step={step} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    </div>
));


const AddCustomerForm: React.FC<AddCustomerFormProps> = ({ onAddCustomer, isSaving }) => {
  const [formData, setFormData] = useState<{
    name: string;
    cpfRg: string;
    cidade: string;
    endereco: string;
    telefone: string;
    linhaNumero: string;
    equipment: Partial<Equipment>[];
  }>(initialFormState);
  
  const [isOpen, setIsOpen] = useState(false);

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

  const addEquipment = useCallback((type: 'mesa' | 'jukebox') => {
      const newEquipment: Partial<Equipment> = type === 'mesa'
        ? { id: `new_${new Date().getTime()}`, type: 'mesa', numero: '', relogioNumero: '', relogioAnterior: 0, valorFicha: 2.00, parteFirma: 50, parteCliente: 50 }
        : { id: `new_${new Date().getTime()}`, type: 'jukebox', numero: '', relogioNumero: '', relogioAnterior: 0, porcentagemJukeboxFirma: 50, porcentagemJukeboxCliente: 50 };
      setFormData(prev => ({...prev, equipment: [...prev.equipment, newEquipment]}));
  }, []);

  const removeEquipment = useCallback((index: number) => {
    setFormData(prev => ({...prev, equipment: prev.equipment.filter((_, i) => i !== index)}));
  }, []);

  const handleCityChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, cidade: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
    }));

    await onAddCustomer({
        ...formData,
        equipment: finalEquipment,
        assinaturaFirma: '',
        assinaturaCliente: '',
    });
    setFormData(initialFormState);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
        <div className="text-center">
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-500 transition-colors shadow-lg"
            >
                <PlusIcon className="w-5 h-5" />
                <span>Adicionar Novo Cliente</span>
            </button>
        </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4">Informações do Cliente</h3>
            </div>
            <FormField label="Nome Completo" name="name" required value={formData.name} onChange={handleBaseChange} />
            <FormField label="CPF/RG" name="cpfRg" value={formData.cpfRg} onChange={handleBaseChange} />
            <FormField label="Telefone" name="telefone" value={formData.telefone} onChange={handleBaseChange} />
            <FormField label="Endereço" name="endereco" value={formData.endereco} onChange={handleBaseChange} />
            <div>
                 <label htmlFor="cidade" className="block text-sm font-medium text-slate-300 mb-1">Cidade</label>
                 <CityAutocomplete id="cidade" value={formData.cidade} onChange={handleCityChange} required />
            </div>
            <FormField label="Número da Linha/Rota" name="linhaNumero" value={formData.linhaNumero} onChange={handleBaseChange} />
        </div>

        <div className="pt-4 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Equipamentos</h3>
            <div className="space-y-6">
                {formData.equipment.map((equip, index) => (
                    <div key={equip.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-md font-bold text-emerald-400 capitalize">{equip.type === 'mesa' ? `Mesa de Sinuca #${index + 1}` : `Jukebox #${index + 1}`}</h4>
                            <button type="button" onClick={() => removeEquipment(index)} className="text-red-500 hover:text-red-400">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                        {equip.type === 'mesa' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Número da Mesa" name="numero" value={String(equip.numero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                <FormField label="Nº Relógio da Mesa" name="relogioNumero" value={String(equip.relogioNumero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                <FormField label="Leitura Anterior" name="relogioAnterior" type="number" value={String(equip.relogioAnterior || '0')} onChange={e => handleEquipmentChange(index, e)} />
                                <FormField label="Valor da Ficha (R$)" name="valorFicha" type="number" step="0.01" value={String(equip.valorFicha || '2.00')} onChange={e => handleEquipmentChange(index, e)} />
                                <FormField label="Parte da Firma (%)" name="parteFirma" type="number" value={String(equip.parteFirma || '50')} onChange={e => handleEquipmentChange(index, e)} />
                                <FormField label="Parte do Cliente (%)" name="parteCliente" type="number" value={String(equip.parteCliente || '50')} onChange={e => handleEquipmentChange(index, e)} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Número da Jukebox" name="numero" value={String(equip.numero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                <FormField label="Nº Relógio da Jukebox" name="relogioNumero" value={String(equip.relogioNumero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                <FormField label="Leitura Anterior" name="relogioAnterior" type="number" value={String(equip.relogioAnterior || '0')} onChange={e => handleEquipmentChange(index, e)} />
                                <FormField label="% da Firma" name="porcentagemJukeboxFirma" type="number" value={String(equip.porcentagemJukeboxFirma || '50')} onChange={e => handleEquipmentChange(index, e)} />
                                <FormField label="% do Cliente" name="porcentagemJukeboxCliente" type="number" value={String(equip.porcentagemJukeboxCliente || '50')} onChange={e => handleEquipmentChange(index, e)} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => addEquipment('mesa')} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500">Adicionar Mesa</button>
                <button type="button" onClick={() => addEquipment('jukebox')} className="bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-md hover:bg-fuchsia-500">Adicionar Jukebox</button>
            </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
          <button type="button" onClick={() => setIsOpen(false)} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">
            Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-500 disabled:bg-slate-500 disabled:cursor-wait">
            {isSaving ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomerForm;