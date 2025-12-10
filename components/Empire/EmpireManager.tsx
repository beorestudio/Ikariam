import React, { useState } from 'react';
import { EmpireCity, ResourceType } from '../../types';
import ResourceIcon from '../ResourceIcon';
import { Building2, Info, ArrowUpCircle, PlayCircle, Trash2, ArrowUp, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BUILDINGS_DB } from '../../data/buildings';

interface EmpireManagerProps {
  cities: EmpireCity[];
  onOpenScriptModal: () => void;
  onSimulateData?: () => void;
  onClearData?: () => void;
}

const EmpireManager: React.FC<EmpireManagerProps> = ({ cities, onOpenScriptModal, onSimulateData, onClearData }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'buildings' | 'calculator'>('resources');

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
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-1 flex gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'resources' 
                ? 'bg-amber-100 text-amber-900 shadow-sm' 
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            Recursos & Produção
          </button>
          <button
            onClick={() => setActiveTab('buildings')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'buildings' 
                ? 'bg-amber-100 text-amber-900 shadow-sm' 
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            Edifícios
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'calculator' 
                ? 'bg-amber-100 text-amber-900 shadow-sm' 
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Calculadora de Upgrade
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
        {activeTab === 'resources' && (
           <div className="overflow-x-auto">
             <ResourceTable cities={cities} />
           </div>
        )}
        {activeTab === 'buildings' && (
           <div className="overflow-x-auto">
             <BuildingsTable cities={cities} />
           </div>
        )}
        {activeTab === 'calculator' && (
           <UpgradeCalculator cities={cities} />
        )}
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

// Upgrade Calculator Component
const UpgradeCalculator: React.FC<{ cities: EmpireCity[] }> = ({ cities }) => {
  const [selectedCityId, setSelectedCityId] = useState<number | ''>(cities[0]?.id || '');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('town_hall');
  const [userSelectedLevel, setUserSelectedLevel] = useState<number | ''>('');

  const selectedCity = cities.find(c => c.id === Number(selectedCityId));
  const selectedBuilding = BUILDINGS_DB.find(b => b.id === selectedBuildingId);
  
  // Find current level of building in the city
  const currentBuildingInstance = selectedCity?.buildings.find(b => b.buildingId === selectedBuildingId);
  const currentLevel = currentBuildingInstance ? currentBuildingInstance.level : 0;
  
  // Default target is current + 1, unless user overrides
  const targetLevel = userSelectedLevel !== '' ? Number(userSelectedLevel) : (currentLevel + 1);
  
  const costData = selectedBuilding?.costs.find(c => c.level === targetLevel);

  return (
    <div className="p-6">
        <div className="bg-amber-50 rounded-lg p-6 border border-amber-200 mb-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5" /> Configurar Objetivo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-amber-800 mb-1">Selecione a Cidade</label>
                    <select
                        className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2"
                        value={selectedCityId}
                        onChange={(e) => setSelectedCityId(Number(e.target.value))}
                    >
                        {cities.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.coords}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-amber-800 mb-1">Edifício</label>
                    <select
                        className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2"
                        value={selectedBuildingId}
                        onChange={(e) => {
                            setSelectedBuildingId(e.target.value);
                            setUserSelectedLevel(''); // Reset manual level when building changes
                        }}
                    >
                        {BUILDINGS_DB.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-amber-800 mb-1">
                        Nível Alvo {currentLevel > 0 && <span className="text-xs font-normal text-amber-600">(Atual: {currentLevel})</span>}
                    </label>
                    <select
                        className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2"
                        value={targetLevel}
                        onChange={(e) => setUserSelectedLevel(Number(e.target.value))}
                    >
                        {selectedBuilding?.costs.map(c => (
                            <option key={c.level} value={c.level}>Nível {c.level}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {selectedCity && costData ? (
            <div className="space-y-4">
               <h4 className="font-medium text-stone-700">Análise de Recursos: {selectedBuilding?.name} (Nível {targetLevel})</h4>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(costData.resources).map(([resType, amount]) => {
                      if ((amount as number) <= 0) return null;
                      
                      const type = resType as ResourceType;
                      const currentAmount = selectedCity.resources[type]?.currentAmount || 0;
                      const required = amount as number;
                      const missing = Math.max(0, required - currentAmount);
                      const percent = Math.min(100, (currentAmount / required) * 100);
                      const isReady = currentAmount >= required;

                      return (
                          <div key={type} className={`p-4 rounded-lg border ${isReady ? 'bg-green-50 border-green-200' : 'bg-white border-stone-200 shadow-sm'}`}>
                             <div className="flex justify-between items-start mb-3">
                                 <div className="flex items-center gap-2">
                                     <ResourceIcon type={type} className="w-5 h-5" />
                                     <span className="font-semibold text-stone-700">{type}</span>
                                 </div>
                                 {isReady ? (
                                     <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                                         <CheckCircle2 className="w-3 h-3" /> OK
                                     </span>
                                 ) : (
                                     <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                                         <AlertTriangle className="w-3 h-3" /> Falta
                                     </span>
                                 )}
                             </div>

                             <div className="space-y-1 mb-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Tenho:</span>
                                    <span className="font-mono font-medium text-stone-800">{currentAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Preciso:</span>
                                    <span className="font-mono font-medium text-stone-800">{required.toLocaleString()}</span>
                                </div>
                                {!isReady && (
                                     <div className="flex justify-between text-sm border-t border-dashed border-stone-200 pt-1 mt-1">
                                        <span className="text-red-500 font-medium">Faltam:</span>
                                        <span className="font-mono font-bold text-red-600">-{missing.toLocaleString()}</span>
                                    </div>
                                )}
                             </div>

                             <div className="w-full bg-stone-200 rounded-full h-2">
                                 <div 
                                     className={`h-2 rounded-full transition-all duration-500 ${isReady ? 'bg-green-500' : 'bg-amber-500'}`} 
                                     style={{ width: `${percent}%` }}
                                 />
                             </div>
                             <div className="text-right text-xs text-stone-400 mt-1">{percent.toFixed(1)}%</div>
                          </div>
                      );
                  })}
               </div>
            </div>
        ) : (
            <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200 border-dashed text-stone-400">
                Selecione uma cidade e um nível válido para ver o cálculo.
            </div>
        )}
    </div>
  );
}

export default EmpireManager;