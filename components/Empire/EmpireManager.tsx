import React, { useState, useEffect, useMemo } from 'react';
import { EmpireCity, ResourceType, ResourceAmount, INITIAL_RESOURCES, BuildingCost, Shipment, ActiveConstruction, CityProduction } from '../../types';
import ResourceIcon from '../ResourceIcon';
import { Building2, Info, ArrowUpCircle, PlayCircle, Trash2, ArrowUp, Calculator, CheckCircle2, AlertTriangle, Truck, Plus, X, Hammer, Clock, FileText, Hourglass, Zap, Compass, Target, CalendarClock, Percent, Home, Crown, ShieldCheck, TrendingUp } from 'lucide-react';
import { BUILDINGS_DB } from '../../data/buildings';

// --- UTILS ---

/**
 * Calculates the projected resource amount based on elapsed time since the last scan.
 */
const getProjectedAmount = (prod: CityProduction, updatedAt: number, now: number): number => {
  const elapsedSeconds = Math.max(0, (now - updatedAt) / 1000);
  const produced = (prod.production / 3600) * elapsedSeconds;
  return Math.min(prod.maxCapacity, Math.floor(prod.currentAmount + produced));
};

export const getReducedCosts = (baseResources: ResourceAmount, city?: EmpireCity): ResourceAmount => {
  if (!city) return baseResources;

  const getLevel = (id: string) => city.buildings.find(b => b.buildingId === id)?.level || 0;

  const reductions = {
    [ResourceType.Madeira]: Math.min(50, getLevel('carpenter')),
    [ResourceType.Vinho]: Math.min(50, getLevel('wine_cellar')),
    [ResourceType.Marmore]: Math.min(50, getLevel('architect')),
    [ResourceType.Cristal]: Math.min(50, getLevel('optician')),
    [ResourceType.Enxofre]: Math.min(50, getLevel('firework')),
  };

  const reduced: ResourceAmount = { ...INITIAL_RESOURCES };
  (Object.keys(baseResources) as ResourceType[]).forEach(type => {
    const baseValue = baseResources[type] || 0;
    const discountPercent = reductions[type] || 0;
    reduced[type] = Math.floor(baseValue * (1 - discountPercent / 100));
  });

  return reduced;
};

interface EmpireManagerProps {
  cities: EmpireCity[];
  shipments?: Shipment[];
  onOpenScriptModal: () => void;
  onSimulateData?: () => void;
  onClearData?: () => void;
  onCreateShipment?: (destination: string, missingResources: ResourceAmount, description?: string) => void;
}

const EmpireManager: React.FC<EmpireManagerProps> = ({ cities, shipments = [], onOpenScriptModal, onSimulateData, onClearData, onCreateShipment }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'buildings' | 'calculator' | 'planner'>('resources');
  const [now, setNow] = useState(Date.now());

  // Global ticker for real-time updates
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live city data with projected resources
  const liveCities = useMemo(() => {
    return cities.map(city => {
      const liveResources: { [key in ResourceType]?: CityProduction } = {};
      (Object.entries(city.resources) as [ResourceType, CityProduction][]).forEach(([type, prod]) => {
        liveResources[type] = {
          ...prod,
          currentAmount: getProjectedAmount(prod, city.updatedAt, now),
          isFull: getProjectedAmount(prod, city.updatedAt, now) >= prod.maxCapacity
        };
      });
      return { ...city, resources: liveResources };
    });
  }, [cities, now]);

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
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-1 flex gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'resources' ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            Recursos & Produção
          </button>
          <button
            onClick={() => setActiveTab('buildings')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'buildings' ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            Edifícios
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'calculator' ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Calculadora de Upgrade
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'planner' ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            Planejador Global
          </button>
        </div>
        
        <div className="flex items-center gap-3">
             {onClearData && (
               <button
                  onClick={onClearData}
                  className="bg-white hover:bg-red-50 text-stone-400 hover:text-red-600 border border-stone-200 px-3 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 text-xs"
               >
                 <Trash2 className="w-4 h-4" />
                 Limpar Dados
               </button>
             )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {activeTab === 'resources' && (
           <div className="p-6 space-y-8">
             <ActiveConstructionPanel cities={liveCities} now={now} />
             <ConstructionReadinessPanel cities={liveCities} shipments={shipments} />
             <div className="overflow-x-auto -mx-6 px-6">
               <ResourceTable cities={liveCities} />
             </div>
           </div>
        )}
        {activeTab === 'buildings' && (
           <div className="overflow-x-auto">
             <BuildingsTable cities={liveCities} />
           </div>
        )}
        {activeTab === 'calculator' && (
           <UpgradeCalculator cities={liveCities} onCreateShipment={onCreateShipment} />
        )}
        {activeTab === 'planner' && (
           <GlobalUpgradePlanner cities={liveCities} onCreateShipment={onCreateShipment} />
        )}
      </div>
      
      <div className="text-center text-xs text-stone-400 mt-4">
        Último Scan: {new Date(cities[0]?.updatedAt || Date.now()).toLocaleString()} • <span className="text-emerald-600 font-medium">Projeção em Tempo Real Ativa</span>
      </div>
    </div>
  );
};

// --- REDUCER INFO HELPER ---
const ReducerInfo: React.FC<{ city: EmpireCity }> = ({ city }) => {
    const getLevel = (id: string) => city.buildings.find(b => b.buildingId === id)?.level || 0;
    
    const reducers = [
        { name: 'Mad', lv: getLevel('carpenter'), type: ResourceType.Madeira, color: 'bg-amber-50 text-amber-700 border-amber-100' },
        { name: 'Mar', lv: getLevel('architect'), type: ResourceType.Marmore, color: 'bg-stone-50 text-stone-700 border-stone-200' },
        { name: 'Vin', lv: getLevel('wine_cellar'), type: ResourceType.Vinho, color: 'bg-rose-50 text-rose-700 border-rose-100' },
        { name: 'Cri', lv: getLevel('optician'), type: ResourceType.Cristal, color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
        { name: 'Enx', lv: getLevel('firework'), type: ResourceType.Enxofre, color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    ].filter(r => r.lv > 0);

    if (reducers.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {reducers.map(r => (
                <span key={r.name} className={`inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded border font-bold ${r.color}`}>
                    -{Math.min(50, r.lv)}% <ResourceIcon type={r.type} className="w-2.5 h-2.5" />
                </span>
            ))}
        </div>
    )
}

// --- SUB-COMPONENTS ---

const GlobalUpgradePlanner: React.FC<{
  cities: EmpireCity[],
  onCreateShipment?: (destination: string, missingResources: ResourceAmount, description?: string) => void
}> = ({ cities, onCreateShipment }) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('town_hall');
  const [targetLevel, setTargetLevel] = useState<number>(10);
  const [selectedCityIds, setSelectedCityIds] = useState<Set<number>>(new Set(cities.map(c => c.id)));

  const toggleCity = (id: number) => {
    const newSet = new Set(selectedCityIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCityIds(newSet);
  };

  const toggleAllCities = () => {
    if (selectedCityIds.size === cities.length) setSelectedCityIds(new Set());
    else setSelectedCityIds(new Set(cities.map(c => c.id)));
  };

  const selectedBuilding = BUILDINGS_DB.find(b => b.id === selectedBuildingId);

  const calculatePlan = (city: EmpireCity) => {
    const currentBuilding = city.buildings.find(b => b.buildingId === selectedBuildingId);
    const currentLevel = currentBuilding ? currentBuilding.level : 0;

    if (currentLevel >= targetLevel) return { status: 'completed', currentLevel };

    const totalCost: ResourceAmount = { ...INITIAL_RESOURCES };
    let levelsCount = 0;

    if (selectedBuilding) {
        for (let l = currentLevel + 1; l <= targetLevel; l++) {
            const costAtLevel = selectedBuilding.costs.find(c => c.level === l);
            if (costAtLevel) {
                levelsCount++;
                const reduced = getReducedCosts(costAtLevel.resources, city);
                Object.entries(reduced).forEach(([key, val]) => {
                    totalCost[key as ResourceType] = (totalCost[key as ResourceType] || 0) + (val as number);
                });
            }
        }
    }

    const missing: ResourceAmount = { ...INITIAL_RESOURCES };
    let hasMissing = false;
    let maxHoursToGather = 0;

    Object.entries(totalCost).forEach(([key, required]) => {
        const type = key as ResourceType;
        // Fix: Explicitly cast the resource data to avoid 'unknown' type errors during build
        const resData = city.resources[type] as CityProduction | undefined;
        const available = resData?.currentAmount || 0;
        const production = resData?.production || 0;
        const diff = Math.max(0, (required as number) - available);
        
        if (diff > 0) {
            missing[type] = diff;
            hasMissing = true;
            if (production > 0) {
                const hours = diff / production;
                if (hours > maxHoursToGather) maxHoursToGather = hours;
            } else {
                if (maxHoursToGather !== Infinity) maxHoursToGather = Infinity; 
            }
        }
    });

    return {
        status: hasMissing ? 'missing' : 'ready',
        currentLevel,
        levelsCount,
        totalCost,
        missing,
        maxHoursToGather
    };
  };

  return (
    <div className="p-6">
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-5">
            <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" /> Definir Plano de Evolução (Com Redutores)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Edifício Alvo</label>
                    <select
                        className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2"
                        value={selectedBuildingId}
                        onChange={(e) => setSelectedBuildingId(e.target.value)}
                    >
                        {BUILDINGS_DB.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Nível Desejado</label>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2"
                        value={targetLevel}
                        onChange={(e) => setTargetLevel(parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className="flex items-end">
                    <div className="text-sm text-amber-700 bg-amber-100 p-2 rounded w-full border border-amber-200">
                        <p>Planejando: <strong>{selectedBuilding?.name}</strong> até o <strong>Nível {targetLevel}</strong></p>
                        <p className="text-[10px] mt-1 italic text-amber-600/80">* Custos variam conforme os redutores de cada cidade.</p>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-amber-200">
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex justify-between">
                    <span>Cidades Inclusas no Plano</span>
                    <button onClick={toggleAllCities} className="text-amber-600 hover:text-amber-800 underline text-[10px]">
                        {selectedCityIds.size === cities.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                    </button>
                </label>
                <div className="flex flex-wrap gap-2">
                    {cities.map(city => (
                        <button
                            key={city.id}
                            onClick={() => toggleCity(city.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                selectedCityIds.has(city.id)
                                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                    : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                            }`}
                        >
                            {city.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-4">
            {cities.filter(c => selectedCityIds.has(c.id)).map(city => {
                const plan = calculatePlan(city);
                const isCompleted = plan.status === 'completed';
                
                let timeString = "Pronto";
                if (!isCompleted && plan.maxHoursToGather > 0) {
                    if (plan.maxHoursToGather === Infinity) {
                        timeString = "Sem produção (∞)";
                    } else {
                        const totalSeconds = Math.floor(plan.maxHoursToGather * 3600);
                        const days = Math.floor(totalSeconds / 86400);
                        const hours = Math.floor((totalSeconds % 86400) / 3600);
                        const mins = Math.floor((totalSeconds % 3600) / 60);
                        timeString = days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`;
                    }
                }

                return (
                    <div key={city.id} className={`border rounded-lg p-4 shadow-sm transition-all ${isCompleted ? 'bg-green-50 border-green-200 opacity-70' : 'bg-white border-stone-200'}`}>
                        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                            <div className="min-w-[200px]">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-stone-800">{city.name}</h4>
                                    <span className="text-xs bg-stone-100 px-1.5 rounded text-stone-500">{city.coords}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-sm">
                                    <span className={`font-mono font-bold ${isCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                                        Lv {plan.currentLevel}
                                    </span>
                                    <ArrowUp className="w-3 h-3 text-stone-400" />
                                    <span className="font-mono font-bold text-stone-700">Lv {targetLevel}</span>
                                </div>
                                {!isCompleted && <ReducerInfo city={city} />}
                            </div>

                            {!isCompleted && (
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {Object.entries(plan.totalCost).map(([key, val]) => {
                                        if ((val as number) <= 0) return null;
                                        const type = key as ResourceType;
                                        const missingAmount = plan.missing[type] || 0;
                                        const isSafe = missingAmount <= 0;

                                        return (
                                            <div key={key} className={`text-xs p-2 rounded border ${isSafe ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                                <div className="flex items-center gap-1 mb-1">
                                                    <ResourceIcon type={type} className="w-3 h-3" />
                                                    <span className="font-semibold text-stone-700">{type.substring(0,3)}</span>
                                                </div>
                                                <div className="font-mono text-stone-600">{(val as number).toLocaleString()}</div>
                                                {!isSafe && (
                                                    <div className="text-red-600 font-bold mt-0.5">-{missingAmount.toLocaleString()}</div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="min-w-[180px] flex flex-col items-end gap-2 border-t lg:border-t-0 lg:border-l border-stone-100 pt-3 lg:pt-0 lg:pl-4">
                                {isCompleted ? (
                                    <span className="flex items-center gap-1 text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full text-sm">
                                        <CheckCircle2 className="w-4 h-4" /> Concluído
                                    </span>
                                ) : (
                                    <>
                                        <div className="text-right">
                                            <div className="text-[10px] text-stone-400 uppercase font-bold">Tempo de Coleta</div>
                                            <div className={`flex items-center justify-end gap-1 font-mono font-medium ${plan.maxHoursToGather > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                                <CalendarClock className="w-3 h-3" />
                                                {timeString}
                                            </div>
                                        </div>

                                        {plan.status === 'missing' && onCreateShipment ? (
                                            <button
                                                onClick={() => onCreateShipment(
                                                    city.name, 
                                                    plan.missing, 
                                                    `Plano: ${selectedBuilding?.name} (${plan.currentLevel}->${targetLevel})`
                                                )}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded shadow-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Truck className="w-3 h-3" />
                                                Pedir Faltantes
                                            </button>
                                        ) : (
                                            <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded">
                                                <CheckCircle2 className="w-3 h-3" /> Recursos Prontos
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

const ActiveConstructionPanel: React.FC<{ cities: EmpireCity[], now: number }> = ({ cities, now }) => {
  const activeConstructions = cities.flatMap(city => {
    if (!city.constructionQueue) return [];
    return city.constructionQueue
      .filter(c => c.endTime > now)
      .map(c => ({ ...c, city }));
  }).sort((a, b) => a.endTime - b.endTime);

  if (activeConstructions.length === 0) return null;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 mb-2">
      <h3 className="text-lg font-bold text-stone-700 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
        Construções em Andamento (Tempo Real)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeConstructions.map((item, idx) => {
            const buildingData = BUILDINGS_DB.find(b => b.id === item.buildingId);
            const costData = buildingData?.costs.find(c => c.level === item.level);
            const reducedInvested = costData ? getReducedCosts(costData.resources, item.city) : null;

            return (
                <div key={`${item.city.id}-${idx}`} className="bg-amber-50 border border-amber-200 rounded-lg p-4 relative overflow-hidden shadow-sm">
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div>
                            <div className="font-bold text-stone-800 flex items-center gap-2">
                                {buildingData?.name || item.name}
                                <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.5 rounded-full">Lv {item.level}</span>
                            </div>
                            <div className="text-xs text-stone-500 mt-1">{item.city.name} {item.city.coords}</div>
                        </div>
                        <div className="font-mono text-lg font-bold text-amber-600 bg-white px-2 py-1 rounded border border-amber-100 shadow-sm">
                            {formatTime(item.endTime - now)}
                        </div>
                    </div>

                    {reducedInvested && (
                        <div className="mt-3 relative z-10 bg-white/60 rounded p-2 border border-amber-100">
                             <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1 block">Recursos Investidos (C/ Redutores)</span>
                             <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {Object.entries(reducedInvested).map(([res, amount]) => {
                                    if ((amount as number) <= 0) return null;
                                    return (
                                        <div key={res} className="flex items-center gap-1 text-xs">
                                            <ResourceIcon type={res as ResourceType} className="w-3 h-3" />
                                            <span className="font-medium text-stone-700">{(amount as number).toLocaleString()}</span>
                                        </div>
                                    )
                                })}
                             </div>
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 h-1 bg-amber-400 animate-pulse w-full"></div>
                </div>
            )
        })}
      </div>
    </div>
  );
};

const ConstructionReadinessPanel: React.FC<{ cities: EmpireCity[], shipments: Shipment[] }> = ({ cities, shipments }) => {
  const calculateTrueCostFromNotes = (notes: string, city: EmpireCity): ResourceAmount | null => {
    if (!notes) return null;
    const lines = notes.split('\n');
    const totalCost = { ...INITIAL_RESOURCES };
    let foundAny = false;

    lines.forEach(line => {
        const match = line.match(/^\d+\.\s+(.*?)\s+(?:Nível|Level)\s+(\d+)/i);
        if (match) {
            const name = match[1].trim();
            const level = parseInt(match[2]);
            const building = BUILDINGS_DB.find(b => b.name.toLowerCase() === name.toLowerCase());
            
            if (building) {
                const cost = building.costs.find(c => c.level === level);
                if (cost) {
                    foundAny = true;
                    const reduced = getReducedCosts(cost.resources, city);
                    Object.entries(reduced).forEach(([res, amount]) => {
                        totalCost[res as ResourceType] = (totalCost[res as ResourceType] || 0) + (amount as number);
                    });
                }
            }
        }
    });

    return foundAny ? totalCost : null;
  };

  const trackedGoals = shipments
    .filter(s => s.status !== 'Concluído' && s.notes)
    .map(shipment => {
      const city = cities.find(c => c.name === shipment.destinationCity);
      if (!city) return null;
      const trueCost = calculateTrueCostFromNotes(shipment.notes || '', city);
      return { shipment, city, trueCost };
    })
    .filter(item => item !== null);

  if (trackedGoals.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-bold text-stone-700 flex items-center gap-2">
        <Hammer className="w-5 h-5 text-amber-600" />
        Status de Construção (C/ Redutores das Cidades)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {trackedGoals.map((item) => {
          if (!item) return null;
          const { shipment, city, trueCost } = item;
          const targetResources = trueCost || shipment.resources;

          let allReady = true;
          let totalProgress = 0;
          let resourceCount = 0;

          const analysis = Object.entries(targetResources)
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
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div>
                  <h4 className="font-bold text-stone-800 text-sm line-clamp-1">
                    {shipment.notes ? shipment.notes.split('\n')[0] : `Encomenda`}
                  </h4>
                  <div className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                    <span className="font-medium text-stone-600">{city.name}</span>
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

              <div className="space-y-2 relative z-10 mt-3">
                {analysis.map((res) => (
                  <div key={res.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 w-24">
                      <ResourceIcon type={res.type} className="w-3.5 h-3.5" />
                      <span className="text-stone-600 font-medium truncate">{res.type}</span>
                    </div>
                    <div className="flex-1 mx-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${res.isReady ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, (res.currentAmount / res.target) * 100)}%` }} />
                    </div>
                    <div className="text-right w-20 font-mono">
                      {res.isReady ? <span className="text-green-600 font-bold">OK</span> : <span className="text-red-500 font-medium">-{res.missing.toLocaleString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-amber-200" style={{ width: `${overallPercent}%` }}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ResourceTable: React.FC<{ cities: EmpireCity[] }> = ({ cities }) => {
  const resourceTypes = [ResourceType.Madeira, ResourceType.Vinho, ResourceType.Marmore, ResourceType.Cristal, ResourceType.Enxofre];
  
  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-stone-500 uppercase bg-stone-50 border-b border-stone-200">
        <tr>
          <th className="px-4 py-3 font-semibold text-stone-700 min-w-[220px]">Cidade & Infraestrutura</th>
          {resourceTypes.map(type => (
            <th key={type} className="px-4 py-3 text-center min-w-[140px]">
              <div className="flex items-center justify-center gap-1"><ResourceIcon type={type} className="w-4 h-4" />{type}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {cities.map((city) => {
          const thLevel = city.buildings.find(b => b.buildingId === 'town_hall')?.level || 0;
          const palaceLevel = city.buildings.find(b => b.buildingId === 'palace')?.level || city.buildings.find(b => b.buildingId === 'governor_residence')?.level || 0;
          const isPalace = city.buildings.some(b => b.buildingId === 'palace');
          
          // Determine the luxury resource by checking production
          const luxuryRes = Object.entries(city.resources).find(([type, prod]) => type !== ResourceType.Madeira && (prod as CityProduction)?.production > 0);
          const luxuryType = luxuryRes ? (luxuryRes[0] as ResourceType) : null;

          return (
            <tr key={city.id} className="hover:bg-stone-50/50">
              <td className="px-4 py-4 align-top">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 text-base">{city.name}</span>
                        {luxuryType && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-100 border border-stone-200 shadow-sm" title={`Especializada em ${luxuryType}`}>
                                <ResourceIcon type={luxuryType} className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-stone-400 font-mono font-medium">{city.coords}</span>
                        <div className="flex items-center gap-2 border-l border-stone-200 pl-2 ml-1">
                            <div className="flex items-center gap-0.5 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100" title="Câmara Municipal">
                                <Home className="w-2.5 h-2.5" /> Lv {thLevel}
                            </div>
                            <div className={`flex items-center gap-0.5 ${isPalace ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-stone-50 text-stone-600 border-stone-100'} px-1.5 py-0.5 rounded text-[10px] font-bold border`} title={isPalace ? "Palácio" : "Residência do Governador"}>
                                {isPalace ? <Crown className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />} Lv {palaceLevel}
                            </div>
                        </div>
                    </div>
                    <ReducerInfo city={city} />
                </div>
              </td>
              {resourceTypes.map(type => {
                const data = city.resources[type] as CityProduction | undefined;
                if (!data) return <td key={type} className="px-4 py-3 text-center text-stone-200 opacity-30">-</td>;
                const percent = Math.min(100, (data.currentAmount / data.maxCapacity) * 100);
                return (
                  <td key={type} className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-end text-xs">
                          <span className={`font-mono font-bold ${data.isFull ? 'text-red-600' : 'text-stone-700'}`}>
                              {data.currentAmount.toLocaleString()}
                          </span>
                          {data.production > 0 && <span className="text-green-600 font-bold text-[10px]">+{data.production}/h</span>}
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                          <div className={`h-full transition-all duration-1000 ${data.isFull ? 'bg-red-500' : percent > 90 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} />
                      </div>
                      <div className="text-[9px] text-stone-400 text-right font-medium uppercase tracking-tighter">Cap: {data.maxCapacity.toLocaleString()}</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const BuildingCell: React.FC<{ city: EmpireCity, buildingId: string }> = ({ city, buildingId }) => {
    const buildings = city.buildings.filter(b => b.buildingId === buildingId);
    if (buildings.length === 0) return <td className="px-2 py-3 text-center text-stone-200">-</td>;
    let levelDisplay: string | number = buildings[0].level;
    if (buildings.length > 1) levelDisplay = buildings.map(b => b.level).join('+');
    const showDetails = buildings.length === 1 && typeof levelDisplay === 'number';
    const buildingInfo = BUILDINGS_DB.find(b => b.id === buildingId);
    const nextLevelCost = showDetails ? buildingInfo?.costs.find(c => c.level === (levelDisplay as number) + 1) : null;
    const reducedCosts = nextLevelCost ? getReducedCosts(nextLevelCost.resources, city) : null;

    return (
        <td className="px-2 py-3 text-center text-stone-800 font-medium relative group cursor-default">
            {levelDisplay}
            {showDetails && nextLevelCost && reducedCosts && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 hidden group-hover:block">
                    <div className="bg-stone-800 text-white text-xs rounded-lg shadow-xl p-3 border border-stone-600 text-left">
                         <div className="flex items-center justify-between border-b border-stone-600 pb-2 mb-2">
                             <span className="font-semibold text-amber-400">{buildingInfo?.name}</span>
                             <span className="flex items-center text-stone-400 gap-1 bg-stone-700 px-1.5 py-0.5 rounded">{levelDisplay} <ArrowUp className="w-3 h-3" /> {nextLevelCost.level}</span>
                         </div>
                         <div className="space-y-1">
                             <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-1 flex justify-between"><span>Requisitos</span> <span className="text-emerald-400">Descontos Aplicados</span></div>
                             <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                {Object.entries(reducedCosts).map(([res, amount]) => {
                                    if ((amount as number) <= 0) return null;
                                    return (
                                        <div key={res} className="flex items-center justify-between">
                                            <div className="flex items-center gap-1"><ResourceIcon type={res as ResourceType} className="w-3 h-3" /><span className="text-stone-300">{res.substring(0,3)}</span></div>
                                            <span className="font-mono text-white">{(amount as number).toLocaleString()}</span>
                                        </div>
                                    )
                                })}
                             </div>
                         </div>
                    </div>
                </div>
            )}
        </td>
    );
};

const BuildingsTable: React.FC<{ cities: EmpireCity[] }> = ({ cities }) => {
  const keyBuildings = [{ id: 'town_hall', label: 'Câmara' }, { id: 'academy', label: 'Academia' }, { id: 'warehouse', label: 'Armazém' }, { id: 'tavern', label: 'Taberna' }, { id: 'palace', label: 'Palácio' }, { id: 'governor_residence', label: 'Res. Gov' }, { id: 'barracks', label: 'Quartel' }, { id: 'shipyard', label: 'Estaleiro' }, { id: 'trading_port', label: 'Porto' }, { id: 'town_wall', label: 'Muralha' }];
  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-stone-500 uppercase bg-stone-50 border-b border-stone-200">
        <tr>
          <th className="px-4 py-3 font-semibold text-stone-700 sticky left-0 bg-stone-50 z-10">Cidade</th>
          {keyBuildings.map(b => (<th key={b.id} className="px-2 py-3 text-center w-16">{b.label}</th>))}
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {cities.map((city) => (
          <tr key={city.id} className="hover:bg-stone-50/50">
            <td className="px-4 py-3 font-medium text-stone-800 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              <span>{city.name}</span><br/><span className="text-xs text-stone-400 font-mono">{city.coords}</span>
            </td>
            {keyBuildings.map(b => (<BuildingCell key={b.id} city={city} buildingId={b.id} />))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

interface QueueItem {
    uid: string;
    buildingId: string;
    buildingName: string;
    level: number;
    costs: ResourceAmount;
}

const UpgradeCalculator: React.FC<{ 
  cities: EmpireCity[],
  onCreateShipment?: (destination: string, missingResources: ResourceAmount, description?: string) => void 
}> = ({ cities, onCreateShipment }) => {
  const [selectedCityId, setSelectedCityId] = useState<number | ''>(cities[0]?.id || '');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('town_hall');
  const [userSelectedLevel, setUserSelectedLevel] = useState<number | ''>('');
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const selectedCity = cities.find(c => c.id === Number(selectedCityId));
  const selectedBuilding = BUILDINGS_DB.find(b => b.id === selectedBuildingId);
  const currentBuildingInstance = selectedCity?.buildings.find(b => b.buildingId === selectedBuildingId);
  const currentLevel = currentBuildingInstance ? currentBuildingInstance.level : 0;
  
  const getNextDefaultLevel = () => {
     const inQueueCount = queue.filter(i => i.buildingId === selectedBuildingId).length;
     return currentLevel + 1 + inQueueCount;
  };

  const targetLevel = userSelectedLevel !== '' ? Number(userSelectedLevel) : getNextDefaultLevel();
  const costData = selectedBuilding?.costs.find(c => c.level === targetLevel);

  const addToQueue = () => {
     if (queue.length >= 10) { alert("Máximo de 10 construções na fila."); return; }
     if (!selectedBuilding || !costData || !selectedCity) return;

     const reduced = getReducedCosts(costData.resources, selectedCity);

     const newItem: QueueItem = {
         uid: crypto.randomUUID(),
         buildingId: selectedBuilding.id,
         buildingName: selectedBuilding.name,
         level: targetLevel,
         costs: reduced
     };

     setQueue([...queue, newItem]);
     setUserSelectedLevel('');
  };

  const removeFromQueue = (uid: string) => setQueue(queue.filter(i => i.uid !== uid));
  const clearQueue = () => setQueue([]);

  const totalQueueCost: ResourceAmount = { ...INITIAL_RESOURCES };
  queue.forEach(item => {
      Object.entries(item.costs).forEach(([key, val]) => {
          totalQueueCost[key as ResourceType] = (totalQueueCost[key as ResourceType] || 0) + (val as number);
      });
  });

  const missingResources: ResourceAmount = { ...INITIAL_RESOURCES };
  let hasMissingResources = false;
  let maxTimeHours = 0;

  if (selectedCity) {
      Object.entries(totalQueueCost).forEach(([resType, amount]) => {
          if ((amount as number) > 0) {
              const type = resType as ResourceType;
              const resData = selectedCity.resources[type] as CityProduction | undefined;
              const currentAmount = resData?.currentAmount || 0;
              const prodPerHour = resData?.production || 0;
              const missing = Math.max(0, (amount as number) - currentAmount);
              
              if (missing > 0) { 
                missingResources[type] = missing; 
                hasMissingResources = true; 
                if (prodPerHour > 0) {
                    const hours = missing / prodPerHour;
                    if (hours > maxTimeHours) maxTimeHours = hours;
                } else {
                    maxTimeHours = Infinity;
                }
              }
          }
      });
  }

  const formatTime = (hours: number) => {
    if (hours === 0) return "Pronto";
    if (hours === Infinity) return "Produção Inexistente (∞)";
    const totalSeconds = Math.floor(hours * 3600);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
  };

  const queueDescription = queue.length > 0 
    ? "Fila de Evolução:\n" + queue.map((i, idx) => `${idx + 1}. ${i.buildingName} Nível ${i.level}`).join('\n')
    : undefined;

  return (
    <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-4 space-y-6">
                <div className="bg-amber-50 rounded-lg p-5 border border-amber-200 shadow-sm">
                    <h3 className="text-md font-semibold text-amber-900 mb-4 flex items-center gap-2 border-b border-amber-200 pb-2">
                        <Calculator className="w-5 h-5" /> Configurar Fila (Máx 10)
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Cidade Alvo</label>
                            <select className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2 text-sm" value={selectedCityId} onChange={(e) => { setQueue([]); setSelectedCityId(Number(e.target.value)); }}>
                                {cities.map(c => (<option key={c.id} value={c.id}>{c.name} {c.coords}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Edifício</label>
                            <select className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2 text-sm" value={selectedBuildingId} onChange={(e) => { setSelectedBuildingId(e.target.value); setUserSelectedLevel(''); }}>
                                {BUILDINGS_DB.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Nível {currentLevel > 0 && <span className="font-normal text-amber-600">(Atual: {currentLevel})</span>}</label>
                            <div className="flex gap-2">
                                <select className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white p-2 text-sm" value={targetLevel} onChange={(e) => setUserSelectedLevel(Number(e.target.value))}>
                                    {selectedBuilding?.costs.map(c => (<option key={c.level} value={c.level}>Nível {c.level}</option>))}
                                </select>
                                <button onClick={addToQueue} disabled={!selectedCity || !costData || queue.length >= 10} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-md shadow-sm transition-colors flex items-center justify-center min-w-[40px]"><Plus className="w-5 h-5" /></button>
                            </div>
                        </div>
                        {selectedCity && <ReducerInfo city={selectedCity} />}
                    </div>
                </div>
                {queue.length > 0 && (
                    <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden flex flex-col max-h-[400px]">
                        <div className="bg-stone-50 px-4 py-2 border-b border-stone-200 flex justify-between items-center flex-shrink-0">
                            <span className="text-xs font-bold text-stone-600 uppercase">Itens na Fila ({queue.length}/10)</span>
                            <button onClick={clearQueue} className="text-[10px] text-red-500 hover:text-red-700 underline">Limpar tudo</button>
                        </div>
                        <ul className="divide-y divide-stone-100 overflow-y-auto">
                            {queue.map((item, idx) => (
                                <li key={item.uid} className="px-4 py-3 flex justify-between items-center hover:bg-stone-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex-shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-stone-800 truncate">{item.buildingName}</div>
                                            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Custo Reduzido</div>
                                            <div className="text-xs text-stone-500">Nível {item.level}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromQueue(item.uid)} className="text-stone-400 hover:text-red-500 p-1 rounded-full hover:bg-stone-100 flex-shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div className="xl:col-span-8">
                {selectedCity && queue.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
                            <div className="space-y-1">
                                <h4 className="font-bold text-stone-700 text-lg flex items-center gap-2">
                                    Comparação de Recursos em Tempo Real
                                    <span className="inline-block animate-pulse w-2 h-2 rounded-full bg-emerald-500" />
                                </h4>
                                <p className="text-xs text-stone-500">Cidade Alvo: <strong>{selectedCity.name}</strong> • Total acumulado para {queue.length} construções</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {hasMissingResources && (
                                    <div className="text-right hidden sm:block">
                                        <div className="text-[10px] text-stone-400 uppercase font-bold">Tempo Estimado Coleta</div>
                                        <div className="text-amber-600 font-mono font-bold flex items-center justify-end gap-1">
                                            <Hourglass className="w-3 h-3" />
                                            {formatTime(maxTimeHours)}
                                        </div>
                                    </div>
                                )}
                                {hasMissingResources && onCreateShipment && (
                                    <button onClick={() => onCreateShipment(selectedCity.name, missingResources, queueDescription)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-md flex items-center gap-2">
                                        <Truck className="w-4 h-4" />
                                        Gerar Encomenda Faltantes
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(totalQueueCost).map(([resType, amount]) => {
                                if ((amount as number) <= 0) return null;
                                const type = resType as ResourceType;
                                const resData = selectedCity.resources[type] as CityProduction | undefined;
                                const currentAmount = resData?.currentAmount || 0;
                                const required = amount as number;
                                const missing = Math.max(0, required - currentAmount);
                                const isReady = currentAmount >= required;
                                const progress = Math.min(100, (currentAmount / required) * 100);

                                return (
                                    <div key={type} className={`p-4 rounded-lg border relative overflow-hidden group ${isReady ? 'bg-green-50 border-green-200' : 'bg-white border-stone-200 shadow-sm'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <ResourceIcon type={type} className="w-5 h-5" />
                                                <span className="font-semibold text-stone-700">{type}</span>
                                            </div>
                                            {isReady ? (
                                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                                    <CheckCircle2 className="w-3 h-3" /> PRONTO
                                                </span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                                    <TrendingUp className="w-3 h-3" /> FALTA
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2 mb-3">
                                            <div className="flex justify-between text-xs items-end">
                                                <span className="text-stone-500 font-medium">Atualmente:</span>
                                                <span className={`font-mono font-bold text-sm ${isReady ? 'text-green-700' : 'text-stone-800'}`}>
                                                    {currentAmount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs items-end">
                                                <span className="text-stone-500 font-medium">Requisitado:</span>
                                                <span className="font-mono text-stone-600">
                                                    {required.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-100">
                                                <div className={`h-full transition-all duration-500 ${isReady ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${progress}%` }} />
                                            </div>
                                            {!isReady && (
                                                <div className="flex justify-between text-xs border-t border-dashed border-stone-200 pt-2 mt-2">
                                                    <span className="text-red-500 font-bold uppercase tracking-tighter">Diferença:</span>
                                                    <span className="font-mono font-bold text-red-600">-{missing.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Background Progress Bar for aesthetics */}
                                        <div className="absolute bottom-0 left-0 h-0.5 bg-stone-100 w-full">
                                            <div className={`h-full ${isReady ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-stone-50 rounded-lg border border-stone-200 border-dashed text-stone-400 min-h-[300px]">
                        <Calculator className="w-12 h-12 mb-4 text-stone-300" />
                        <h4 className="text-lg font-medium text-stone-500">Calculadora de Evolução</h4>
                        <p className="max-w-xs mx-auto mt-2 text-sm">
                            Selecione uma cidade e adicione construções à fila para ver em tempo real o que falta para completar seus objetivos.
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

export default EmpireManager;