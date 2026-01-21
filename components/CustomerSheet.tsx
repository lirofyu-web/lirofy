// components/CustomerSheet.tsx
import React from 'react';
import { Customer, Equipment } from '../types';
import { LogoIcon } from './icons/LogoIcon';

interface CustomerSheetProps {
  customer: Customer;
}

const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="mb-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || '---'}</p>
    </div>
);

const EquipmentCard: React.FC<{ equip: Equipment }> = ({ equip }) => {
    const typeStyles = {
        mesa: {
            title: 'Mesa de Sinuca',
            border: 'border-[var(--color-accent)]',
            text: 'text-cyan-800',
            bg: 'bg-cyan-50/50'
        },
        jukebox: {
            title: 'Jukebox',
            border: 'border-fuchsia-500',
            text: 'text-fuchsia-800',
            bg: 'bg-fuchsia-50/50'
        },
        grua: {
            title: 'Grua de Pelúcia',
            border: 'border-orange-500',
            text: 'text-orange-800',
            bg: 'bg-orange-50/50'
        }
    };

    const styles = typeStyles[equip.type] || {
        title: 'Equipamento',
        border: 'border-gray-400',
        text: 'text-gray-800',
        bg: 'bg-gray-50/50'
    };

    return (
        <div className={`p-4 border-l-4 ${styles.border} ${styles.bg} rounded-r-lg shadow-sm break-inside-avoid`}>
            <h4 className={`font-bold text-base mb-3 ${styles.text}`}>{styles.title} - Nº {equip.numero}</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {equip.relogioNumero && <InfoRow label="Nº do Relógio" value={equip.relogioNumero} />}
                <InfoRow label="Leitura Anterior" value={equip.relogioAnterior} />

                {/* --- MESA --- */}
                {equip.type === 'mesa' && (
                    equip.billingType === 'monthly'
                    ? ( // Monthly billing
                        <InfoRow 
                            label="Mensalidade Fixa" 
                            value={equip.monthlyFeeValue != null ? `R$ ${Number(equip.monthlyFeeValue)}` : null} 
                        />
                    ) 
                    : ( // Per-play billing (default)
                        <>
                            <InfoRow 
                                label="Valor da Ficha" 
                                value={equip.valorFicha != null ? `R$ ${Number(equip.valorFicha)}` : null} 
                            />
                            <div /> 
                            <InfoRow 
                                label="Divisão (Firma)" 
                                value={equip.parteFirma != null ? `${equip.parteFirma}%` : null} 
                            />
                            <InfoRow 
                                label="Divisão (Cliente)" 
                                value={equip.parteCliente != null ? `${equip.parteCliente}%` : null} 
                            />
                        </>
                    )
                )}

                {/* --- JUKEBOX --- */}
                 {equip.type === 'jukebox' && (
                    <>
                        <InfoRow 
                            label="Divisão (Firma)" 
                            value={equip.porcentagemJukeboxFirma != null ? `${equip.porcentagemJukeboxFirma}%` : null} 
                        />
                        <InfoRow 
                            label="Divisão (Cliente)" 
                            value={equip.porcentagemJukeboxCliente != null ? `${equip.porcentagemJukeboxCliente}%` : null} 
                        />
                    </>
                )}
                
                {/* --- GRUA --- */}
                {equip.type === 'grua' && (
                    <>
                       {equip.aluguelValor && equip.aluguelValor > 0 && <InfoRow label="Aluguel (Fixo)" value={`R$ ${equip.aluguelValor}`} />}
                       {equip.aluguelPercentual && equip.aluguelPercentual > 0 && <InfoRow label="Aluguel (%)" value={`${equip.aluguelPercentual}%`} />}
                       <InfoRow label="Capacidade Pelúcias" value={equip.quantidadePelucia || 0} />
                    </>
                )}
            </div>
        </div>
    );
};

