// types.ts
export interface Equipment {
  id: string;
  type: 'mesa' | 'jukebox' | 'grua';
  numero: string; // ex: "101" ou "A-05"
  relogioNumero?: string; // ex: "M-S99" ou "R-J12"
  relogioAnterior: number;
  
  // Mesa specific
  valorFicha?: number;
  parteFirma?: number;
  parteCliente?: number;

  // Jukebox specific
  porcentagemJukeboxFirma?: number;
  porcentagemJukeboxCliente?: number;

  // Grua de Pelucia specific
  aluguelPercentual?: number; // aluguel %
  aluguelValor?: number; // aluguel R$
  saldo?: number; // saldo R$
  quantidadePelucia?: number; // quantidade de pelucia
  reposicaoPelucia?: number; // reposição pelucia
  recebimentoEspecie?: number; // recebimento via especie
  recebimentoPix?: number; // recebimento pix
}

export interface Customer {
  id: string;
  createdAt: Date;
  name: string;
  cpfRg: string;
  cidade: string;
  endereco: string;
  telefone: string;
  latitude: number | null;
  longitude: number | null;
  equipment: Equipment[];
  linhaNumero: string;
  assinaturaFirma: string;
  assinaturaCliente: string;
  debtAmount: number;
  lastVisitedAt: Date | null;
}

export interface Billing {
  id: string;
  customerId: string;
  customerName: string;
  equipmentType: 'mesa' | 'jukebox' | 'grua';
  equipmentId: string;
  equipmentNumero: string;
  relogioAnterior: number;
  relogioAtual: number;
  partidasJogadas: number; // For all: relogioAtual - relogioAnterior
  settledAt: Date;
  
  // Mesa specific
  descontoPartidas?: number;
  partidasCobradas?: number;
  valorFicha?: number;
  valorBruto?: number;

  // Mesa & Jukebox calculation result
  parteFirma?: number;
  parteCliente?: number;
  
  // Grua specific
  aluguelPercentual?: number;
  aluguelValor?: number;
  saldo?: number;
  quantidadePelucia?: number;
  sobraPelucia?: number;
  reposicaoPelucia?: number;
  recebimentoEspecie?: number;
  recebimentoPix?: number;

  // Universal
  valorTotal: number; // The final value for the company
  paymentMethod: 'pix' | 'dinheiro' | 'fiado' | 'misto'; // Fiado will not be an option for grua
  valorPagoDinheiro?: number;
  valorPagoPix?: number;
  valorPagoFiado?: number;
}


export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
}

export interface DebtPayment {
  id: string;
  customerId: string;
  customerName: string;
  amountPaid: number;
  paidAt: Date;
  paymentMethod: 'pix' | 'dinheiro';
}

export interface PixSticker {
  id: string;
  number: string;
  imageDataUrl: string;
}