// views/ClientesView.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Customer, Billing, DebtPayment, Equipment } from '../types';
import AddCustomerForm from '../components/AddCustomerForm';
import CustomerCard from '../components/CustomerCard';
import PageHeader from '../components/PageHeader';
import BillingModal from '../components/BillingModal';
import EditCustomerModal from '../components/EditCustomerModal';
import DebtPaymentModal from '../components/DebtPaymentModal';
import HistoryModal from '../components/HistoryModal';
import ActionModal from '../components/ActionModal';
import { SearchIcon } from '../components/icons/SearchIcon';
import EquipmentSelectionModal from '../components/EquipmentSelectionModal';

interface ClientesViewProps {
  customers: Customer[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'lastVisitedAt'>) => Promise<void>;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (customerId: string) => void;
  onAddBilling: (billing: Billing) => void;
  onPayDebt: (customerId: string, amountPaid: number, paymentMethod: 'pix' | 'dinheiro') => void;
  billings: Billing[];
  debtPayments: DebtPayment[];
  isSaving: boolean;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  onTriggerProvisionalReceiptAction: (billing: Billing, onComplete: () => void) => void;
}

const ClientesView: React.FC<ClientesViewProps> = ({ 
    customers, 
    onAddCustomer, 
    onUpdateCustomer, 
    onDeleteCustomer, 
    onAddBilling, 
    onPayDebt, 
    billings, 
    debtPayments, 
    isSaving,
    showNotification,
    onTriggerProvisionalReceiptAction
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [billingCustomer, setBillingCustomer] = useState<Customer | null>(null);
  const [billingEquipment, setBillingEquipment] = useState<Equipment | null>(null);
  const [selectingEquipmentFor, setSelectingEquipmentFor] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [payingDebtCustomer, setPayingDebtCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) {
      return customers;
    }
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.cidade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.linhaNumero.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const customersByCity = useMemo(() => {
    const grouped = filteredCustomers.reduce((acc, customer) => {
        const city = customer.cidade.trim() || 'Sem Cidade';
        if (!acc[city]) {
            acc[city] = [];
        }
        acc[city].push(customer);
        return acc;
    }, {} as Record<string, Customer[]>);

    // Sort customers within each city by name
    for (const city in grouped) {
        grouped[city].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }, [filteredCustomers]);

  const sortedCities = useMemo(() => Object.keys(customersByCity).sort((a, b) => a.localeCompare(b)), [customersByCity]);
  
  const handleConfirmDelete = useCallback(() => {
    if (deletingCustomer) {
      onDeleteCustomer(deletingCustomer.id);
      setDeletingCustomer(null);
    }
  }, [deletingCustomer, onDeleteCustomer]);

  const handleShareCustomer = useCallback((customer: Customer) => {
    const customerDataToShare = {
      name: customer.name,
      cpfRg: customer.cpfRg,
      cidade: customer.cidade,
      endereco: customer.endereco,
      telefone: customer.telefone,
      linhaNumero: customer.linhaNumero,
      latitude: customer.latitude,
      longitude: customer.longitude,
      equipment: customer.equipment.map(({ id, ...rest }) => rest) // Remove runtime ID
    };

    const textToCopy = JSON.stringify(customerDataToShare, null, 2);

    if (navigator.share) {
      navigator.share({
        title: `Dados do Cliente: ${customer.name}`,
        text: textToCopy,
      }).then(() => {
        showNotification('Cliente compartilhado com sucesso!');
      }).catch((error) => console.error('Erro ao compartilhar', error));
    } else {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification('Dados do cliente copiados para a área de transferência!');
      }).catch(err => {
        showNotification('Erro ao copiar dados.', 'error');
        console.error('Could not copy text: ', err);
      });
    }
  }, [showNotification]);

  const handleEquipmentSelectForBilling = useCallback((equipment: Equipment) => {
    if (selectingEquipmentFor) {
      setBillingCustomer(selectingEquipmentFor);
      setBillingEquipment(equipment);
      setSelectingEquipmentFor(null);
    }
  }, [selectingEquipmentFor]);

  return (
    <>
      <PageHeader title="Clientes" subtitle="Gerencie seus clientes e equipamentos." />

      <div className="mb-8">
        <AddCustomerForm onAddCustomer={onAddCustomer} isSaving={isSaving} showNotification={showNotification} />
      </div>

      <div className="bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-700 mb-8">
         <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-slate-400" />
            </div>
            <input
                type="text"
                placeholder="Filtrar por nome, cidade ou linha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
        </div>
      </div>
      
      <div className="space-y-8">
        {sortedCities.length > 0 ? sortedCities.map(city => (
            <section key={city}>
                <h2 className="text-xl font-bold text-emerald-400 mb-4 border-b-2 border-slate-700 pb-2 capitalize">{city}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {customersByCity[city].map(customer => (
                        <CustomerCard
                            key={customer.id}
                            customer={customer}
                            onBill={setSelectingEquipmentFor}
                            onEdit={setEditingCustomer}
                            onDelete={() => setDeletingCustomer(customer)}
                            onPayDebt={setPayingDebtCustomer}
                            onHistory={setHistoryCustomer}
                            onShare={handleShareCustomer}
                        />
                    ))}
                </div>
            </section>
        )) : (
            <p className="text-center py-10 text-slate-400">
                Nenhum cliente encontrado.
            </p>
        )}
      </div>
      
      {/* Modals */}
      {selectingEquipmentFor && (
        <EquipmentSelectionModal
          isOpen={!!selectingEquipmentFor}
          onClose={() => setSelectingEquipmentFor(null)}
          customer={selectingEquipmentFor}
          onSelect={handleEquipmentSelectForBilling}
        />
      )}

      {billingCustomer && billingEquipment && (
        <BillingModal
            isOpen={!!billingCustomer && !!billingEquipment}
            onClose={() => {
              setBillingCustomer(null);
              setBillingEquipment(null);
            }}
            onConfirm={(billing) => {
                onAddBilling(billing);
                setBillingCustomer(null);
                setBillingEquipment(null);
            }}
            customer={billingCustomer}
            equipment={billingEquipment}
            onTriggerProvisionalReceiptAction={onTriggerProvisionalReceiptAction}
        />
      )}
      
      {editingCustomer && (
        <EditCustomerModal
            isOpen={!!editingCustomer}
            onClose={() => setEditingCustomer(null)}
            onConfirm={async (customer) => {
                await onUpdateCustomer(customer);
                setEditingCustomer(null);
            }}
            customer={editingCustomer}
            isSaving={isSaving}
            showNotification={showNotification}
        />
      )}

      {payingDebtCustomer && (
        <DebtPaymentModal
            isOpen={!!payingDebtCustomer}
            onClose={() => setPayingDebtCustomer(null)}
            onConfirm={(amount, method) => {
                onPayDebt(payingDebtCustomer.id, amount, method);
                setPayingDebtCustomer(null);
            }}
            customer={payingDebtCustomer}
        />
      )}

      {historyCustomer && (
        <HistoryModal
            isOpen={!!historyCustomer}
            onClose={() => setHistoryCustomer(null)}
            customer={historyCustomer}
            billings={billings}
            debtPayments={debtPayments}
        />
      )}

      {deletingCustomer && (
        <ActionModal
            isOpen={!!deletingCustomer}
            onClose={() => setDeletingCustomer(null)}
            onConfirm={handleConfirmDelete}
            title="Confirmar Exclusão"
            confirmText="Sim, Excluir"
        >
            <p>Tem certeza que deseja excluir <strong>{deletingCustomer.name}</strong>? Todo o histórico de cobranças e dívidas associado a este cliente também será apagado. Esta ação não pode ser desfeita.</p>
        </ActionModal>
      )}

    </>
  );
};

export default ClientesView;