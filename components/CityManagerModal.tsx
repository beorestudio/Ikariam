import React, { useState } from 'react';
import { X, Plus, MapPin, Trash2, Building2 } from 'lucide-react';

interface CityManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: string[];
  onAddCity: (city: string) => void;
  onRemoveCity: (city: string) => void;
}

const CityManagerModal: React.FC<CityManagerModalProps> = ({
  isOpen,
  onClose,
  cities,
  onAddCity,
  onRemoveCity,
}) => {
  const [newCity, setNewCity] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCity.trim()) {
      onAddCity(newCity.trim());
      setNewCity('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-[#8B4513] px-4 py-3 flex justify-between items-center">
             <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Minhas Cidades
             </h3>
             <button onClick={onClose} className="text-amber-200 hover:text-white">
                <X className="w-5 h-5" />
             </button>
          </div>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <p className="text-sm text-stone-500 mb-4">
              Cadastre suas cidades aqui para que elas apareçam como sugestão rápida na hora de criar rotas logísticas.
            </p>

            {/* Add Form */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Nome da cidade..."
                className="flex-1 rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2 border bg-stone-50 text-stone-800"
              />
              <button
                type="submit"
                disabled={!newCity.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </button>
            </form>

            {/* List */}
            <div className="bg-stone-50 rounded-md border border-stone-200 min-h-[150px] max-h-[300px] overflow-y-auto p-2">
               {cities.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-stone-400 py-8">
                    <Building2 className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm">Nenhuma cidade cadastrada.</span>
                 </div>
               ) : (
                 <ul className="space-y-2">
                   {cities.map((city, idx) => (
                     <li key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-stone-200 shadow-sm">
                        <span className="font-medium text-stone-700">{city}</span>
                        <button 
                          onClick={() => onRemoveCity(city)}
                          className="text-stone-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </li>
                   ))}
                 </ul>
               )}
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityManagerModal;