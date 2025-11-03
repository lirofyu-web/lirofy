// types.ts
export interface Equipment {
  id: string;
  type: 'mesa' | 'jukebox';
  numero: string; // ex: "101" ou "A-05"
  relogioNumero: string; // ex: "M-S99" ou "R-J12"
  relogioAnterior: number;
  
  // Mesa specific
  valorFicha?: number;
  parteFirma?: number;
  parteCliente?: number;

  // Jukebox specific
  porcentagemJukeboxFirma?: number;
  porcentagemJukeboxCliente?: number;
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
  equipmentType: 'mesa' | 'jukebox';
  equipmentId: string;
  equipmentNumero: string;
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