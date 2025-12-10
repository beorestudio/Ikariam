import React, { useState } from 'react';
import { EmpireCity, ResourceType } from '../../types';
import ResourceIcon from '../ResourceIcon';
import { Building2, Info, ArrowUpCircle, PlayCircle, Trash2, ArrowUp } from 'lucide-react';
import { BUILDINGS_DB } from '../../data/buildings';

interface EmpireManagerProps {
  cities: EmpireCity[];
  onOpenScriptModal: () => void;
  onSimulateData?: () => void;
  onClearData?: () => void;
}

const EmpireManager: React.FC<EmpireManagerProps> = ({ cities, onOpenScriptModal, onSimulateData, onClearData }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'buildings'>('resources');

  if (cities.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-stone-200">
        <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-amber-700" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Nenhum dado do império encontrado</h2>
        <p className="text-stone-500 max-w-md mx-auto mb-6">
          Para ver seus recursos e edifícios em tempo real, você precisa instalar o script auxiliar no seu navegador.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onOpenScriptModal}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2"
          >
            <Info className="w-5 h-5" />
            Obter Script de Sincronização
          </button>
          
          {onSimulateData && (
            <button
              onClick={onSimulateData}
              className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <PlayCircle className="w-5 h-5 text-stone-500" />
              Simular Dados de Teste
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex justify-between items-center">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'resources' 
                ? 'bg-amber-100 text-amber-900 shadow-sm' 
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            Recursos & Produção
          </button>
          <button
            onClick={() => setActiveTab('buildings')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'buildings' 
                ? 'bg-amber-100 text-amber-900 shadow-sm' 
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            Edifícios
          </button>
        </div>
        
        <div className="flex items-center gap-3">
             {onClearData && (
               <button
                  onClick={onClearData}
                  className="bg-white hover:bg-red-50 text-stone-400 hover:text-red-600 border border-stone-200 px-3 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 text-xs"
                  title="Limpar todos os dados importados"
               >
                 <Trash2 className="w-4 h-4" />
                 Limpar Dados
               </button>
             )}
            {onSimulateData && (
               <button
                  onClick={onSimulateData}
                  className="text-xs text-stone-400 hover:text-amber-600 transition-colors underline"
               >
                 Recarregar Simulação
               </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'resources' ? (
            <ResourceTable cities={cities} />
          ) : (
            <BuildingsTable cities={cities} />
          )}
        </div>
      </div>
      
      <div className="text-center text-xs text-stone-400 mt-4">
        Dados atualizados em: {new Date(cities[0]?.updatedAt || Date.now()).toLocaleString()}
      </div>
    </div>
  );
};

// --- Sub-components ---

const ResourceTable: React.FC<{ cities: EmpireCity[] }> = ({ cities }) => {
  const resourceTypes = [
    ResourceType.Madeira,
    ResourceType.Vinho,
    ResourceType.Marmore,
    ResourceType.Cristal,
    ResourceType.Enxofre
  ];

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-stone-500 uppercase bg-stone-50 border-b border-stone-200">
        <tr>
          <th className="px-4 py-3 font-semibold text-stone-700">Cidade</th>
          {resourceTypes.map(type => (
            <th key={type} className="px-4 py-3 text-center min-w-[140px]">
              <div className="flex items-center justify-center gap-1">
                <ResourceIcon type={type} className="w-4 h-4" />
                {type}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {cities.map((city) => (
          <tr key={city.id} className="hover:bg-stone-50/50">
            <td className="px-4 py-3 font-medium text-stone-800">
              <div className="flex flex-col">
                <span>{city.name}</span>
                <span className="text-xs text-stone-400 font-mono">{city.coords}</span>
              </div>
            </td>
            {resourceTypes.map(type => {
              const data = city.resources[type];
              if (!data) return <td key={type} className="px-4 py-3 text-center text-stone-300">-</td>;

              const percent = Math.min(100, (data.currentAmount / data.maxCapacity) * 100);
              const isFull = percent >= 100;
              const isWarning = percent > 90;

              return (
                <td key={type} className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {/* Amount & Hourly */}
                    <div className="flex justify-between items-end text-xs">
                      <span className="font-semibold text-stone-700">{data.currentAmount.toLocaleString()}</span>
                      {data.production > 0 && (
                        <span className="text-green-600 font-medium text-[10px]">+{data.production}/h</span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isFull ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    
                    {/* Capacity */}
                    <div className="text-[10px] text-stone-400 text-right">
                      Max: {data.maxCapacity.toLocaleString()}
                    </div>
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
        {/* Totals Row */}
        <tr className="bg-amber-50/50 font-semibold border-t border-amber-100">
          <td className="px-4 py-3 text-amber-900">Total Império</td>
          {resourceTypes.map(type => {
             const totalAmount = cities.reduce((acc, c) => acc + (c.resources[type]?.currentAmount || 0), 0);
             const totalProd = cities.reduce((acc, c) => acc + (c.resources[type]?.production || 0), 0);
             
             return (
               <td key={type} className="px-4 py-3 text-center">
                 <div className="flex flex-col items-center">
                   <span className="text-stone-800">{totalAmount.toLocaleString()}</span>
                   {totalProd > 0 && <span className="text-green-600 text-xs">+{totalProd.toLocaleString()}/h</span>}
                 </div>
               </td>
             )
          })}
        </tr>
      </tbody>
    </table>
  );
};

// Helper component for building cells with tooltip
const BuildingCell: React.FC<{ city: EmpireCity, buildingId: string }> = ({ city, buildingId }) => {
    const buildings = city.buildings.filter(b => b.buildingId === buildingId);
    
    if (buildings.length === 0) {
        return <td className="px-2 py-3 text-center text-stone-200">-</td>;
    }

    // Determine level display
    let levelDisplay: string | number = buildings[0].level;
    if (buildings.length > 1) {
        levelDisplay = buildings.map(b => b.level).join('+');
    }

    // Only show detailed tooltip for single building instances (as per request)
    const showDetails = buildings.length === 1 && typeof levelDisplay === 'number';
    const buildingInfo = BUILDINGS_DB.find(b => b.id === buildingId);
    const nextLevelCost = showDetails ? buildingInfo?.costs.find(c => c.level === (levelDisplay as number) + 1) : null;

    return (
        <td className="px-2 py-3 text-center text-stone-800 font-medium relative group cursor-default">
            {levelDisplay}

            {/* Tooltip */}
            {showDetails && nextLevelCost && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 hidden group-hover:block">
                    <div className="bg-stone-800 text-white text-xs rounded-lg shadow-xl p-3 border border-stone-600">
                         {/* Header */}
                         <div className="flex items-center justify-between border-b border-stone-600 pb-2 mb-2">
                             <span className="font-semibold text-amber-400">{buildingInfo?.name}</span>
                             <span className="flex items-center text-stone-400 gap-1 bg-stone-700 px-1.5 py-0.5 rounded">
                                {levelDisplay} <ArrowUp className="w-3 h-3" /> {nextLevelCost.level}
                             </span>
                         </div>
                         
                         {/* Costs */}
                         <div className="space-y-1">
                             <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Requisitos</div>
                             <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                {Object.entries(nextLevelCost.resources).map(([res, amount]) => {
                                    if ((amount as number) <= 0) return null;
                                    return (
                                        <div key={res} className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <ResourceIcon type={res as ResourceType} className="w-3 h-3" />
                                                <span className="text-stone-300">{res.substring(0,3)}</span>
                                            </div>
                                            <span className={`font-mono ${(amount as number) > 999999 ? 'text-amber-300' : 'text-white'}`}>
                                                {(amount as number).toLocaleString()}
                                            </span>
                                        </div>
                                    )
                                })}
                             </div>
                         </div>
                         
                         {/* Arrow Tip */}
                         <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-stone-800"></div>
                    </div>
                </div>
            )}
        </td>
    );
};


const BuildingsTable: React.FC<{ cities: EmpireCity[] }> = ({ cities }) => {
  // Define key buildings to track columns for
  const keyBuildings = [
    { id: 'town_hall', label: 'Câmara' },
    { id: 'academy', label: 'Academia' },
    { id: 'warehouse', label: 'Armazém' }, // Could be multiple
    { id: 'tavern', label: 'Taberna' },
    { id: 'palace', label: 'Palácio' }, // or Gov Res
    { id: 'governor_residence', label: 'Res. Gov' },
    { id: 'barracks', label: 'Quartel' },
    { id: 'shipyard', label: 'Estaleiro' },
    { id: 'trading_port', label: 'Porto' },
    { id: 'wall', label: 'Muralha' },
  ];

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-stone-500 uppercase bg-stone-50 border-b border-stone-200">
        <tr>
          <th className="px-4 py-3 font-semibold text-stone-700 sticky left-0 bg-stone-50 z-10">Cidade</th>
          {keyBuildings.map(b => (
            <th key={b.id} className="px-2 py-3 text-center w-16" title={BUILDINGS_DB.find(x => x.id === b.id)?.name || b.label}>
              {b.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {cities.map((city) => (
          <tr key={city.id} className="hover:bg-stone-50/50">
            <td className="px-4 py-3 font-medium text-stone-800 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              <div className="flex flex-col">
                <span>{city.name}</span>
                <span className="text-xs text-stone-400 font-mono">{city.coords}</span>
              </div>
            </td>
            {keyBuildings.map(b => (
                <BuildingCell key={b.id} city={city} buildingId={b.id} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default EmpireManager;