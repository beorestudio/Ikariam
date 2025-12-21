import React, { useState, useEffect } from 'react';
import { ResourceType, INITIAL_RESOURCES, ResourceAmount, EmpireCity } from '../types';
import { Plus, X, Truck, Building2, MapPin, Calculator, ChevronDown, ChevronUp, ClipboardPaste, FileText, Percent } from 'lucide-react';
import ResourceIcon from './ResourceIcon';
import { BUILDINGS_DB } from '../data/buildings';
import { getReducedCosts } from './Empire/EmpireManager';

interface ShipmentFormProps {
  onAddShipment: (source: string, destinations: string[], resources: ResourceAmount, notes?: string) => void;
  myCities: string[];
  onAddCity: (city: string) => void;
  empireData?: EmpireCity[]; // Inject empire data to handle reductions
  initialData?: {
    destinations: string[];
    resources: ResourceAmount;
    notes?: string;
  } | null;
}

const ShipmentForm: React.FC<ShipmentFormProps> = ({ onAddShipment, myCities, onAddCity, empireData = [], initialData }) => {
  const [sourceCity, setSourceCity] = useState('');
  const [tempDestination, setTempDestination] = useState('');
  const [destinationCities, setDestinationCities] = useState<string[]>([]);
  const [resources, setResources] = useState<ResourceAmount>(INITIAL_RESOURCES);
  const [notes, setNotes] = useState('');

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [targetLevel, setTargetLevel] = useState<number | ''>('');

  // Import Modal State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  // Effect to handle pre-fill data from Empire Manager
  useEffect(() => {
    if (initialData) {
      setDestinationCities(initialData.destinations);
      setResources(initialData.resources);
      if (initialData.notes) setNotes(initialData.notes);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [initialData]);

  const handleAddDestination = () => {
    if (tempDestination.trim()) {
      if (!destinationCities.includes(tempDestination.trim())) {
        setDestinationCities([...destinationCities, tempDestination.trim()]);
      }
      setTempDestination('');
    }
  };

  const handleRemoveDestination = (city: string) => {
    setDestinationCities(destinationCities.filter((c) => c !== city));
  };

  const handleResourceChange = (type: ResourceType, value: string) => {
    const numValue = parseInt(value) || 0;
    setResources((prev) => ({
      ...prev,
      [type]: Math.max(0, numValue),
    }));
  };

  const adjustResource = (type: ResourceType, amount: number) => {
    setResources((prev) => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + amount),
    }));
  };

  const handleApplyCalculator = () => {
    const building = BUILDINGS_DB.find(b => b.id === selectedBuildingId);
    if (building && typeof targetLevel === 'number') {
      const costData = building.costs.find(c => c.level === targetLevel);
      if (costData) {
        // Try to find the reduction city (usually the first destination)
        const targetCityName = destinationCities[0];
        const targetCityData = empireData.find(c => c.name === targetCityName);
        
        // Apply reductions if city found, else use base costs
        const finalCosts = targetCityData 
            ? getReducedCosts(costData.resources, targetCityData)
            : costData.resources;

        setResources(finalCosts);
        setShowCalculator(false); 
      }
    }
  };

  const parseImportText = () => {
    const text = importText;
    const newResources = { ...resources };
    let found = false;
    const extractValue = (keyword: string): number => {
      const regex = new RegExp(`${keyword}[:\\s]+([\\d\\.]+)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const cleanNumber = match[1].replace(/\./g, '');
        return parseInt(cleanNumber, 10);
      }
      return 0;
    };
    const madeira = extractValue('Madeira');
    const vinho = extractValue('Vinho');
    const marmore = extractValue('Mármore') || extractValue('Marmore');
    const cristal = extractValue('Cristal');
    const enxofre = extractValue('Enxofre');
    if (madeira > 0) { newResources[ResourceType.Madeira] = madeira; found = true; }
    if (vinho > 0) { newResources[ResourceType.Vinho] = vinho; found = true; }
    if (marmore > 0) { newResources[ResourceType.Marmore] = marmore; found = true; }
    if (cristal > 0) { newResources[ResourceType.Cristal] = cristal; found = true; }
    if (enxofre > 0) { newResources[ResourceType.Enxofre] = enxofre; found = true; }
    if (found) {
      setResources(newResources);
      setShowImport(false);
      setImportText('');
    } else {
      alert('Recursos não encontrados no texto.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCity || destinationCities.length === 0) return;
    const hasResources = Object.values(resources).some((val) => (val as number) > 0);
    if (!hasResources) return;
    if (sourceCity.trim()) onAddCity(sourceCity.trim());
    destinationCities.forEach(city => { if (city.trim()) onAddCity(city.trim()); });
    onAddShipment(sourceCity, destinationCities, resources, notes);
    setDestinationCities([]);
    setResources(INITIAL_RESOURCES);
    setTempDestination('');
    setNotes('');
  };

  const selectedBuilding = BUILDINGS_DB.find(b => b.id === selectedBuildingId);
  const targetCityData = destinationCities.length > 0 ? empireData.find(c => c.name === destinationCities[0]) : null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
      <datalist id="my-cities-list">
        {myCities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>

      <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-6 py-4 border-b border-amber-900/10 flex items-center justify-between text-white">
        <h2 className="font-semibold text-xl flex items-center gap-2">
          <Truck className="w-6 h-6" /> Nova Encomenda
        </h2>
        <div className="flex gap-2">
             <button
                type="button"
                onClick={() => setShowImport(true)}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
              >
                <ClipboardPaste className="w-4 h-4" /> Importar Texto
             </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
             <h3 className="text-lg font-medium text-stone-700 border-b border-stone-100 pb-2">1. Rota Logística</h3>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Cidade de Origem</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 className="h-4 w-4 text-stone-400" /></div>
                <input type="text" required list="my-cities-list" value={sourceCity} onChange={(e) => setSourceCity(e.target.value)} placeholder="Ex: Pólis Alpha" className="pl-10 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-3 border bg-stone-50" autoComplete="off" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Cidades de Destino</label>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="h-4 w-4 text-stone-400" /></div>
                  <input type="text" list="my-cities-list" value={tempDestination} onChange={(e) => setTempDestination(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDestination())} placeholder="Destino..." className="pl-10 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-3 border bg-stone-50" autoComplete="off" />
                </div>
                <button type="button" onClick={handleAddDestination} className="px-4 py-2 text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm"><Plus className="w-5 h-5" /></button>
              </div>
              <div className="bg-stone-50 rounded-md p-3 min-h-[80px] border border-stone-200">
                <div className="flex flex-wrap gap-2">
                  {destinationCities.length === 0 && <span className="text-sm text-stone-400 italic">Adicione destinos...</span>}
                  {destinationCities.map((city, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-stone-200 text-stone-800 shadow-sm">
                      {city}<button type="button" onClick={() => handleRemoveDestination(city)} className="ml-2 h-4 w-4 text-stone-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Notas</label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none"><FileText className="h-4 w-4 text-stone-400" /></div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes..." className="pl-10 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-3 border bg-stone-50 h-24 resize-none" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-stone-700 border-b border-stone-100 pb-2">2. Carga de Recursos</h3>
            <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden shadow-sm">
              <button type="button" onClick={() => setShowCalculator(!showCalculator)} className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-amber-900 hover:bg-amber-100">
                <div className="flex items-center gap-2"><Calculator className="w-4 h-4" />Calculadora de Construção</div>
                {showCalculator ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showCalculator && (
                <div className="p-4 border-t border-amber-200 bg-white/50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-amber-800 mb-1">Edifício</label>
                      <select className="block w-full rounded-md border-amber-300 shadow-sm text-sm p-2 bg-white" value={selectedBuildingId} onChange={(e) => { setSelectedBuildingId(e.target.value); setTargetLevel(''); }}>
                        <option value="">Selecione...</option>
                        {BUILDINGS_DB.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-800 mb-1">Nível</label>
                      <select className="block w-full rounded-md border-amber-300 shadow-sm text-sm p-2 bg-white" value={targetLevel} disabled={!selectedBuildingId} onChange={(e) => setTargetLevel(Number(e.target.value))}>
                        <option value="">Nível...</option>
                        {selectedBuilding?.costs.map(c => (<option key={c.level} value={c.level}>{c.level}</option>))}
                      </select>
                    </div>
                  </div>
                  {targetCityData && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 p-2 rounded text-[10px] font-bold border border-emerald-100">
                          <Percent className="w-3 h-3" /> Aplicando redutores de {targetCityData.name}
                      </div>
                  )}
                  <button type="button" disabled={!selectedBuildingId || targetLevel === ''} onClick={handleApplyCalculator} className={`w-full py-2 px-4 rounded-md shadow-sm text-xs font-medium text-white transition-colors ${(!selectedBuildingId || targetLevel === '') ? 'bg-amber-300' : 'bg-amber-600 hover:bg-amber-700'}`}>Aplicar Custos</button>
                </div>
              )}
            </div>

            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 shadow-inner">
              <label className="block text-sm font-medium text-stone-600 mb-3">Recursos por Cidade</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(ResourceType).map((type) => (
                  <div key={type} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2"><ResourceIcon type={type} className="w-4 h-4" /><span className="text-sm font-medium text-stone-700">{type}</span></div>
                    <input type="number" min="0" step="1" value={resources[type] || ''} onChange={(e) => handleResourceChange(type, e.target.value)} placeholder="0" className="block w-full rounded-md border-stone-300 shadow-sm text-sm py-2 px-3 border bg-stone-50 text-right font-mono" />
                    <div className="flex justify-end gap-1 mt-2">
                      <button type="button" onClick={() => adjustResource(type, 1000)} className="px-2 py-1 text-[10px] bg-stone-100 hover:bg-amber-100 rounded border">+1k</button>
                       <button type="button" onClick={() => adjustResource(type, 5000)} className="px-2 py-1 text-[10px] bg-stone-100 hover:bg-amber-100 rounded border">+5k</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-stone-200 text-right">
          <button type="submit" disabled={destinationCities.length === 0} className={`w-full lg:w-auto px-8 py-3 rounded-md shadow-md text-base font-medium text-white transition-all ${destinationCities.length > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-stone-300 cursor-not-allowed'}`}>Confirmar Encomenda <Truck className="ml-2 inline w-5 h-5" /></button>
        </div>
      </form>
    </div>
  );
};

export default ShipmentForm;