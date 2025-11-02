// components/AddCustomerForm.tsx
import React, { useState, useCallback } from 'react';
import { Customer } from '../types';
import CityAutocomplete from './CityAutocomplete';
import { PlusIcon } from './icons/PlusIcon';

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
    mesaNumero: '',
    relogioMesaNumero: '',
    relogioMesaAnterior: '0',
    valorFicha: '2.00',
    parteFirma: '50',
    parteCliente: '50',
    jukeboxNumero: '',
    relogioJukeboxNumero: '',
    relogioJukeboxAnterior: '0',
    porcentagemJukeboxFirma: '50',
    porcentagemJukeboxCliente: '50',
    linhaNumero: '',
    assinaturaFirma: '',
    assinaturaCliente: '',
};

// Extracted the FormField component to prevent it from being redefined on every render,
// which was causing the input to lose focus and the mobile keyboard to disappear.
const FormField: React.FC<{ 
  label: string; 
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; 
  required?: boolean; 
  step?: string;
  children?: React.ReactNode;
}> = ({ label, name, value, onChange, type = 'text', required = false, step, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        {children || <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} step={step} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />}
    </div>
);


const AddCustomerForm: React.FC<AddCustomerFormProps> = ({ onAddCustomer, isSaving }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
        const newState = { ...prev, [name]: value };
        const numericValue = parseInt(value, 10);

        if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
            const remaining = String(100 - numericValue);
            if (name === 'parteFirma') {
                newState.parteCliente = remaining;
            } else if (name === 'parteCliente') {
                newState.parteFirma = remaining;
            } else if (name === 'porcentagemJukeboxFirma') {
                newState.porcentagemJukeboxCliente = remaining;
            } else if (name === 'porcentagemJukeboxCliente') {
                newState.porcentagemJukeboxFirma = remaining;
            }
        }
        return newState;
    });
  }, []);

  const handleCityChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, cidade: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddCustomer({
        ...formData,
        relogioMesaAnterior: parseInt(formData.relogioMesaAnterior, 10) || 0,
        valorFicha: parseFloat(formData.valorFicha) || 0,
        parteFirma: parseInt(formData.parteFirma, 10) || 0,
        parteCliente: parseInt(formData.parteCliente, 10) || 0,
        relogioJukeboxAnterior: parseInt(formData.relogioJukeboxAnterior, 10) || 0,
        porcentagemJukeboxFirma: parseInt(formData.porcentagemJukeboxFirma, 10) || 0,
        porcentagemJukeboxCliente: parseInt(formData.porcentagemJukeboxCliente, 10) || 0,
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
            <FormField label="Nome Completo" name="name" required value={formData.name} onChange={handleChange} />
            <FormField label="CPF/RG" name="cpfRg" value={formData.cpfRg} onChange={handleChange} />
            <FormField label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} />
            <FormField label="Endereço" name="endereco" value={formData.endereco} onChange={handleChange} />
            <div>
                 <label htmlFor="cidade" className="block text-sm font-medium text-slate-300 mb-1">Cidade</label>
                 <CityAutocomplete id="cidade" value={formData.cidade} onChange={handleCityChange} required />
            </div>
            <FormField label="Número da Linha/Rota" name="linhaNumero" value={formData.linhaNumero} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-slate-700">
             <div>
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4 md:col-span-2">Mesa de Sinuca</h3>
                <div className="space-y-4">
                    <FormField label="Número da Mesa" name="mesaNumero" value={formData.mesaNumero} onChange={handleChange} />
                    <FormField label="Número do Relógio da Mesa" name="relogioMesaNumero" value={formData.relogioMesaNumero} onChange={handleChange} />
                    <FormField label="Leitura Anterior (Mesa)" name="relogioMesaAnterior" type="number" value={formData.relogioMesaAnterior} onChange={handleChange} />
                    <FormField label="Valor da Ficha (R$)" name="valorFicha" type="number" step="0.01" value={formData.valorFicha} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Parte da Firma (%)" name="parteFirma" type="number" value={formData.parteFirma} onChange={handleChange} />
                        <FormField label="Parte do Cliente (%)" name="parteCliente" type="number" value={formData.parteCliente} onChange={handleChange} />
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4 md:col-span-2">Jukebox</h3>
                <div className="space-y-4">
                    <FormField label="Número da Jukebox" name="jukeboxNumero" value={formData.jukeboxNumero} onChange={handleChange} />
                    <FormField label="Número do Relógio da Jukebox" name="relogioJukeboxNumero" value={formData.relogioJukeboxNumero} onChange={handleChange} />
                    <FormField label="Leitura Anterior (Jukebox)" name="relogioJukeboxAnterior" type="number" value={formData.relogioJukeboxAnterior} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="% da Firma (Jukebox)" name="porcentagemJukeboxFirma" type="number" value={formData.porcentagemJukeboxFirma} onChange={handleChange} />
                        <FormField label="% do Cliente (Jukebox)" name="porcentagemJukeboxCliente" type="number" value={formData.porcentagemJukeboxCliente} onChange={handleChange} />
                    </div>
                </div>
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