const CustomerSheet: React.FC<CustomerSheetProps> = ({ customer }) => {
  return (
    <div className="bg-slate-100 font-sans" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
      <div className="bg-white p-10 shadow-lg flex flex-col justify-between" style={{minHeight: '297mm'}}>
        <div>
            <header className="flex justify-between items-center pb-4 border-b-4 border-[var(--color-primary)]">
            <LogoIcon />
            <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-800">Ficha Cadastral de Cliente</h1>
                <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            </header>

            <main className="mt-8 space-y-8">
            <section>
                <h2 className="text-lg font-bold text-white bg-[var(--color-accent)] px-4 py-2 rounded-t-lg -mb-1">DADOS DO CLIENTE</h2>
                <div className="grid grid-cols-3 gap-x-6 gap-y-2 p-4 border border-gray-300 rounded-b-lg bg-white shadow-inner">
                <div className="col-span-2"><InfoRow label="Nome / Razão Social" value={customer.name} /></div>
                <div><InfoRow label="CPF / CNPJ" value={customer.cpfRg} /></div>
                <div className="col-span-2"><InfoRow label="Endereço" value={customer.endereco} /></div>
                <div><InfoRow label="Cidade" value={customer.cidade} /></div>
                <div><InfoRow label="Telefone" value={customer.telefone} /></div>
                <div><InfoRow label="Cobrador" value={customer.linhaNumero} /></div>
                <div className="col-span-2"><InfoRow label="Data do Contrato" value={customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('pt-BR') : '---'} /></div>
                </div>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white bg-slate-700 px-4 py-2 rounded-t-lg -mb-1">EQUIPAMENTOS INSTALADOS ({(customer.equipment || []).length})</h2>
                <div className="p-4 border border-gray-300 rounded-b-lg bg-slate-50 shadow-inner">
                {(customer.equipment || []).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(customer.equipment || []).map(equip => <EquipmentCard key={equip.id} equip={equip} />)}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum equipamento cadastrado.</p>
                )}
                </div>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white bg-slate-700 px-4 py-2 rounded-t-lg -mb-1">TERMOS DE LOCAÇÃO</h2>
                <div className="p-4 border border-gray-300 rounded-b-lg bg-white shadow-inner">
                    <p className="text-xs text-gray-600 leading-relaxed">
                        O LOCATÁRIO RECEBE NESTA DATA O EQUIPAMENTO ACIMA IDENTIFICADO COM TODOS OS EQUIPAMENTOS INTERNOS E EXTERNOS EM PERFEITO ESTADO DE USO E CONSERVAÇÃO. O VALOR DA LOCAÇÃO SERÁ APURADO MEDIANTE O USO DO RESPECTIVO EQUIPAMENTO, SENDO QUE O PAGAMENTO OCORRERÁ NO PRAZO E NOS PERCENTUAIS ACIMA MENCIONADOS.
                    </p>
                </div>
            </section>
            </main>
        </div>

        <footer className="pt-24">
            <div className="flex justify-around items-center text-center">
                <div className="w-2/5">
                    <div className="border-t border-gray-400 pt-2 h-20 flex flex-col justify-between">
                         {customer.assinaturaCliente ? (
                            <img src={customer.assinaturaCliente} alt="Assinatura do Cliente" className="max-h-12 mx-auto" />
                        ) : (
                            <div className="h-12"></div> // Placeholder
                        )}
                        <p className="text-sm font-semibold text-gray-800 mt-1">{customer.name}</p>
                        <p className="text-xs text-gray-500">(Assinatura Cliente)</p>
                    </div>
                </div>
                <div className="w-2/5">
                     <div className="border-t border-gray-400 pt-2 h-20 flex flex-col justify-between">
                        {customer.assinaturaFirma ? (
                            <img src={customer.assinaturaFirma} alt="Assinatura da Firma" className="max-h-12 mx-auto" />
                        ) : (
                            <div className="h-12"></div> // Placeholder
                        )}
                        <p className="text-sm font-semibold text-gray-800 mt-1">Montanha Bilhar & Jukebox</p>
                        <p className="text-xs text-gray-500">(Assinatura Firma)</p>
                    </div>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default CustomerSheet;
