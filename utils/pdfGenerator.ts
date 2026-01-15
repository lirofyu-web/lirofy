// utils/pdfGenerator.ts
import QRCode from 'qrcode';
import { EquipmentWithCustomer } from '../views/EquipamentosView';
import { Billing, DebtPayment } from '../types';

// jsPDF é carregado via tag de script no index.html, então o declaramos aqui.
declare const jspdf: any;
const { jsPDF } = jspdf;


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
