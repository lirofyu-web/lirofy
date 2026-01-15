// components/PdfReceiptSheet.tsx
import React from 'react';
import { Billing } from '../types';
import { LogoIcon } from './icons/LogoIcon';

const InfoRow: React.FC<{ label: string; value?: string | number | null; isTotal?: boolean; className?: string }> = ({ label, value, isTotal, className }) => (
    <div className={`flex justify-between py-2 ${isTotal ? 'font-bold text-base border-t-2 border-black mt-2 pt-2' : 'border-b border-gray-200'} ${className}`}>
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-mono">{value ?? '---'}</span>
    </div>
);

const PdfReceiptSheet: React.FC<{ billing: Billing, isProvisional?: boolean }> = ({ billing, isProvisional }) => {
    const isMesa = billing.equipmentType === 'mesa';
    const isGrua = billing.equipmentType === 'grua';
    const paymentMethodText = { pix: 'PIX', dinheiro: 'DINHEIRO', debito_negativo: 'NEGATIVO', misto: 'MISTO' };

    const renderGruaDetails = () => (
        <>
            <InfoRow label="Leitura Anterior" value={billing.relogioAnterior} />
            <InfoRow label="Leitura Atual" value={billing.relogioAtual} />
            <InfoRow label="Jogadas" value={billing.partidasJogadas} />
            <InfoRow label="Saldo Bruto" value={`R$ ${(billing.saldo || 0).toFixed(2)}`} />
            <InfoRow label="Aluguel (Pago ao Cliente)" value={`- R$ ${(billing.aluguelValor || 0).toFixed(2)}`} />
            <InfoRow label="Total (Firma)" value={`R$ ${billing.valorTotal.toFixed(2)}`} isTotal />
        </>
    );

    const renderMesaJukeboxDetails = () => {
         if (isMesa && billing.billingType === 'monthly') {
            return (
                <>
                    <InfoRow label="Partidas Jogadas (Período)" value={billing.partidasJogadas} />
                    <InfoRow label="Mensalidade Fixa" value={`R$ ${billing.valorTotal.toFixed(2)}`} isTotal />
                </>
            );
        }
        return (
            <>
                <InfoRow label="Leitura Anterior" value={billing.relogioAnterior} />
                <InfoRow label="Leitura Atual" value={billing.relogioAtual} />
                {isMesa && <>
                    <InfoRow label="Partidas Jogadas" value={billing.partidasJogadas} />
                    <InfoRow label="Partidas Desconto" value={billing.descontoPartidas || 0} />
                    <InfoRow label="Partidas Cobradas" value={billing.partidasCobradas || 0} />
                    <InfoRow label="Valor Ficha" value={`R$ ${(billing.valorFicha ?? 0).toFixed(2)}`} />
                </>}
                <InfoRow label="Valor Bruto" value={`R$ ${(billing.valorBruto ?? 0).toFixed(2)}`} />
                <InfoRow label="Parte Cliente" value={`R$ ${(billing.parteCliente ?? 0).toFixed(2)}`} />
                <InfoRow label="Total (Firma)" value={`R$ ${billing.valorTotal.toFixed(2)}`} isTotal />
            </>
        );
    };
    
    return (
        <div className="bg-white font-sans">
            <div className="p-8" style={{ width: '210mm', minHeight: '297mm', margin: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                    <header className="flex justify-between items-center pb-4 border-b-4 border-lime-500">
                        <LogoIcon />
                        <div className="text-right">
                            <h1 className="text-3xl font-bold text-gray-800">{isProvisional ? 'Demonstrativo de Cobrança' : 'Acerto de Contas'}</h1>
                            <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </header>

                    <main className="mt-10 space-y-8">
                        <section>
                            <h2 className="text-lg font-bold bg-gray-100 px-4 py-2 rounded-t-lg -mb-1">Dados da Cobrança</h2>
                            <div className="grid grid-cols-2 gap-x-8 p-4 border border-gray-200 rounded-b-lg text-sm">
                                <InfoRow label="Cliente" value={billing.customerName} className="col-span-2"/>
                                <InfoRow label="Data" value={new Date(billing.settledAt).toLocaleString('pt-BR')} />
                                <InfoRow label="Equipamento" value={`${billing.equipmentType.toUpperCase()} Nº ${billing.equipmentNumero}`} />
                            </div>
                        </section>
                        <section>
                            <h2 className="text-lg font-bold bg-gray-100 px-4 py-2 rounded-t-lg -mb-1">Detalhes do Faturamento</h2>
                            <div className="p-4 border border-gray-200 rounded-b-lg">
                                {isGrua ? renderGruaDetails() : renderMesaJukeboxDetails()}
                            </div>
                        </section>
                        {!isProvisional &&
                            <section>
                                <h2 className="text-lg font-bold bg-gray-100 px-4 py-2 rounded-t-lg -mb-1">Detalhes do Pagamento</h2>
                                <div className="p-4 border border-gray-200 rounded-b-lg">
                                    {isGrua ? (
                                        <>
                                            <InfoRow label="Recebido Espécie" value={`R$ ${(billing.recebimentoEspecie || 0).toFixed(2)}`} />
                                            <InfoRow label="Recebido PIX" value={`R$ ${(billing.recebimentoPix || 0).toFixed(2)}`} />
                                        </>
                                    ) : (
                                        billing.paymentMethod === 'misto' ? (
                                            <>
                                                {billing.valorPagoDinheiro && billing.valorPagoDinheiro > 0 && <InfoRow label="Pago em Dinheiro" value={`R$ ${billing.valorPagoDinheiro.toFixed(2)}`} />}
                                                {billing.valorPagoPix && billing.valorPagoPix > 0 && <InfoRow label="Pago em PIX" value={`R$ ${billing.valorPagoPix.toFixed(2)}`} />}
                                                {billing.valorDebitoNegativo && billing.valorDebitoNegativo > 0 && <InfoRow label="Valor em Negativo" value={`R$ ${billing.valorDebitoNegativo.toFixed(2)}`} />}
                                            </>
                                        ) : (
                                            <InfoRow label="Método de Pagamento" value={paymentMethodText[billing.paymentMethod]} />
                                        )
                                    )}
                                </div>
                            </section>
                        }
                    </main>
                </div>
                 <footer className="text-center text-sm text-gray-500">
                    <p className="font-bold">MONTANHA BILHAR & JUKEBOX</p>
                    <p>DIVERSAO LEVADO A SERIO.</p>
                </footer>
            </div>
        </div>
    );
};
export default PdfReceiptSheet;
