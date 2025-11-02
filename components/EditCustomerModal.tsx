
// components/EditCustomerModal.tsx
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import CityAutocomplete from './CityAutocomplete';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customer: Customer) => Promise<void>;
  customer: Customer;
  isSaving: boolean;
}

// Define FormField props for clarity
interface FormFieldProps {
  label: string;
  name: keyof Customer;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  step?: string;
  children?: React.ReactNode;
}

// FIX: Moved FormField outside the EditCustomerModal component.
// This prevents the component from being re-created on every render, which
// fixes an issue where mobile keyboards would disappear during input.
const FormField: React.FC<FormFieldProps> = ({ label, name, value, onChange, type = 'text', required = false, step, children }) => (
    <div>
        <label htmlFor={`edit-${name}`} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        {children || <input type={type} id={`edit-${name}`} name={name} value={value} onChange={onChange} required={required} step={step} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />}
    </div>
);


const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ isOpen, onClose, onConfirm, customer, isSaving }) => {
  const [formData, setFormData] = useState<Customer>(customer);

  useEffect(() => {
    // Reset form data when the modal is opened with a new customer
    setFormData(customer);
  }, [customer, isOpen]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleCityChange = (value: string) => {
    setFormData(prev => ({ ...prev, cidade: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(formData);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Editar Cliente</h2>
          <p className="text-slate-400">Alterando dados de: {customer.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4">Informações do Cliente</h3>
              </div>
              <FormField label="Nome Completo" name="name" required value={formData.name} onChange={handleChange} />
              <FormField label="CPF/RG" name="cpfRg" value={formData.cpfRg} onChange={handleChange}/>
              <FormField label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange}/>
              <FormField label="Endereço" name="endereco" value={formData.endereco} onChange={handleChange}/>
              <div>
                   <label htmlFor="edit-cidade" className="block text-sm font-medium text-slate-300 mb-1">Cidade</label>
                   <CityAutocomplete id="edit-cidade" value={formData.cidade} onChange={handleCityChange} required />
              </div>
              <FormField label="Número da Linha/Rota" name="linhaNumero" value={formData.linhaNumero} onChange={handleChange}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-slate-700">
               <div>
                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4">Mesa de Sinuca</h3>
                  <div className="space-y-4">
                      <FormField label="Número da Mesa" name="mesaNumero" value={formData.mesaNumero} onChange={handleChange}/>
                      <FormField label="Número do Relógio da Mesa" name="relogioMesaNumero" value={formData.relogioMesaNumero} onChange={handleChange}/>
                      <FormField label="Leitura Anterior (Mesa)" name="relogioMesaAnterior" type="number" value={formData.relogioMesaAnterior} onChange={handleChange}/>
                      <FormField label="Valor da Ficha (R$)" name="valorFicha" type="number" step="0.01" value={formData.valorFicha} onChange={handleChange}/>
                      <div className="grid grid-cols-2 gap-4">
                          <FormField label="Parte da Firma (%)" name="parteFirma" type="number" value={formData.parteFirma} onChange={handleChange}/>
                          <FormField label="Parte do Cliente (%)" name="parteCliente" type="number" value={formData.parteCliente} onChange={handleChange}/>
                      </div>
                  </div>
              </div>
              <div>
                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4">Jukebox</h3>
                  <div className="space-y-4">
                      <FormField label="Número da Jukebox" name="jukeboxNumero" value={formData.jukeboxNumero} onChange={handleChange}/>
                      <FormField label="Número do Relógio da Jukebox" name="relogioJukeboxNumero" value={formData.relogioJukeboxNumero} onChange={handleChange}/>
                      <FormField label="Leitura Anterior (Jukebox)" name="relogioJukeboxAnterior" type="number" value={formData.relogioJukeboxAnterior} onChange={handleChange}/>
                      <div className="grid grid-cols-2 gap-4">
                          <FormField label="% da Firma (Jukebox)" name="porcentagemJukeboxFirma" type="number" value={formData.porcentagemJukeboxFirma} onChange={handleChange}/>
                          <FormField label="% do Cliente (Jukebox)" name="porcentagemJukeboxCliente" type="number" value={formData.porcentagemJukeboxCliente} onChange={handleChange}/>
                      </div>
                  </div>
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
