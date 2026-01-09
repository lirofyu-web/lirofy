// utils/receiptGenerator.ts
import { Billing, DebtPayment, Equipment, Customer } from '../types';

export function generateBillingText(billing: Billing, isProvisional: boolean): string {
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


export function generateDebtText(debtPayment: DebtPayment): string {
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

export function generateEquipmentLabelText(equipment: Equipment): string {
  const equipmentTypeText = {
      'mesa': 'Mesa de Sinuca',
      'jukebox': 'Jukebox',
      'grua': 'Grua de Pelucia'
  };
  const qrData = JSON.stringify({ type: 'equipment', id: equipment.id });

  return `
MONTANHA BILHAR & JUKEBOX
--------------------------------
EQUIPAMENTO

TIPO: ${equipmentTypeText[equipment.type]}
Nº: ${equipment.numero}

DADOS QR CODE (PARA ESCANEAR NO APP):
${qrData}
  `.trim();
}

export function generateCustomerLabelText(customer: Customer): string {
  const qrData = customer.id;
  return `
${customer.name}
--------------------------------
ID DO CLIENTE

DADOS QR CODE (PARA ESCANEAR NO APP):
${qrData}
  `.trim();
}