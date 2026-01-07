// views/ClientesView.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Customer, Billing, DebtPayment, Equipment, Warning } from '../types';
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
import { QrCodeIcon } from '../components/icons/QrCodeIcon';
import QrScannerModal from '../components/QrScannerModal';
import ShareCustomerModal from '../components/ShareCustomerModal';

interface ClientesViewProps {
  customers: Customer[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'lastVisitedAt'>) => Promise<void>;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (customerId: string) => void;
  onAddBilling: (billing: Billing) => void;
  onPayDebt: (customerId: string, amountPaid: number, paymentMethod: 'pix' | 'dinheiro') => void;
  billings: Billing[];
  debtPayments: DebtPayment[];
  warnings: Warning[];
  isSaving: boolean;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  onTriggerProvisionalReceiptAction: (billing: Billing, onComplete: () => void) => void;
  onPrintCustomer: (customer: Customer) => void;
}

type EquipmentFilter = 'all' | 'mesa' | 'jukebox' | 'grua';

const ClientesView: React.FC<ClientesViewProps> = ({ 
    customers, 
    onAddCustomer, 
    onUpdateCustomer, 
    onDeleteCustomer, 
    onAddBilling, 
    onPayDebt, 
    billings, 
    debtPayments, 
    warnings,
    isSaving,
    showNotification,
    onTriggerProvisionalReceiptAction,
    onPrintCustomer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  
  // Modal states
  const [billingCustomer, setBillingCustomer] = useState<Customer | null>(null);
  const [billingEquipment, setBillingEquipment] = useState<Equipment | null>(null);
  const [selectingEquipmentFor, setSelectingEquipmentFor] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [payingDebtCustomer, setPayingDebtCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [sharingCustomer, setSharingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers
        .filter(customer => {
            // Search query filter
            if (!searchQuery) return true;
            return customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   customer.cidade.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   customer.linhaNumero.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .filter(customer => {
            // Equipment filter
            if (equipmentFilter === 'all') return true;
            return customer.equipment.some(e => e.type === equipmentFilter);
        });
  }, [customers, searchQuery, equipmentFilter]);

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

  const handleOpenShareModal = useCallback((customer: Customer) => {
    setSharingCustomer(customer);
  }, []);
  
  const handleBillCustomer = useCallback((customer: Customer) => {
    if (customer.equipment?.length === 1) {
      setBillingCustomer(customer);
      setBillingEquipment(customer.equipment[0]);
    } else if (customer.equipment?.length > 1) {
      setSelectingEquipmentFor(customer);
    } else {
      showNotification("Este cliente não possui equipamentos para faturar.", "error");
    }
  }, [showNotification]);

  const handleEquipmentSelectForBilling = useCallback((equipment: Equipment) => {
    if (selectingEquipmentFor) {
      setBillingCustomer(selectingEquipmentFor);
      setBillingEquipment(equipment);
      setSelectingEquipmentFor(null);
    }
  }, [selectingEquipmentFor]);

  const handleScanSuccess = useCallback((decodedText: string) => {
      setIsScannerOpen(false);
      try {
          // First, try to parse as JSON for equipment QR codes
          const data = JSON.parse(decodedText);
          if (data.type === 'equipment' && data.id) {
              let foundCustomer: Customer | null = null;
              let foundEquipment: Equipment | null = null;
              for (const customer of customers) {
                  const eq = customer.equipment.find(e => e.id === data.id);
                  if (eq) {
                      foundCustomer = customer;
                      foundEquipment = eq;
                      break;
                  }
              }

              if (foundCustomer && foundEquipment) {
                  showNotification(`Equipamento ${foundEquipment.numero} de ${foundCustomer.name} encontrado!`, 'success');
                  setBillingCustomer(foundCustomer);
                  setBillingEquipment(foundEquipment);
              } else {
                  showNotification("Equipamento não encontrado ou não associado a um cliente.", "error");
              }
              return;
          }
      } catch (e) {
          // If JSON parsing fails, assume it's a plain customer ID
          const customer = customers.find(c => c.id === decodedText);
          if (customer) {
              showNotification(`Cliente ${customer.name} encontrado!`, 'success');
              handleBillCustomer(customer);
          } else {
              showNotification("QR Code inválido. Não corresponde a um cliente ou equipamento conhecido.", "error");
          }
      }
  }, [customers, showNotification, handleBillCustomer]);

  return (
    <>
      <PageHeader title="Clientes" subtitle="Gerencie seus clientes e equipamentos." />

      <div className="mb-8">
        <AddCustomerForm customers={customers} onAddCustomer={onAddCustomer} isSaving={isSaving} showNotification={showNotification} />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="relative flex-grow w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Filtrar por nome, cidade ou linha..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
            <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors"
            >
                <QrCodeIcon className="w-5 h-5" />
                <span>Escanear QR Code</span>
            </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={() => setEquipmentFilter('all')} className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'all' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Todos</button>
            <button onClick={() => setEquipmentFilter('mesa')} className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'mesa' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Mesas</button>
            <button onClick={() => setEquipmentFilter('jukebox')} className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'jukebox' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Jukebox</button>
            <button onClick={() => setEquipmentFilter('grua')} className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'grua' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Gruas</button>
        </div>
      </div>
      
      <div className="space-y-8">
        {sortedCities.length > 0 ? sortedCities.map(city => (
            <section key={city}>
                <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 border-b-2 border-slate-200 dark:border-slate-700 pb-2 capitalize">{city}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {customersByCity[city].map(customer => {
                        const hasActiveWarning = warnings.some(w => w.customerId === customer.id && !w.isResolved);
                        return (
                            <CustomerCard
                                key={customer.id}
                                customer={customer}
                                onBill={handleBillCustomer}
                                onEdit={setEditingCustomer}
                                onDelete={() => setDeletingCustomer(customer)}
                                onPayDebt={setPayingDebtCustomer}
                                onHistory={setHistoryCustomer}
                                onShare={handleOpenShareModal}
                                hasActiveWarning={hasActiveWarning}
                            />
                        );
                    })}
                </div>
            </section>
        )) : (
            <p className="text-center py-10 text-slate-500 dark:text-slate-400">
                Nenhum cliente encontrado para os filtros selecionados.
            </p>
        )}
      </div>
      
      {/* Modals */}
      {isScannerOpen && (
        <QrScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          showNotification={showNotification}
        />
      )}
      
      {sharingCustomer && (
        <ShareCustomerModal
            isOpen={!!sharingCustomer}
            onClose={() => setSharingCustomer(null)}
            customer={sharingCustomer}
            showNotification={showNotification}
            onPrintCustomer={onPrintCustomer}
        />
      )}

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
            customers={customers}
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