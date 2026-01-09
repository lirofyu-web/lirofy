// utils/receiptGenerator.ts
import { Billing, DebtPayment } from '../types';
import * as escpos from './escpos';

const formatField = (id: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
};

const crc16ccitt = (data: string): string => {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  return ('0000' + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
};

export function generatePixPayload(): string {
    const pixKey = "43999581993";
    const recipientName = "BILHAR MONTANHA";
    const recipientCity = "JAGUAPITA";
    const staticTxId = '***';

     const sanitize = (str: string, maxLength: number) => {
        let sanitized = str
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .toUpperCase().replace(/[^A-Z0-9\s]/g, "");
        return sanitized.substring(0, maxLength).trim();
      };
    
    const cleanName = sanitize(recipientName, 25);
    const cleanCity = sanitize(recipientCity, 15).replace(/\s/g, '');

    const payload = [
        formatField('00', '01'),
        formatField('26', formatField('00', 'br.gov.bcb.pix') + formatField('01', pixKey)),
        formatField('52', '0000'),
        formatField('53', '986'),
        formatField('58', 'BR'),
        formatField('59', cleanName),
        formatField('60', cleanCity),
        formatField('62', formatField('05', staticTxId)),
    ].join('');
      
    const payloadWithCrcPrefix = payload + '6304';
    const crc = crc16ccitt(payloadWithCrcPrefix);
    return payloadWithCrcPrefix + crc;
}


function generateBillingText(billing: Billing, isProvisional: boolean): string {
    const isMesa = billing.equipmentType === 'mesa';
    const isGrua = billing.equipmentType === 'grua';
    const pixKey = "43999581993";
    
    const paymentMethodText = {
        pix: 'PIX',
        dinheiro: 'DINHEIRO',
        fiado: 'FIADO (ANOTADO)',
        misto: 'MISTO',
    };

    let details = '';

    if (isGrua) {
        details = `
EQUIPAMENTO: GRUA ${billing.equipmentNumero}
Leitura Anterior: ${billing.relogioAnterior}
Leitura Atual: ${billing.relogioAtual}
--------------------------------
SALDO: R$ ${(billing.saldo || 0).toFixed(2)}
Recebido Especie: R$ ${(billing.recebimentoEspecie || 0).toFixed(2)}
Recebido PIX: R$ ${(billing.recebimentoPix || 0).toFixed(2)}
--------------------------------
Qtd. Pelucias (Capacidade): ${billing.quantidadePelucia || 0}
Sobra de Pelucias: ${billing.sobraPelucia || 0}
Reposicao de Pelucias: ${billing.reposicaoPelucia || 0}
--------------------------------
ALUGUEL (PAGO AO CLIENTE): R$ ${(billing.aluguelValor || 0).toFixed(2)}
--------------------------------
*TOTAL (FIRMA): R$ ${billing.valorTotal.toFixed(2)}*
        `.trim();
    } else { // Mesa or Jukebox
        if (isMesa && billing.billingType === 'monthly') {
            details = `
EQUIPAMENTO: MESA ${billing.equipmentNumero} (MENSAL)
--------------------------------
Partidas Jogadas (Periodo): ${billing.partidasJogadas}
--------------------------------
*MENSALIDADE FIXA: R$ ${billing.valorTotal.toFixed(2)}*
            `.trim();
        } else {
            let mesaDetails = '';
            if (isMesa) {
                mesaDetails = `
Partidas Jogadas: ${billing.partidasJogadas}
Partidas Desconto: ${billing.descontoPartidas || 0}
Partidas Cobradas: ${billing.partidasCobradas || 0}
Valor Ficha: R$ ${(billing.valorFicha ?? 0).toFixed(2)}
--------------------------------`;
            }
            details = `
EQUIPAMENTO: ${isMesa ? `MESA ${billing.equipmentNumero}` : `JUKEBOX ${billing.equipmentNumero}`}
Leitura Anterior: ${billing.relogioAnterior}
Leitura Atual: ${billing.relogioAtual}
--------------------------------${mesaDetails}
Valor Bruto: R$ ${((billing.parteFirma ?? 0) + (billing.parteCliente ?? 0)).toFixed(2)}
Parte Cliente: R$ ${(billing.parteCliente ?? 0).toFixed(2)}
--------------------------------
*TOTAL (FIRMA): R$ ${billing.valorTotal.toFixed(2)}*
            `.trim();
        }
    }

    let paymentDetails = '';
    if (!isProvisional && !isGrua) {
        if (billing.paymentMethod === 'misto') {
            let parts = [];
            if (billing.valorPagoDinheiro && billing.valorPagoDinheiro > 0) parts.push(`- Dinheiro: R$ ${billing.valorPagoDinheiro.toFixed(2)}`);
            if (billing.valorPagoPix && billing.valorPagoPix > 0) parts.push(`- PIX: R$ ${billing.valorPagoPix.toFixed(2)}`);
            if (billing.valorPagoFiado && billing.valorPagoFiado > 0) parts.push(`- Fiado: R$ ${billing.valorPagoFiado.toFixed(2)}`);
            paymentDetails = `\nPAGAMENTO:\n${parts.join('\n')}`;
        } else {
            paymentDetails = `\nPagamento: ${paymentMethodText[billing.paymentMethod]}`;
        }
    }

    const provisionalFooter = isProvisional ? `
--------------------------------
*Pague com PIX!*
Chave (Celular): ${pixKey}
--------------------------------
*** COMPROVANTE PARA CONFERENCIA ***
*** SEM VALOR FISCAL ***` : '';

    return `*MONTANHA BILHAR & JUKEBOX*
${isProvisional ? 'DEMONSTRATIVO DE COBRANCA' : 'ACERTO DE CONTAS'}
--------------------------------
CLIENTE: ${billing.customerName}
DATA: ${new Date(billing.settledAt).toLocaleString('pt-BR')}
--------------------------------
${details}
${paymentDetails}
${provisionalFooter}
    `.replace(/\n\s+\n/g, '\n\n').trim();
}


function generateDebtText(debtPayment: DebtPayment): string {
     const paymentMethodText = {
        pix: 'PIX',
        dinheiro: 'DINHEIRO',
    };
    return `*MONTANHA BILHAR & JUKEBOX*
COMPROVANTE DE PAGAMENTO DE DIVIDA
--------------------------------
CLIENTE: ${debtPayment.customerName}
DATA: ${new Date(debtPayment.paidAt).toLocaleString('pt-BR')}
--------------------------------
*VALOR PAGO: R$ ${debtPayment.amountPaid.toFixed(2)}*
Pagamento: ${paymentMethodText[debtPayment.paymentMethod]}
    `.trim();
}

export function generateEscPosFromReceipt(
    data: Billing | DebtPayment,
    isProvisional?: boolean,
    pixPayload?: string
): Uint8Array {
    const isBilling = 'equipmentType' in data;
    const receiptText = isBilling ? generateBillingText(data, isProvisional!) : generateDebtText(data);
    
    const commands: Uint8Array[] = [];
    commands.push(escpos.INIT);
    commands.push(escpos.ALIGN_CENTER);

    const lines = receiptText.split('\n');
    for (const line of lines) {
        let processedLine = line.trim();
        const isBold = processedLine.startsWith('*') && processedLine.endsWith('*');
        
        if (isBold) {
            processedLine = processedLine.substring(1, processedLine.length - 1);
            commands.push(escpos.BOLD_ON);
        }

        // Center-align headers and separators
        if (
            processedLine.includes('MONTANHA BILHAR') ||
            processedLine.includes('COBRANCA') ||
            processedLine.includes('ACERTO DE CONTAS') ||
            processedLine.includes('PAGAMENTO DE DIVIDA') ||
            processedLine.includes('---') ||
            processedLine.includes('COMPROVANTE PARA CONFERENCIA') ||
            processedLine.includes('SEM VALOR FISCAL') ||
            processedLine.includes('Pague com PIX!')
        ) {
            commands.push(escpos.ALIGN_CENTER);
        } else {
            commands.push(escpos.ALIGN_LEFT);
        }

        commands.push(escpos.text(processedLine + '\n'));

        if (isBold) {
            commands.push(escpos.BOLD_OFF);
        }
    }
    
    if (pixPayload) {
        commands.push(escpos.text('\n'));
        commands.push(escpos.ALIGN_CENTER);
        commands.push(escpos.qrCode(pixPayload));
        commands.push(escpos.text('\n'));
    }

    commands.push(escpos.text('\n\n\n\n'));
    commands.push(escpos.CUT_PAPER);

    return escpos.combine(...commands);
}
