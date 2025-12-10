import React, { useState, useEffect } from 'react';
import { Shipment, ResourceType, ResourceAmount, INITIAL_RESOURCES } from '../types';
import ResourceIcon from './ResourceIcon';
import { X, Save, AlertCircle } from 'lucide-react';

interface ShipmentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (id: string, amounts: ResourceAmount) => void;
  shipment: Shipment | null;
}

const ShipmentRegistrationModal: React.FC<ShipmentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  shipment,
}) => {
  const [inputs, setInputs] = useState<ResourceAmount>(INITIAL_RESOURCES);

  // Reset inputs when modal opens or shipment changes
  useEffect(() => {
    if (isOpen) {
      setInputs(INITIAL_RESOURCES);
    }
  }, [isOpen, shipment]);

  if (!isOpen || !shipment) return null;

  const handleInputChange = (type: ResourceType, value: string) => {
    const numValue = parseInt(value) || 0;
    setInputs((prev) => ({
      ...prev,
      [type]: Math.max(0, numValue),
    }));
  };

  const adjustResource = (type: ResourceType, amount: number, remaining: number) => {
    setInputs((prev) => {
      const current = prev[type] || 0;
      const newValue = Math.min(remaining, current + amount);
      return {
        ...prev,
        [type]: newValue,
      };
    });
  };

  const setMaxResource = (type: ResourceType, max: number) => {
    setInputs((prev) => ({
      ...prev,
      [type]: max,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(shipment.id, inputs);
    onClose();
  };

  // Only show resources that are part of the original request and not fully shipped
  const activeResources = Object.values(ResourceType).filter((type) => {
    const total = shipment.resources[type];
    const shipped = shipment.shippedResources[type];
    return total > 0 && shipped < total;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Registrar Envio Parcial
                  </h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4 text-sm text-gray-500">
                  <p>Origem: <span className="font-semibold">{shipment.sourceCity}</span></p>
                  <p>Destino: <span className="font-semibold">{shipment.destinationCity}</span></p>
                </div>

                <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
                  {activeResources.length === 0 ? (
                    <div className="p-4 bg-green-50 text-green-700 rounded-md flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Esta encomenda já está completa!
                    </div>
                  ) : (
                    activeResources.map((type) => {
                      const total = shipment.resources[type];
                      const shipped = shipment.shippedResources[type];
                      const remaining = total - shipped;
                      
                      return (
                        <div key={type} className="bg-stone-50 p-3 rounded-md border border-stone-200">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <ResourceIcon type={type} className="w-5 h-5 mr-2" />
                              <span className="font-medium text-stone-700">{type}</span>
                            </div>
                            <span className="text-xs font-semibold text-stone-500">
                              Restam: {remaining.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              value={inputs[type] || ''}
                              onChange={(e) => handleInputChange(type, e.target.value)}
                              placeholder={`Máx: ${remaining}`}
                              className="block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border bg-white"
                            />
                            <span className="text-xs text-stone-400 whitespace-nowrap">
                              / {remaining}
                            </span>
                          </div>

                          <div className="flex justify-end gap-1 mt-2 flex-wrap">
                            <button 
                              type="button" 
                              onClick={() => adjustResource(type, 500, remaining)}
                              className="px-2 py-1 text-[10px] bg-white hover:bg-amber-50 text-stone-600 hover:text-amber-800 rounded border border-stone-200 transition-colors shadow-sm"
                            >
                              +500
                            </button>
                             <button 
                              type="button" 
                              onClick={() => adjustResource(type, 1000, remaining)}
                              className="px-2 py-1 text-[10px] bg-white hover:bg-amber-50 text-stone-600 hover:text-amber-800 rounded border border-stone-200 transition-colors shadow-sm"
                            >
                              +1k
                            </button>
                             <button 
                              type="button" 
                              onClick={() => adjustResource(type, 5000, remaining)}
                              className="px-2 py-1 text-[10px] bg-white hover:bg-amber-50 text-stone-600 hover:text-amber-800 rounded border border-stone-200 transition-colors shadow-sm"
                            >
                              +5k
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setMaxResource(type, remaining)}
                              className="px-2 py-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 rounded border border-amber-200 transition-colors shadow-sm font-medium"
                            >
                              Máx
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </form>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              form="register-form"
              disabled={activeResources.length === 0}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm ${activeResources.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="w-4 h-4 mr-2" />
              Confirmar Envio
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentRegistrationModal;