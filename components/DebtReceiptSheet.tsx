// components/DebtReceiptSheet.tsx
import React from 'react';
import { DebtPayment } from '../types';

interface DebtReceiptSheetProps {
  debtPayment: DebtPayment;
}

const DebtReceiptSheet: React.FC<DebtReceiptSheetProps> = ({ debtPayment }) => {
    const paymentMethodText = {
        pix: 'PIX',
        dinheiro: 'DINHEIRO',
    };

    return (
        <div>
            <div className="header text-center mb-4">
                <h3 className="font-bold text-base">MONTANHA BILHAR & JUKEBOX</h3>
                <p>COMPROVANTE DE PAGAMENTO DE DÍVIDA</p>
                <p>--------------------------------</p>
            </div>
            
            <div className="space-y-1">
                <p>CLIENTE: {debtPayment.customerName}</p>
                <p>DATA: {new Date(debtPayment.paidAt).toLocaleString('pt-BR')}</p>
                <hr className="border-dashed border-black my-2" />
                
                <div className="flex justify-between font-bold text-base pt-2 mt-2">
                    <span>VALOR PAGO:</span>
                    <span>R$ {debtPayment.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1">
                    <span>Pagamento:</span>
                    <span>{paymentMethodText[debtPayment.paymentMethod]}</span>
                </div>
            </div>
            <div className="text-center mt-4 pt-2 border-t border-dashed border-black">
                <p className="font-bold text-xs">MONTANHA BILHAR & JUKEBOX</p>
                <p className="text-xs">DIVERSAO LEVADO A SERIO.</p>
            </div>
        </div>
    );
};

export default DebtReceiptSheet;