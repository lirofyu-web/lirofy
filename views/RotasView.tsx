// views/RotasView.tsx
import React, { useMemo } from 'react';
import { Customer } from '../types';
import MapComponent from '../components/MapComponent';
import PageHeader from '../components/PageHeader';
import { PrinterIcon } from '../components/icons/PrinterIcon';

interface RotasViewProps {
  customers: Customer[];
}

const RotasView: React.FC<RotasViewProps> = ({ customers }) => {
  const customersWithCoords = useMemo(() => {
    return customers.filter(c => c.latitude != null && c.longitude != null);
  }, [customers]);

  const handlePrintRoute = () => {
    const customersByCity = customers.reduce((acc, customer) => {
        const city = customer.cidade.trim() || 'Sem Cidade';
        if (!acc[city]) {
            acc[city] = [];
        }
        acc[city].push(customer);
        return acc;
    }, {} as Record<string, Customer[]>);

    const sortedCities = Object.keys(customersByCity).sort((a, b) => a.localeCompare(b));

    const reportHtml = `
      <html>
      <head>
          <title>Rota de Cobrança</title>
          <style>
              body { font-family: Arial, sans-serif; font-size: 9pt; color: #333; }
              @page { size: A4; margin: 15mm; }
              h1 { text-align: center; font-size: 14pt; margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ccc; padding: 4px; text-align: left; vertical-align: middle; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .city-header td {
                  font-size: 11pt;
                  font-weight: bold;
                  background-color: #e0e0e0;
                  text-align: center;
                  padding: 5px;
              }
              .debt-info { color: #D32F2F; font-weight: bold; }
              .col-check { width: 30px; text-align: center; }
              .col-cliente { width: 25%; }
              .col-endereco { width: 45%; }
              .col-divida { width: 20%; }
              .checkbox {
                  width: 12px;
                  height: 12px;
                  border: 1px solid #333;
                  display: inline-block;
              }
              .cliente-info { display: block; font-weight: bold; }
              .tel-info { font-size: 8pt; color: #555; }
          </style>
      </head>
      <body>
          <h1>Rota de Cobrança</h1>
          <table>
              <thead>
                  <tr>
                      <th class="col-check">Vis.</th>
                      <th class="col-cliente">Cliente / Telefone</th>
                      <th class="col-endereco">Endereço</th>
                      <th class="col-divida">Dívida / Obs.</th>
                  </tr>
              </thead>
              <tbody>
                  ${sortedCities.map(city => {
                      const cityHeader = `<tr class="city-header"><td colspan="4">${city}</td></tr>`;
                      const customerRows = customersByCity[city].map(customer => `
                          <tr>
                              <td class="col-check"><span class="checkbox"></span></td>
                              <td>
                                  <span class="cliente-info">${customer.name}</span>
                                  ${customer.telefone ? `<span class="tel-info">${customer.telefone}</span>` : ''}
                              </td>
                              <td>${customer.endereco}</td>
                              <td>
                                  ${customer.debtAmount > 0 ? `<span class="debt-info">R$ ${customer.debtAmount.toFixed(2)}</span>` : `<span>-</span>`}
                              </td>
                          </tr>
                      `).join('');
                      return cityHeader + customerRows;
                  }).join('')}
              </tbody>
          </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    } else {
        alert('Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.');
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <PageHeader
          title="Rotas de Clientes"
          subtitle="Visualize a localização dos seus clientes e imprima sua rota de cobrança."
        />
        <button 
          onClick={handlePrintRoute}
          className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors mt-4 sm:mt-0"
        >
          <PrinterIcon className="w-5 h-5" />
          <span>Imprimir Rota</span>
        </button>
      </div>

      <div className="mt-8">
        {customers.length > 0 ? (
          <MapComponent customers={customersWithCoords as (Customer & { latitude: number; longitude: number; })[]} />
        ) : (
           <div className="text-center py-16 bg-slate-800 rounded-lg border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-2">Nenhum Cliente Cadastrado</h2>
            <p className="text-slate-400">Adicione um cliente para vê-lo no mapa.</p>
          </div>
        )}
         {customers.length > 0 && customersWithCoords.length === 0 && (
           <div className="text-center py-16 bg-slate-800 rounded-lg border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-2">Nenhum Cliente com Endereço Válido</h2>
            <p className="text-slate-400">Adicione ou edite um cliente com um endereço completo para vê-lo no mapa.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RotasView;