// utils/pdfGenerator.ts
import QRCode from 'qrcode';
import { EquipmentWithCustomer } from '../views/EquipamentosView';
import { Billing, DebtPayment } from '../types';

// jsPDF é carregado via tag de script no index.html, então o declaramos aqui.
declare const jspdf: any;
const { jsPDF } = jspdf;

// --- Helper Functions ---

function drawWrappedText(doc: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number, align: 'left' | 'center' | 'right' = 'left'): number {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y, { align });
    return y + (lines.length * lineHeight);
}

function drawRow(doc: any, y: number, label: string, value: string, margin: number, maxWidth: number, isBold: boolean = false) {
    if (isBold) {
        doc.setFont('Courier', 'bold');
    }
    doc.text(label, margin, y);
    doc.text(value, margin + maxWidth, y, { align: 'right' });
    if (isBold) {
        doc.setFont('Courier', 'normal');
    }
    return y + 3.5;
}

function drawDashedLine(doc: any, y: number) {
    doc.text('----------------------------------', 53 / 2, y, { align: 'center' });
    return y + 3.5;
}

// --- PDF Generators ---

export async function generateEquipmentLabelsPdf(equipments: EquipmentWithCustomer[]): Promise<void> {
    const labelWidth = 50;
    const labelHeight = 80;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [labelWidth, labelHeight] });
    const margin = 3;

    for (let i = 0; i < equipments.length; i++) {
        const equipment = equipments[i];
        if (i > 0) doc.addPage([labelWidth, labelHeight], 'portrait');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('MONTANHA BILHAR E JUKEBOX', labelWidth / 2, margin + 5, { align: 'center' });

        doc.setDrawColor(150);
        doc.line(margin, margin + 8, labelWidth - margin, margin + 8);

        const qrData = JSON.stringify({ type: 'equipment', id: equipment.id });
        const qrCodeSize = 38;
        const qrCodeImage = await QRCode.toDataURL(qrData, { width: qrCodeSize * 4, margin: 1, errorCorrectionLevel: 'H' });
        
        const qrX = (labelWidth - qrCodeSize) / 2;
        doc.addImage(qrCodeImage, 'PNG', qrX, margin + 12, qrCodeSize, qrCodeSize);

        const equipmentTypeText = { 'mesa': 'Mesa de Sinuca', 'jukebox': 'Jukebox', 'grua': 'Grua de Pelúcia' };
        const typeText = equipmentTypeText[equipment.type];
        
        const textYStart = margin + 12 + qrCodeSize + 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(typeText, labelWidth / 2, textYStart, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(`Nº: ${equipment.numero}`, labelWidth / 2, textYStart + 7, { align: 'center' });
    }

    doc.save('etiquetas-termicas-equipamentos.pdf');
}

export async function generateBillingReceiptPdf(billing: Billing, isProvisional: boolean): Promise<string> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [53, 150] });
    const margin = 3;
    const maxWidth = 53 - margin * 2;
    let y = 7;
    const lineHeight = 3.5;
    const smallLineHeight = 3;

    doc.setFont('Courier', 'bold');
    doc.setFontSize(8);
    y = drawWrappedText(doc, 'MONTANHA BILHAR & JUKEBOX', 53 / 2, y, maxWidth, lineHeight, 'center');
    doc.setFont('Courier', 'normal');
    y = drawWrappedText(doc, isProvisional ? 'DEMONSTRATIVO DE COBRANCA' : 'ACERTO DE CONTAS', 53 / 2, y, maxWidth, lineHeight, 'center');
    y = drawDashedLine(doc, y);
    
    y = drawWrappedText(doc, `CLIENTE: ${billing.customerName}`, margin, y, maxWidth, smallLineHeight);
    y = drawWrappedText(doc, `DATA: ${new Date(billing.settledAt).toLocaleString('pt-BR')}`, margin, y, maxWidth, smallLineHeight);
    y = drawDashedLine(doc, y);

    doc.setFont('Courier', 'bold');
    y = drawWrappedText(doc, `EQUIP.: ${billing.equipmentType.toUpperCase()} ${billing.equipmentNumero}`, margin, y, maxWidth, smallLineHeight);
    doc.setFont('Courier', 'normal');
    y = drawRow(doc, y, 'Leitura Anterior:', `${billing.relogioAnterior}`, margin, maxWidth);
    y = drawRow(doc, y, 'Leitura Atual:', `${billing.relogioAtual}`, margin, maxWidth);
    y = drawDashedLine(doc, y);

    if (billing.equipmentType === 'mesa' && billing.billingType !== 'monthly') {
        y = drawRow(doc, y, 'Partidas Jogadas:', `${billing.partidasJogadas}`, margin, maxWidth);
        y = drawRow(doc, y, 'Partidas Desconto:', `${billing.descontoPartidas || 0}`, margin, maxWidth);
        y = drawRow(doc, y, 'Partidas Cobradas:', `${billing.partidasCobradas || 0}`, margin, maxWidth);
        y = drawRow(doc, y, 'Valor Ficha:', `R$ ${(billing.valorFicha ?? 0).toFixed(2)}`, margin, maxWidth);
        y = drawDashedLine(doc, y);
    }
    
    if (billing.equipmentType !== 'grua' && billing.billingType !== 'monthly') {
      y = drawRow(doc, y, 'Valor Bruto:', `R$ ${((billing.parteFirma ?? 0) + (billing.parteCliente ?? 0)).toFixed(2)}`, margin, maxWidth);
      y = drawRow(doc, y, 'Parte Cliente:', `R$ ${(billing.parteCliente ?? 0).toFixed(2)}`, margin, maxWidth);
      y = drawDashedLine(doc, y);
    }

    if (billing.equipmentType === 'grua') {
        y = drawRow(doc, y, 'SALDO:', `R$ ${(billing.saldo || 0).toFixed(2)}`, margin, maxWidth);
        y = drawRow(doc, y, 'Receb. Especie:', `R$ ${(billing.recebimentoEspecie || 0).toFixed(2)}`, margin, maxWidth);
        y = drawRow(doc, y, 'Receb. PIX:', `R$ ${(billing.recebimentoPix || 0).toFixed(2)}`, margin, maxWidth);
        y = drawDashedLine(doc, y);
        y = drawRow(doc, y, 'ALUGUEL (CLIENTE):', `R$ ${(billing.aluguelValor || 0).toFixed(2)}`, margin, maxWidth);
        y = drawDashedLine(doc, y);
    }
    
    doc.setFontSize(10);
    y = drawRow(doc, y, 'TOTAL (FIRMA):', `R$ ${billing.valorTotal.toFixed(2)}`, margin, maxWidth, true);
    doc.setFontSize(8);

    if (!isProvisional && billing.equipmentType !== 'grua') {
        if (billing.paymentMethod === 'misto') {
            y += 2;
            doc.text('PAGAMENTO:', margin, y);
            y += smallLineHeight;
            if (billing.valorPagoDinheiro) y = drawRow(doc, y, '- Dinheiro:', `R$ ${billing.valorPagoDinheiro.toFixed(2)}`, margin, maxWidth);
            if (billing.valorPagoPix) y = drawRow(doc, y, '- PIX:', `R$ ${billing.valorPagoPix.toFixed(2)}`, margin, maxWidth);
            if (billing.valorPagoFiado) y = drawRow(doc, y, '- Fiado:', `R$ ${billing.valorPagoFiado.toFixed(2)}`, margin, maxWidth);
        } else {
            const paymentMethodText = { pix: 'PIX', dinheiro: 'DINHEIRO', fiado: 'FIADO (ANOTADO)' };
            y = drawRow(doc, y, 'Pagamento:', paymentMethodText[billing.paymentMethod] || 'N/A', margin, maxWidth);
        }
    }
    
    if (isProvisional) {
        y = drawDashedLine(doc, y);
        y = drawWrappedText(doc, 'Pague com PIX!', 53 / 2, y, maxWidth, lineHeight, 'center');
        y = drawWrappedText(doc, 'Chave (Celular): 43999581993', 53 / 2, y, maxWidth, smallLineHeight, 'center');
        y = drawDashedLine(doc, y);
        y = drawWrappedText(doc, '*** COMPROVANTE PARA CONFERENCIA ***', 53 / 2, y, maxWidth, smallLineHeight, 'center');
        y = drawWrappedText(doc, '*** SEM VALOR FISCAL ***', 53 / 2, y, maxWidth, smallLineHeight, 'center');
    }

    return doc.output('datauristring');
}


export async function generateDebtReceiptPdf(debtPayment: DebtPayment): Promise<string> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [53, 150] });
    const margin = 3;
    const maxWidth = 53 - margin * 2;
    let y = 7;
    const lineHeight = 3.5;
    const smallLineHeight = 3;

    doc.setFont('Courier', 'bold');
    doc.setFontSize(8);
    y = drawWrappedText(doc, 'MONTANHA BILHAR & JUKEBOX', 53 / 2, y, maxWidth, lineHeight, 'center');
    doc.setFont('Courier', 'normal');
    y = drawWrappedText(doc, 'COMPROVANTE DE PAGAMENTO DE DIVIDA', 53 / 2, y, maxWidth, lineHeight, 'center');
    y = drawDashedLine(doc, y);

    y = drawWrappedText(doc, `CLIENTE: ${debtPayment.customerName}`, margin, y, maxWidth, smallLineHeight);
    y = drawWrappedText(doc, `DATA: ${new Date(debtPayment.paidAt).toLocaleString('pt-BR')}`, margin, y, maxWidth, smallLineHeight);
    y = drawDashedLine(doc, y);

    doc.setFontSize(10);
    y = drawRow(doc, y, 'VALOR PAGO:', `R$ ${debtPayment.amountPaid.toFixed(2)}`, margin, maxWidth, true);
    doc.setFontSize(8);

    const paymentMethodText = { pix: 'PIX', dinheiro: 'DINHEIRO' };
    y = drawRow(doc, y, 'Pagamento:', paymentMethodText[debtPayment.paymentMethod], margin, maxWidth);

    return doc.output('datauristring');
}
