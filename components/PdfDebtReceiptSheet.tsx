// components/PdfDebtReceiptSheet.tsx
import React from 'react';
import { DebtPayment } from '../types';
import { LogoIcon } from './icons/LogoIcon';

const InfoRow: React.FC<{ label: string; value?: string | number | null; isTotal?: boolean; className?: string }> = ({ label, value, isTotal, className }) => (
    <div className={`flex justify-between py-2 ${isTotal ? 'font-bold text-base border-t-2 border-black mt-2 pt-2' : 'border-b border-gray-200'} ${className}`}>
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-mono">{value ?? '---'}</span>
    </div>
);

const PdfDebtReceiptSheet: React.FC<{ debtPayment: DebtPayment }> = ({ debtPayment }) => {
    const paymentMethodText = { pix: 'PIX', dinheiro: 'DINHEIRO' };
    
    return (
        <div className="bg-white font-sans">
             <div className="p-8" style={{ width: '210mm', minHeight: '297mm', margin: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                    <header className="flex justify-between items-center pb-4 border-b-4 border-lime-500">
                        <LogoIcon />
                        <div className="text-right">
                            <h1 className="text-3xl font-bold text-gray-800">Comprovante de Dívida</h1>
                            <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </header>

                    <main className="mt-10 space-y-8">
                        <section>
                            <h2 className="text-lg font-bold bg-gray-100 px-4 py-2 rounded-t-lg -mb-1">Dados do Pagamento</h2>
                            <div className="grid grid-cols-2 gap-x-8 p-4 border border-gray-200 rounded-b-lg text-sm">
                                <InfoRow label="Cliente" value={debtPayment.customerName} className="col-span-2"/>
                                <InfoRow label="Data" value={new Date(debtPayment.paidAt).toLocaleString('pt-BR')} />
                            </div>
                        </section>
                        <section>
                            <h2 className="text-lg font-bold bg-gray-100 px-4 py-2 rounded-t-lg -mb-1">Detalhes do Pagamento</h2>
                            <div className="p-4 border border-gray-200 rounded-b-lg">
                                <InfoRow label="Método de Pagamento" value={paymentMethodText[debtPayment.paymentMethod]} />
                                <InfoRow label="Valor Pago" value={`R$ ${debtPayment.amountPaid.toFixed(2)}`} isTotal />
                            </div>
                        </section>
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
export default PdfDebtReceiptSheet;
