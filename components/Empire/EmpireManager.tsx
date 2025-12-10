import React, { useState } from 'react';
import { EmpireCity, ResourceType, ResourceAmount, INITIAL_RESOURCES, BuildingCost, Shipment } from '../../types';
import ResourceIcon from '../ResourceIcon';
import { Building2, Info, ArrowUpCircle, PlayCircle, Trash2, ArrowUp, Calculator, CheckCircle2, AlertTriangle, Truck, Plus, X, Hammer, Clock } from 'lucide-react';
import { BUILDINGS_DB } from '../../data/buildings';

interface EmpireManagerProps {
  cities: EmpireCity[];
  shipments?: Shipment[]; // Add shipments prop
  onOpenScriptModal: () => void;
  onSimulateData?: () => void;
  onClearData?: () => void;
  onCreateShipment?: (destination: string, missingResources: ResourceAmount, description?: string) => void;
}

const EmpireManager: React.FC<EmpireManagerProps> = ({ cities, shipments = [], onOpenScriptModal, onSimulateData, onClearData, onCreateShipment }) => {
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
            Fila de Construção
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
           <div className="p-6 space-y-8">
             {/* New Panel for Construction Readiness */}
             <ConstructionReadinessPanel cities={cities} shipments={shipments} />
             
             <div className="overflow-x-auto -mx-6 px-6">
               <ResourceTable cities={cities} />
             </div>
           </div>
        )}
        {activeTab === 'buildings' && (
           <div className="overflow-x-auto">
             <BuildingsTable cities={cities} />
           </div>
        )}
        {activeTab === 'calculator' && (
           <UpgradeCalculator cities={cities} onCreateShipment={onCreateShipment} />
        )}
      </div>
      
      <div className="text-center text-xs text-stone-400 mt-4">
        Dados atualizados em: {new Date(cities[0]?.updatedAt || Date.now()).toLocaleString()}
      </div>
    </div>
  );
};

// --- Sub-components ---

// --- NEW COMPONENT: CONSTRUCTION READINESS PANEL ---
const ConstructionReadinessPanel: React.FC<{ cities: EmpireCity[], shipments: Shipment[] }> = ({ cities, shipments }) => {
  // Filter active shipments that have notes (implying a construction goal)
  // and match them with existing cities in the empire data
  const trackedGoals = shipments
    .filter(s => s.status !== 'Concluído')
    .map(shipment => {
      const city = cities.find(c => c.name === shipment.destinationCity);
      return { shipment, city };
    })
    // Only show if we found the city in our empire data
    .filter(item => item.city !== undefined);

  if (trackedGoals.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-bold text-stone-700 flex items-center gap-2">
        <Hammer className="w-5 h-5 text-amber-600" />
        Status de Construção (Metas Ativas)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {trackedGoals.map(({ shipment, city }) => {
          if (!city) return null; // TS Check

          // Calculate readiness
          let allReady = true;
          let totalProgress = 0;
          let resourceCount = 0;

          const analysis = Object.entries(shipment.resources)
            .filter(([_, amount]) => (amount as number) > 0)
            .map(([res, targetAmount]) => {
              const type = res as ResourceType;
              const currentAmount = city.resources[type]?.currentAmount || 0;
              const target = targetAmount as number;
              const isReady = currentAmount >= target;
              const missing = Math.max(0, target - currentAmount);
              
              if (!isReady) allReady = false;
              resourceCount++;
              totalProgress += Math.min(1, currentAmount / target);

              return { type, currentAmount, target, isReady, missing };
            });

          const overallPercent = resourceCount > 0 ? (totalProgress / resourceCount) * 100 : 100;

          return (
            <div key={shipment.id} className={`rounded-lg border shadow-sm p-4 relative overflow-hidden transition-all hover:shadow-md ${allReady ? 'bg-green-50 border-green-200' : 'bg-white border-stone-200'}`}>
              
              {/* Header */}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div>
                  <h4 className="font-bold text-stone-800 text-sm line-clamp-1" title={shipment.notes || 'Encomenda sem descrição'}>
                    {shipment.notes ? shipment.notes.split('\n')[0] : `Encomenda de ${new Date(shipment.createdAt).toLocaleDateString()}`}
                  </h4>
                  <div className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                    <span className="font-medium text-stone-600">{city.name}</span>
                    <span className="text-stone-300">•</span>
                    <span className="bg-stone-100 px-1.5 rounded text-[10px]">{city.coords}</span>
                  </div>
                </div>
                
                {allReady ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-sm">
                    <CheckCircle2 className="w-3 h-3" /> PRONTO
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-sm">
                    <Clock className="w-3 h-3" /> Aguardando
                  </span>
                )}
              </div>

              {/* Resource List */}
              <div className="space-y-2 relative z-10 mt-3">
                {analysis.map((res) => (
                  <div key={res.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 w-24">
                      <ResourceIcon type={res.type} className="w-3.5 h-3.5" />
                      <span className="text-stone-600 font-medium truncate">{res.type}</span>
                    </div>
                    
                    <div className="flex-1 mx-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${res.isReady ? 'bg-green-500' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, (res.currentAmount / res.target) * 100)}%` }}
                      />
                    </div>

                    <div className="text-right w-20 font-mono">
                      {res.isReady ? (
                        <span className="text-green-600 font-bold">OK</span>
                      ) : (
                        <span className="text-red-500 font-medium">-{res.missing.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Background Status Bar */}
              {!allReady && (
                 <div className="absolute bottom-0 left-0 h-1 bg-amber-200" style={{ width: `${overallPercent}%` }}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

// Queue Item Interface
interface QueueItem {
    uid: string;
    buildingId: string;
    buildingName: string;
    level: number;
    costs: ResourceAmount;
}

// Upgrade Calculator Component
const UpgradeCalculator: React.FC<{ 
  cities: EmpireCity[],
  onCreateShipment?: (destination: string, missingResources: ResourceAmount, description?: string) => void 
}> = ({ cities, onCreateShipment }) => {
  const [selectedCityId, setSelectedCityId] = useState<number | ''>(cities[0]?.id || '');
  
  // Selection State
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('town_hall');
  const [userSelectedLevel, setUserSelectedLevel] = useState<number | ''>('');

  // Queue State
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const selectedCity = cities.find(c => c.id === Number(selectedCityId));
  const selectedBuilding = BUILDINGS_DB.find(b => b.id === selectedBuildingId);
  
  // Find current level of building in the city (to help with default selections)
  const currentBuildingInstance = selectedCity?.buildings.find(b => b.buildingId === selectedBuildingId);
  // If multiple (e.g. warehouses), we pick max level for simplicity or user must be aware. 
  // Ideally user knows which specific instance, but for resource calc, usually we want next level.
  const currentLevel = currentBuildingInstance ? currentBuildingInstance.level : 0;
  
  // Smart default logic:
  // If user selected a level manually, use it.
  // Otherwise, default to Current + 1 + (items in queue for this building).
  const getNextDefaultLevel = () => {
     const inQueueCount = queue.filter(i => i.buildingId === selectedBuildingId).length;
     return currentLevel + 1 + inQueueCount;
  };

  const targetLevel = userSelectedLevel !== '' ? Number(userSelectedLevel) : getNextDefaultLevel();
  const costData = selectedBuilding?.costs.find(c => c.level === targetLevel);

  // Add to Queue Handler
  const addToQueue = () => {
     if (queue.length >= 4) {
         alert("Máximo de 4 construções na fila.");
         return;
     }
     if (!selectedBuilding || !costData) return;

     const newItem: QueueItem = {
         uid: crypto.randomUUID(),
         buildingId: selectedBuilding.id,
         buildingName: selectedBuilding.name,
         level: targetLevel,
         costs: costData.resources
     };

     setQueue([...queue, newItem]);
     setUserSelectedLevel(''); // Reset manual selection to trigger auto-next
  };

  const removeFromQueue = (uid: string) => {
      setQueue(queue.filter(i => i.uid !== uid));
  };

  const clearQueue = () => setQueue([]);

  // Calculations for Total Queue
  const totalQueueCost: ResourceAmount = { ...INITIAL_RESOURCES };
  queue.forEach(item => {
      Object.entries(item.costs).forEach(([key, val]) => {
          totalQueueCost[key as ResourceType] = (totalQueueCost[key as ResourceType] || 0) + val;
      });
  });

  const missingResources: ResourceAmount = { ...INITIAL_RESOURCES };
  let hasMissingResources = false;

  if (selectedCity) {
      Object.entries(totalQueueCost).forEach(([resType, amount]) => {
          if ((amount as number) > 0) {
              const type = resType as ResourceType;
              const currentAmount = selectedCity.resources[type]?.currentAmount || 0;
              const missing = Math.max(0, (amount as number) - currentAmount);
              if (missing > 0) {
                  missingResources[type] = missing;
                  hasMissingResources = true;
              }
          }
      });
  }

  // Generate description for shipment
  const queueDescription = queue.length > 0 
    ? "Lista de Construção:\n" + queue.map((i, idx) => `${idx + 1}. ${i.buildingName} Nível ${i.level}`).join('\n')
    : undefined;

  // Handle City Change (Clear queue to avoid confusion)
  const handleCityChange = (newId: number) => {
      if (queue.length > 0) {
          if(confirm("Mudar de cidade limpará a fila atual. Deseja continuar?")) {
              setQueue([]);
              setSelectedCityId(newId);
          }
      } else {
          setSelectedCityId(newId);
      }
  };

  return (
    <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left Panel: Configuration */}
            <div className="xl:col-span-4 space-y-6">
                <div className="bg-amber-50 rounded-lg p-5 border border-amber-200">
                    <h3 className="text-md font-semibold text-amber-900 mb-4 flex items-center gap-2 border-b border-amber-200 pb-2">
                        <Calculator className="w-5 h-5" /> Configurar Fila
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Cidade Alvo</label>
                            <select
                                className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2 text-sm"
                                value={selectedCityId}
                                onChange={(e) => handleCityChange(Number(e.target.value))}
                            >
                                {cities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} {c.coords}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Edifício</label>
                            <select
                                className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2 text-sm"
                                value={selectedBuildingId}
                                onChange={(e) => {
                                    setSelectedBuildingId(e.target.value);
                                    setUserSelectedLevel(''); 
                                }}
                            >
                                {BUILDINGS_DB.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">
                                Nível {currentLevel > 0 && <span className="font-normal text-amber-600">(Atual na cidade: {currentLevel})</span>}
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2 text-sm"
                                    value={targetLevel}
                                    onChange={(e) => setUserSelectedLevel(Number(e.target.value))}
                                >
                                    {selectedBuilding?.costs.map(c => (
                                        <option key={c.level} value={c.level}>Nível {c.level}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={addToQueue}
                                    disabled={!selectedCity || !costData || queue.length >= 4}
                                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-md shadow-sm transition-colors flex items-center justify-center min-w-[40px]"
                                    title="Adicionar à Fila"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-[10px] text-amber-700/60 mt-1 text-right">
                                {queue.length}/4 itens na fila
                            </p>
                        </div>
                    </div>
                </div>

                {/* Queue List Preview */}
                {queue.length > 0 && (
                    <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                        <div className="bg-stone-50 px-4 py-2 border-b border-stone-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-stone-600 uppercase">Itens na Fila</span>
                            <button onClick={clearQueue} className="text-[10px] text-red-500 hover:text-red-700 underline">Limpar tudo</button>
                        </div>
                        <ul className="divide-y divide-stone-100">
                            {queue.map((item, idx) => (
                                <li key={item.uid} className="px-4 py-3 flex justify-between items-center hover:bg-stone-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <div className="text-sm font-medium text-stone-800">{item.buildingName}</div>
                                            <div className="text-xs text-stone-500">Nível {item.level}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFromQueue(item.uid)}
                                        className="text-stone-400 hover:text-red-500 p-1 rounded-full hover:bg-stone-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Right Panel: Analysis */}
            <div className="xl:col-span-8">
                {selectedCity && queue.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
                            <div>
                                <h4 className="font-bold text-stone-700 text-lg">Análise de Recursos da Fila</h4>
                                <p className="text-xs text-stone-500">Total acumulado para {queue.length} construções</p>
                            </div>
                            
                            {hasMissingResources && onCreateShipment && (
                                <button
                                    onClick={() => onCreateShipment(selectedCity.name, missingResources, queueDescription)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <Truck className="w-4 h-4" />
                                    Criar Encomenda com Lista
                                </button>
                            )}
                        </div>
                    
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(totalQueueCost).map(([resType, amount]) => {
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
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-stone-50 rounded-lg border border-stone-200 border-dashed text-stone-400 min-h-[300px]">
                        <Calculator className="w-12 h-12 mb-4 text-stone-300" />
                        <h4 className="text-lg font-medium text-stone-500">A fila está vazia</h4>
                        <p className="max-w-xs mx-auto mt-2 text-sm">Adicione construções à esquerda para calcular os custos totais e gerar encomendas unificadas.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

export default EmpireManager;