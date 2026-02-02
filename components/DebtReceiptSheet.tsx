// components/DebtReceiptSheet.tsx
import React from 'react';
import { DebtPayment } from '../types';
import PixQrCode from './PixQrCode';

interface DebtReceiptSheetProps {
  debtPayment: DebtPayment;
  qrCodeDataUrl?: string; // For SSR/PDF printing
}

const DebtReceiptSheet: React.FC<DebtReceiptSheetProps> = ({ debtPayment, qrCodeDataUrl }) => {
    const paymentMethodText = {
        pix: 'PIX',
        dinheiro: 'DINHEIRO',
    };
    
    const formatCurrency = (value: number) => (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="font-bold text-sm">
            <div className="header text-center mb-4">
                <h3 className="font-bold text-lg">MONTANHA BILHAR & JUKEBOX</h3>
                <p className="font-bold">COMPROVANTE DE PAGAMENTO DE DÍVIDA</p>
                <p>--------------------------------</p>
            </div>
            
            <div className="space-y-1">
                <p>CLIENTE: {debtPayment.customerName}</p>
                <p>DATA: {new Date(debtPayment.paidAt).toLocaleString('pt-BR')}</p>
                <hr className="border-dashed border-black my-2" />
                
                <div className="receipt-row font-bold text-base pt-2 mt-2">
                    <span className="label">VALOR PAGO:</span>
                    <span className="filler"></span>
                    <span className="value">R$ {formatCurrency(debtPayment.amountPaid)}</span>
                </div>
                <div className="receipt-row pt-1">
                    <span className="label">Pagamento:</span>
                    <span className="filler"></span>
                    <span className="value">{paymentMethodText[debtPayment.paymentMethod]}</span>
                </div>
            </div>

            {qrCodeDataUrl ? (
                <div className="text-center mt-4">
                    <p className="font-bold">Pague com PIX</p>
                    <img src={qrCodeDataUrl} alt="PIX QR Code" style={{ width: '150px', height: '150px', margin: '8px auto', border: '4px solid black' }} />
                    <p className="text-xs">Chave: +5543999581993</p>
                </div>
            ) : (
                <PixQrCode />
            )}
            
            <div className="text-center mt-4 pt-2 border-t border-dashed border-black">
                <p className="font-bold text-xs">MONTANHA BILHAR & JUKEBOX</p>
                <p className="text-xs">DIVERSAO LEVADO A SERIO.</p>
            </div>
        </div>
    );
};

export default DebtReceiptSheet;