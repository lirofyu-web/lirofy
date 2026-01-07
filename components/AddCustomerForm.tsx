// components/AddCustomerForm.tsx
import React, { useState, useCallback } from 'react';
import { Customer, Equipment } from '../types';
import CityAutocomplete from './CityAutocomplete';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';
import { CraneIcon } from './icons/CraneIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';

interface AddCustomerFormProps {
  customers: Customer[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'lastVisitedAt'>) => Promise<void>;
  isSaving: boolean;
  showNotification: (message: string, type?: 'success' | 'error') => void;
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
    latitude: null,
    longitude: null,
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
        <label htmlFor={name} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} step={step} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
    </div>
));


const AddCustomerForm: React.FC<AddCustomerFormProps> = ({ customers, onAddCustomer, isSaving, showNotification }) => {
  const [formData, setFormData] = useState<{
    name: string;
    cpfRg: string;
    cidade: string;
    endereco: string;
    telefone: string;
    linhaNumero: string;
    equipment: Partial<Equipment>[];
    latitude: number | null;
    longitude: number | null;
  }>(initialFormState);
  
  const [isOpen, setIsOpen] = useState(false);
  const [openEquipmentIndex, setOpenEquipmentIndex] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);


  const handleBaseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEquipmentChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newEquipment = [...prev.equipment];
        const currentItem = { ...newEquipment[index] };

        // Handle aluguelTipo switch for gruas
        if (name === 'aluguelTipo') {
            if (value === 'percentual') {
                currentItem.aluguelPercentual = currentItem.aluguelPercentual ?? 50;
                delete currentItem.aluguelValor;
            } else { // 'fixo'
                currentItem.aluguelValor = currentItem.aluguelValor ?? 0;
                delete currentItem.aluguelPercentual;
            }
        } else {
            // Handle all other field changes
            (currentItem as any)[name] = value;
        }
        
        // Handle billingType switch for mesas
        if(name === 'billingType' && value === 'monthly') {
          delete currentItem.valorFicha;
          delete currentItem.parteFirma;
          delete currentItem.parteCliente;
        } else if (name === 'billingType' && value === 'perPlay') {
          delete currentItem.monthlyFeeValue;
        }

        // Handle automatic percentage calculation
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
            const remaining = 100 - numericValue;
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
          newEquipment = { id: `new_${new Date().getTime()}`, type: 'mesa', billingType: 'perPlay', numero: '', relogioNumero: '', relogioAnterior: 0, valorFicha: 2.00, parteFirma: 50, parteCliente: 50, monthlyFeeValue: 0 };
      } else if (type === 'jukebox') {
          newEquipment = { id: `new_${new Date().getTime()}`, type: 'jukebox', numero: '', relogioNumero: '', relogioAnterior: 0, porcentagemJukeboxFirma: 50, porcentagemJukeboxCliente: 50 };
      } else { // grua
          newEquipment = { id: `new_${new Date().getTime()}`, type: 'grua', numero: '', relogioAnterior: 0, aluguelValor: 0, saldo: 0, reposicaoPelucia: 0, recebimentoEspecie: 0, recebimentoPix: 0 };
      }
      setFormData(prev => {
          const newEquipmentList = [...prev.equipment, newEquipment];
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

  const handleGeolocate = useCallback(async () => {
    if (!navigator.geolocation) {
        showNotification("Geolocalização não é suportada neste navegador.", "error");
        return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                if (!response.ok) {
                    throw new Error('Falha ao buscar endereço.');
                }
                const data = await response.json();
                
                if (data && data.address) {
                    const { road, house_number, city, town, village, state, suburb } = data.address;
                    const street = `${road || ''}${house_number ? `, ${house_number}` : ''}`;
                    const cityName = city || town || village || suburb || '';
                    const fullCity = `${cityName}, ${state || ''}`.replace(/^, |^ | ,$/g, '');

                    setFormData(prev => ({
                        ...prev,
                        endereco: street,
                        cidade: fullCity,
                        latitude,
                        longitude,
                    }));
                    showNotification("Endereço preenchido com sucesso!", "success");
                } else {
                    throw new Error("Não foi possível encontrar o endereço para esta localização.");
                }
            } catch (err) {
                console.error("Erro na geolocalização inversa:", err);
                showNotification(err instanceof Error ? err.message : "Erro desconhecido.", "error");
                // Still set lat/lon even if address fetch fails
                setFormData(prev => ({ ...prev, latitude, longitude }));
            } finally {
                setIsLocating(false);
            }
        },
        (error) => {
            let message = "Erro ao obter localização.";
            if (error.code === 1) message = "Permissão de localização negada.";
            showNotification(message, "error");
            setIsLocating(false);
        },
        { enableHighAccuracy: true }
    );
  }, [showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for unique equipment numbers
    const allExistingNumbers = new Set<string>();
    customers.forEach(c => {
        c.equipment.forEach(e => {
            if (e.numero) allExistingNumbers.add(e.numero);
        });
    });

    const formNumbers = new Set<string>();
    for (const equip of formData.equipment) {
        if (!equip.numero) continue;
        
        if (allExistingNumbers.has(equip.numero)) {
            showNotification(`O número de equipamento '${equip.numero}' já está em uso.`, "error");
            return;
        }
        if (formNumbers.has(equip.numero)) {
            showNotification(`Número de equipamento '${equip.numero}' duplicado neste formulário.`, "error");
            return;
        }
        formNumbers.add(equip.numero);
    }

    const finalEquipment: Equipment[] = formData.equipment.map(eq => {
      const base = {
        id: eq.id!,
        type: eq.type!,
        numero: eq.numero || '',
        relogioNumero: eq.relogioNumero || '',
        relogioAnterior: Number(eq.relogioAnterior) || 0,
      };

      if (eq.type === 'mesa') {
        const billingType = eq.billingType || 'perPlay';
        if (billingType === 'monthly') {
          return {
            ...base,
            billingType,
            monthlyFeeValue: Number(eq.monthlyFeeValue) || 0,
          };
        }
        return {
          ...base,
          billingType,
          valorFicha: Number(eq.valorFicha) || 0,
          parteFirma: Number(eq.parteFirma) || 0,
          parteCliente: Number(eq.parteCliente) || 0,
        };
      }
      if (eq.type === 'jukebox') {
        return {
          ...base,
          porcentagemJukeboxFirma: Number(eq.porcentagemJukeboxFirma) || 0,
          porcentagemJukeboxCliente: Number(eq.porcentagemJukeboxCliente) || 0,
        };
      }
      if (eq.type === 'grua') {
        return {
          ...base,
          aluguelPercentual: eq.aluguelPercentual != null ? Number(eq.aluguelPercentual) : undefined,
          aluguelValor: eq.aluguelValor != null ? Number(eq.aluguelValor) : undefined,
          saldo: Number(eq.saldo) || 0,
          quantidadePelucia: Number(eq.quantidadePelucia) || 0,
          reposicaoPelucia: Number(eq.reposicaoPelucia) || 0,
          recebimentoEspecie: Number(eq.recebimentoEspecie) || 0,
          recebimentoPix: Number(eq.recebimentoPix) || 0,
        };
      }
      return base as Equipment;
    });

    await onAddCustomer({
        name: formData.name,
        cpfRg: formData.cpfRg,
        cidade: formData.cidade,
        endereco: formData.endereco,
        telefone: formData.telefone,
        linhaNumero: formData.linhaNumero,
        equipment: finalEquipment,
        assinaturaFirma: '',
        assinaturaCliente: '',
        latitude: formData.latitude,
        longitude: formData.longitude,
    });
    setFormData(initialFormState);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
        <div className="text-center">
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 bg-lime-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-lime-600 transition-colors shadow-lg"
            >
                <PlusIcon className="w-5 h-5" />
                <span>Adicionar Novo Cliente</span>
            </button>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Informações do Cliente</h3>
            </div>
            <FormField label="Nome Completo" name="name" required value={formData.name} onChange={handleBaseChange} />
            <FormField label="CPF/RG" name="cpfRg" value={formData.cpfRg} onChange={handleBaseChange} />
            <FormField label="Telefone" name="telefone" value={formData.telefone} onChange={handleBaseChange} type="tel" />
            <div>
                <label htmlFor="endereco" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Endereço</label>
                <div className="relative flex items-center">
                    <input 
                        type="text" 
                        id="endereco" 
                        name="endereco" 
                        value={formData.endereco} 
                        onChange={handleBaseChange} 
                        className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 pl-3 pr-10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500" 
                    />
                    <button
                        type="button"
                        onClick={handleGeolocate}
                        disabled={isLocating}
                        className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-lime-400 disabled:text-slate-600 disabled:cursor-wait flex items-center"
                        title="Preencher endereço com localização atual"
                    >
                        {isLocating ? (
                            <svg className="animate-spin h-5 w-5 text-slate-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <LocationMarkerIcon className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
            <div>
                 <label htmlFor="cidade" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Cidade</label>
                 <CityAutocomplete id="cidade" value={formData.cidade} onChange={handleCityChange} required />
            </div>
            <FormField label="Número da Linha/Rota" name="linhaNumero" value={formData.linhaNumero} onChange={handleBaseChange} />
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Equipamentos</h3>
            <div className="space-y-2">
                {formData.equipment.map((equip, index) => {
                    const EquipmentIcon = equip.type === 'mesa' ? BilliardIcon : equip.type === 'jukebox' ? JukeboxIcon : CraneIcon;
                    const equipmentTitle = equip.type === 'mesa' ? `Mesa de Sinuca` : equip.type === 'jukebox' ? `Jukebox` : `Grua de Pelúcia`;
                    
                    return (
                        <div key={equip.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
                            <button
                                type="button"
                                onClick={() => setOpenEquipmentIndex(openEquipmentIndex === index ? null : index)}
                                className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-700/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lime-500"
                            >
                                <div className="flex items-center gap-3">
                                    <EquipmentIcon className="w-5 h-5 text-lime-500 dark:text-lime-400" />
                                    <h4 className="text-md font-bold text-slate-900 dark:text-white capitalize">
                                        {equipmentTitle}: <span className="font-normal text-slate-600 dark:text-slate-300">{equip.numero || '(Novo)'}</span>
                                    </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); removeEquipment(index); }} className="text-slate-500 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                    <ChevronDownIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${openEquipmentIndex === index ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            
                            {openEquipmentIndex === index && (
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/20">
                                    {equip.type === 'mesa' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tipo de Cobrança</label>
                                                <select
                                                    name="billingType"
                                                    value={equip.billingType || 'perPlay'}
                                                    onChange={e => handleEquipmentChange(index, e)}
                                                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                                                >
                                                    <option value="perPlay">Por Ficha</option>
                                                    <option value="monthly">Mensal Fixo</option>
                                                </select>
                                            </div>
                                            <div/>
                                            <FormField label="Número da Mesa" name="numero" value={String(equip.numero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Nº Relógio da Mesa" name="relogioNumero" value={String(equip.relogioNumero || '')} onChange={e => handleEquipmentChange(index, e)} />
                                            <FormField label="Leitura Anterior" name="relogioAnterior" type="number" value={String(equip.relogioAnterior || '0')} onChange={e => handleEquipmentChange(index, e)} />
                                            
                                            {equip.billingType === 'monthly' ? (
                                                <FormField label="Valor Mensal (R$)" name="monthlyFeeValue" type="number" step="0.01" value={String(equip.monthlyFeeValue || '0')} onChange={e => handleEquipmentChange(index, e)} />
                                            ) : (
                                                <>
                                                    <FormField label="Valor da Ficha (R$)" name="valorFicha" type="number" step="0.01" value={String(equip.valorFicha || '2.00')} onChange={e => handleEquipmentChange(index, e)} />
                                                    <FormField label="Parte da Firma (%)" name="parteFirma" type="number" value={String(equip.parteFirma || '50')} onChange={e => handleEquipmentChange(index, e)} />
                                                    <FormField label="Parte do Cliente (%)" name="parteCliente" type="number" value={String(equip.parteCliente || '50')} onChange={e => handleEquipmentChange(index, e)} />
                                                </>
                                            )}
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
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tipo de Aluguel</label>
                                                <select
                                                    name="aluguelTipo"
                                                    value={equip.aluguelPercentual != null ? 'percentual' : 'fixo'}
                                                    onChange={e => handleEquipmentChange(index, e)}
                                                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                                                >
                                                    <option value="fixo">Valor Fixo (R$)</option>
                                                    <option value="percentual">Percentual (%)</option>
                                                </select>
                                            </div>

                                            {equip.aluguelPercentual != null ? (
                                                <FormField label="Aluguel (%)" name="aluguelPercentual" type="number" value={String(equip.aluguelPercentual ?? '')} onChange={e => handleEquipmentChange(index, e)} />
                                            ) : (
                                                <FormField label="Aluguel Fixo (R$)" name="aluguelValor" type="number" step="0.01" value={String(equip.aluguelValor || '')} onChange={e => handleEquipmentChange(index, e)} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
                <button type="button" onClick={() => addEquipment('mesa')} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500">Adicionar Mesa</button>
                <button type="button" onClick={() => addEquipment('jukebox')} className="bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-md hover:bg-fuchsia-500">Adicionar Jukebox</button>
                <button type="button" onClick={() => addEquipment('grua')} className="bg-orange-600 text-white font-bold py-2 px-4 rounded-md hover:bg-orange-500">Adicionar Grua</button>
            </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onClick={() => setIsOpen(false)} className="bg-slate-500 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500">
            Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 disabled:bg-slate-500 disabled:cursor-wait">
            {isSaving ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomerForm;