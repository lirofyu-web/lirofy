// types.ts
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
  mesaNumero: string;
  relogioMesaNumero: string;
  relogioMesaAnterior: number;
  valorFicha: number;
  parteFirma: number;
  parteCliente: number;
  jukeboxNumero: string;
  relogioJukeboxNumero: string;
  relogioJukeboxAnterior: number;
  porcentagemJukeboxFirma: number;
  porcentagemJukeboxCliente: number;
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
  equipment: 'mesa' | 'jukebox';
  relogioAnterior: number;
  relogioAtual: number;
  partidasJogadas: number;
  descontoPartidas: number;
  partidasCobradas: number;
  valorFicha?: number; // Only for 'mesa'
  valorTotal: number;
  parteFirma: number;
  parteCliente: number;
  settledAt: Date;
  paymentMethod: 'pix' | 'dinheiro' | 'fiado';
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