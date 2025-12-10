import React, { useState } from 'react';
import { Shipment, ResourceType, ResourceAmount } from '../types';
import ResourceIcon from './ResourceIcon';
import ShipmentRegistrationModal from './ShipmentRegistrationModal';
import { ArrowRight, Trash2, Truck, Check, Send, Calendar, AlertTriangle, FileText } from 'lucide-react';

interface ShipmentListProps {
  shipments: Shipment[];
  onDelete: (id: string) => void;
  onRegisterShipment: (id: string, amounts: ResourceAmount) => void;
}

const ShipmentList: React.FC<ShipmentListProps> = ({ shipments, onDelete, onRegisterShipment }) => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);

  const handleDeleteClick = (shipment: Shipment) => {
    setShipmentToDelete(shipment);
  };

  const confirmDelete = () => {
    if (shipmentToDelete) {
      onDelete(shipmentToDelete.id);
      setShipmentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShipmentToDelete(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressColor = (type: string, isComplete: boolean) => {
    if (isComplete) return 'bg-green-500';
    switch (type) {
      case ResourceType.Madeira: return 'bg-amber-700';
      case ResourceType.Vinho: return 'bg-rose-600';
      case ResourceType.Marmore: return 'bg-stone-500';
      case ResourceType.Cristal: return 'bg-cyan-600';
      case ResourceType.Enxofre: return 'bg-yellow-500';
      default: return 'bg-blue-600';
    }
  };

  const getTextColor = (type: string, isComplete: boolean) => {
    if (isComplete) return 'text-green-600';
    switch (type) {
      case ResourceType.Madeira: return 'text-amber-800';
      case ResourceType.Vinho: return 'text-rose-700';
      case ResourceType.Marmore: return 'text-stone-600';
      case ResourceType.Cristal: return 'text-cyan-700';
      case ResourceType.Enxofre: return 'text-yellow-700';
      default: return 'text-blue-700';
    }
  };

  if (shipments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow border border-stone-200 p-12 text-center">
        <div className="mx-auto h-12 w-12 text-stone-300 mb-4">
          <Truck className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-medium text-stone-900">Sem Encomendas</h3>
        <p className="mt-1 text-sm text-stone-500">Adicione uma nova encomenda usando o formulário.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
           <h2 className="font-semibold text-lg text-stone-700">Painel de Logística</h2>
            <span className="text-xs font-medium bg-stone-200 text-stone-600 px-2 py-1 rounded-full">
            Total: {shipments.length}
          </span>
        </div>

        {shipments.map((shipment) => {
           const activeResources = Object.entries(shipment.resources).filter(([_, val]) => (val as number) > 0);
           
           return (
             <div 
               key={shipment.id} 
               className={`bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden transition-shadow hover:shadow-md
                 ${shipment.status === 'Concluído' ? 'border-l-4 border-l-green-500' : 
                   shipment.status === 'Em Andamento' ? 'border-l-4 border-l-blue-500' : 
                   'border-l-4 border-l-amber-400'}
               `}
             >
               {/* Card Header */}
               <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                 
                 {/* Route Info */}
                 <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2 text-stone-800">
                        <div className="flex items-center font-medium">
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider mr-2">De</span>
                        {shipment.sourceCity}
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-400" />
                        <div className="flex items-center font-medium">
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider mr-2">Para</span>
                        {shipment.destinationCity}
                        </div>
                    </div>
                 </div>

                 {/* Actions & Meta */}
                 <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center text-xs text-stone-400 gap-2">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${shipment.status === 'Pendente' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : ''}
                          ${shipment.status === 'Em Andamento' ? 'bg-blue-50 text-blue-700 border border-blue-100' : ''}
                          ${shipment.status === 'Concluído' ? 'bg-green-50 text-green-700 border border-green-100' : ''}
                        `}>
                          {shipment.status}
                        </span>
                       <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(shipment.createdAt)}
                       </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {shipment.status !== 'Concluído' && (
                          <button
                            onClick={() => setSelectedShipment(shipment)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Registrar envio"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(shipment)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                 </div>
               </div>

               {/* Notes Section */}
               {shipment.notes && (
                   <div className="px-4 py-2 bg-yellow-50/50 border-b border-stone-100 flex items-start gap-2">
                       <FileText className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                       <p className="text-xs text-stone-600 italic leading-relaxed whitespace-pre-wrap">{shipment.notes}</p>
                   </div>
               )}

               {/* Card Body - Resource Grid */}
               <div className="p-4 bg-stone-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                     {activeResources.map(([key, total]) => {
                        const shipped = shipment.shippedResources[key as ResourceType] || 0;
                        const remaining = (total as number) - shipped;
                        const percentage = Math.min(100, (shipped / (total as number)) * 100);
                        const isComplete = remaining <= 0;
                        const barColor = getProgressColor(key, isComplete);
                        const textColor = getTextColor(key, isComplete);

                        return (
                          <div key={key} className="bg-white p-3 rounded border border-stone-100 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                               <div className="flex items-center gap-2">
                                  <ResourceIcon type={key as ResourceType} className="w-4 h-4" />
                                  <span className="text-xs font-semibold text-stone-700">{key}</span>
                               </div>
                               <span className={`text-xs font-mono ${isComplete ? 'text-green-600 font-bold' : 'text-stone-500'}`}>
                                  {shipped.toLocaleString()} <span className="text-stone-300">/</span> {(total as number).toLocaleString()}
                               </span>
                            </div>

                            <div className="relative w-full bg-stone-100 rounded-full h-2 mb-1">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-stone-400">{percentage.toFixed(0)}%</span>
                                {isComplete ? (
                                  <span className="text-green-600 flex items-center font-bold">
                                    <Check className="w-3 h-3 mr-0.5" /> OK
                                  </span>
                                ) : (
                                  <span className="text-stone-500">
                                    Faltam: <span className="font-semibold text-red-500">{remaining.toLocaleString()}</span>
                                  </span>
                                )}
                            </div>
                          </div>
                        );
                     })}
                  </div>
               </div>
             </div>
           );
        })}
      </div>

      <ShipmentRegistrationModal 
        isOpen={!!selectedShipment}
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onRegister={onRegisterShipment}
      />

      {/* Delete Confirmation Modal */}
      {shipmentToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={cancelDelete}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Excluir Encomenda
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Tem certeza que deseja excluir a encomenda de <strong>{shipmentToDelete.sourceCity}</strong> para <strong>{shipmentToDelete.destinationCity}</strong>? 
                        <br/><br/>
                        Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Excluir
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelDelete}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShipmentList;