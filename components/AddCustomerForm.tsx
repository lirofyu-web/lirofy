// components/AddCustomerForm.tsx
import React, { useState } from 'react';
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


const AddCustomerForm: React.FC<AddCustomerFormProps> = ({ onAddCustomer, isSaving }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCityChange = (value: string) => {
    setFormData(prev => ({ ...prev, cidade: value }));
  }

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
  
  const FormField: React.FC<{ label: string; name: keyof typeof initialFormState; type?: string; required?: boolean; step?: string, children?: React.ReactNode}> = ({ label, name, type = 'text', required = false, step, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        {children || <input type={type} id={name} name={name} value={formData[name]} onChange={handleChange} required={required} step={step} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />}
    </div>
  );


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
            <FormField label="Nome Completo" name="name" required />
            <FormField label="CPF/RG" name="cpfRg" />
            <FormField label="Telefone" name="telefone" />
            <FormField label="Endereço" name="endereco" />
            <div>
                 <label htmlFor="cidade" className="block text-sm font-medium text-slate-300 mb-1">Cidade</label>
                 <CityAutocomplete id="cidade" value={formData.cidade} onChange={handleCityChange} required />
            </div>
            <FormField label="Número da Linha/Rota" name="linhaNumero" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-slate-700">
             <div>
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4 md:col-span-2">Mesa de Sinuca</h3>
                <div className="space-y-4">
                    <FormField label="Número da Mesa" name="mesaNumero" />
                    <FormField label="Número do Relógio da Mesa" name="relogioMesaNumero" />
                    <FormField label="Leitura Anterior (Mesa)" name="relogioMesaAnterior" type="number" />
                    <FormField label="Valor da Ficha (R$)" name="valorFicha" type="number" step="0.01" />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Parte da Firma (%)" name="parteFirma" type="number" />
                        <FormField label="Parte do Cliente (%)" name="parteCliente" type="number" />
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4 md:col-span-2">Jukebox</h3>
                <div className="space-y-4">
                    <FormField label="Número da Jukebox" name="jukeboxNumero" />
                    <FormField label="Número do Relógio da Jukebox" name="relogioJukeboxNumero" />
                    <FormField label="Leitura Anterior (Jukebox)" name="relogioJukeboxAnterior" type="number" />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="% da Firma (Jukebox)" name="porcentagemJukeboxFirma" type="number" />
                        <FormField label="% do Cliente (Jukebox)" name="porcentagemJukeboxCliente" type="number" />
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