// utils/receiptGenerator.ts
import { Billing, DebtPayment, Equipment, Customer } from '../types';

const formatCurrency = (value: number | undefined) => (value || 0).toFixed(2);
const formatCurrencyFicha = (value: number | undefined) => (value || 0).toFixed(2); // Use 2 for consistency on text receipts
const PIX_KEY = "43999581993";

const PAYMENT_METHOD_TEXT = {
    pix: 'PIX',
    dinheiro: 'DINHEIRO',
    debito_negativo: 'NEGATIVO',
    misto: 'MISTO',
};

export function generateBillingText(billing: Billing, isProvisional: boolean): string {
    const isMesa = billing.equipmentType === 'mesa';
    const isGrua = billing.equipmentType === 'grua';
    
    let details = '';

    if (isGrua) {
        details = `
EQUIPAMENTO: GRUA ${billing.equipmentNumero}
Leitura Anterior: ${billing.relogioAnterior}
Leitura Atual: ${billing.relogioAtual}
--------------------------------
SALDO: R$ ${formatCurrency(billing.saldo)}
Recebido Especie: R$ ${formatCurrency(billing.recebimentoEspecie)}
Recebido PIX: R$ ${formatCurrency(billing.recebimentoPix)}
--------------------------------
Qtd. Pelucias (Capacidade): ${billing.quantidadePelucia || 0}
Sobra de Pelucias: ${billing.sobraPelucia || 0}
Reposicao de Pelucias: ${billing.reposicaoPelucia || 0}
--------------------------------
ALUGUEL (PAGO AO CLIENTE): R$ ${formatCurrency(billing.aluguelValor)}
--------------------------------
*TOTAL (FIRMA): R$ ${formatCurrency(billing.valorTotal)}*
        `.trim();
    } else { // Mesa or Jukebox
        const totalValue = (billing.valorTotal || 0) - (billing.valorBonus || 0);
        const totalSection = (billing.valorBonus && billing.valorBonus > 0)
          ? `Subtotal (Firma): R$ ${formatCurrency(billing.valorTotal)}\n` +
            `Desconto / Bonus: - R$ ${formatCurrency(billing.valorBonus)}\n` +
            `--------------------------------\n` +
            `*TOTAL (FIRMA): R$ ${formatCurrency(totalValue)}*`
          : `*TOTAL (FIRMA): R$ ${formatCurrency(totalValue)}*`;

        if (isMesa && billing.billingType === 'monthly') {
            details = `
EQUIPAMENTO: MESA ${billing.equipmentNumero} (MENSAL)
--------------------------------
Partidas Jogadas (Periodo): ${billing.partidasJogadas}
--------------------------------
${totalSection}
            `.trim();
        } else {
            let mesaDetails = '';
            if (isMesa) {
                mesaDetails = `
Partidas Jogadas: ${billing.partidasJogadas}
Partidas Desconto: ${billing.descontoPartidas || 0}
Partidas Cobradas: ${billing.partidasCobradas || 0}
Valor Ficha: R$ ${formatCurrencyFicha(billing.valorFicha)}
--------------------------------`;
            }
            details = `
EQUIPAMENTO: ${isMesa ? `MESA ${billing.equipmentNumero}` : `JUKEBOX ${billing.equipmentNumero}`}
Leitura Anterior: ${billing.relogioAnterior}
Leitura Atual: ${billing.relogioAtual}
--------------------------------${mesaDetails}
Valor Bruto: R$ ${formatCurrency(billing.valorBruto)}
Parte Cliente: R$ ${formatCurrency(billing.parteCliente)}
--------------------------------
${totalSection}
            `.trim();
        }
    }

    let paymentDetails = '';
    if (!isProvisional && !isGrua) {
        if (billing.paymentMethod === 'misto') {
            const parts = [
                (billing.valorPagoDinheiro || 0) > 0 && `- Dinheiro: R$ ${formatCurrency(billing.valorPagoDinheiro)}`,
                (billing.valorPagoPix || 0) > 0 && `- PIX: R$ ${formatCurrency(billing.valorPagoPix)}`,
                (billing.valorDebitoNegativo || 0) > 0 && `- Negativo: R$ ${formatCurrency(billing.valorDebitoNegativo)}`
            ].filter(Boolean);
            paymentDetails = `\nPAGAMENTO:\n${parts.join('\n')}`;
        } else {
            paymentDetails = `\nPagamento: ${PAYMENT_METHOD_TEXT[billing.paymentMethod as keyof typeof PAYMENT_METHOD_TEXT] || 'N/A'}`;
        }
    }

    const provisionalFooter = isProvisional ? `
--------------------------------
*Pague com PIX!*
Chave (Celular): ${PIX_KEY}
--------------------------------
*** COMPROVANTE PARA CONFERENCIA ***
*** SEM VALOR FISCAL ***` : '';

    return `*MONTANHA BILHAR & JUKEBOX*
${isProvisional ? 'DEMONSTRATIVO DE COBRANÇA' : 'ACERTO DE CONTAS'}
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
    return `*MONTANHA BILHAR & JUKEBOX*
COMPROVANTE DE PAGAMENTO DE DIVIDA
--------------------------------
CLIENTE: ${debtPayment.customerName}
DATA: ${new Date(debtPayment.paidAt).toLocaleString('pt-BR')}
--------------------------------
*VALOR PAGO: R$ ${formatCurrency(debtPayment.amountPaid)}*
Pagamento: ${PAYMENT_METHOD_TEXT[debtPayment.paymentMethod as keyof typeof PAYMENT_METHOD_TEXT] || 'N/A'}
    `.trim();
}

export function generateEquipmentLabelText(equipment: Equipment): string {
  const equipmentTypeText = {
    'mesa': 'Mesa de Sinuca',
    'jukebox': 'Jukebox',
    'grua': 'Grua de Pelucia'
  };
  
  const text = `
********************************
*  MONTANHA BILHAR E JUKEBOX   *
********************************

        EQUIPAMENTO

Tipo: ${equipmentTypeText[equipment.type]}
Numero: ${equipment.numero}

--------------------------------
ID (para QR): ${equipment.id}
  `;
  return text.trim().replace(/^\s+/gm, '');
}

export function generateCustomerLabelText(customer: Customer): string {
  const qrData = customer.id;
  return `
********************************
*  MONTANHA BILHAR E JUKEBOX   *
********************************

      ETIQUETA DE CLIENTE

Nome: ${customer.name}

--------------------------------
ID DO CLIENTE (PARA QR CODE):
${qrData}
  `.trim().replace(/^\s+/gm, '');
}

export function generateCustomerShareText(customer: Customer): string {
  let text = `*Dados do Cliente - Montanha Bilhar & Jukebox*\n\n`;
  text += `*Nome:* ${customer.name}\n`;
  text += `*Cidade:* ${customer.cidade}\n`;
  if (customer.endereco) text += `*Endereço:* ${customer.endereco}\n`;
  if (customer.telefone) text += `*Telefone:* ${customer.telefone}\n`;
  if (customer.cpfRg) text += `*CPF/RG:* ${customer.cpfRg}\n`;
  if (customer.linhaNumero) text += `*Cobrador:* ${customer.linhaNumero}\n`;
  if (customer.createdAt) text += `*Data do Contrato:* ${new Date(customer.createdAt).toLocaleDateString('pt-BR')}\n`;
  
  if ((customer.equipment || []).length > 0) {
    text += `\n*Equipamentos Instalados (${customer.equipment.length}):*\n`;
    (customer.equipment || []).forEach(eq => {
      const type = eq.type.charAt(0).toUpperCase() + eq.type.slice(1);
      text += `- ${type} Nº ${eq.numero} (Leitura: ${eq.relogioAnterior})\n`;
    });
  }

  text += `\n--------------------------------\n`;
  text += `*TERMOS DE LOCAÇÃO:*\n`;
  text += `O LOCATÁRIO RECEBE NESTA DATA O EQUIPAMENTO ACIMA IDENTIFICADO COM TODOS OS EQUIPAMENTOS INTERNOS E EXTERNOS EM PERFEITO ESTADO DE USO E CONSERVAÇÃO. O VALOR DA LOCAÇÃO SERÁ APURADO MEDIANTE O USO DO RESPECTIVO EQUIPAMENTO, SENDO QUE O PAGAMENTO OCORRERÁ NO PRAZO E NOS PERCENTUAIS ACIMA MENCIONADOS.`;

  return text.trim();
}