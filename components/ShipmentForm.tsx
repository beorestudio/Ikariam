import React, { useState } from 'react';
import { ResourceType, INITIAL_RESOURCES, ResourceAmount } from '../types';
import { Plus, X, Truck, Building2, MapPin, Calculator, ChevronDown, ChevronUp, ClipboardPaste } from 'lucide-react';
import ResourceIcon from './ResourceIcon';
import { BUILDINGS_DB } from '../data/buildings';

interface ShipmentFormProps {
  onAddShipment: (source: string, destinations: string[], resources: ResourceAmount) => void;
  myCities: string[];
}

const ShipmentForm: React.FC<ShipmentFormProps> = ({ onAddShipment, myCities }) => {
  const [sourceCity, setSourceCity] = useState('');
  const [tempDestination, setTempDestination] = useState('');
  const [destinationCities, setDestinationCities] = useState<string[]>([]);
  const [resources, setResources] = useState<ResourceAmount>(INITIAL_RESOURCES);

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [targetLevel, setTargetLevel] = useState<number | ''>('');

  // Import Modal State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

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
        setResources(costData.resources);
        setShowCalculator(false); 
      } else {
        alert(`Dados de custo não encontrados para o nível ${targetLevel}.`);
      }
    }
  };

  const parseImportText = () => {
    const text = importText;
    const newResources = { ...resources };
    let found = false;

    // Helper to extract number after keyword
    // Matches patterns like "Madeira 12.345" or "Madeira: 12.345"
    const extractValue = (keyword: string): number => {
      // Regex explanation:
      // keyword: The resource name (e.g., Madeira)
      // [:\s]+: Matches colon or spaces after the name
      // ([\d\.]+): Captures the number sequence which may contain dots (1.234.567)
      const regex = new RegExp(`${keyword}[:\\s]+([\\d\\.]+)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        // Remove dots to parse as integer (PT-BR format uses dots for thousands)
        const cleanNumber = match[1].replace(/\./g, '');
        return parseInt(cleanNumber, 10);
      }
      return 0;
    };

    const madeira = extractValue('Madeira');
    const vinho = extractValue('Vinho');
    const marmore = extractValue('Mármore') || extractValue('Marmore'); // Handle accent variations
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
      alert('Não foi possível identificar recursos no texto colado. Certifique-se de copiar o texto da visão da cidade ou dos recursos.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCity || destinationCities.length === 0) return;

    // Check if at least one resource is > 0
    const hasResources = Object.values(resources).some((val) => (val as number) > 0);
    if (!hasResources) return;

    onAddShipment(sourceCity, destinationCities, resources);

    setDestinationCities([]);
    setResources(INITIAL_RESOURCES);
    setTempDestination('');
  };

  const selectedBuilding = BUILDINGS_DB.find(b => b.id === selectedBuildingId);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
      {/* Datalist for autocomplete */}
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
                title="Colar dados do jogo (Ctrl+C)"
              >
                <ClipboardPaste className="w-4 h-4" /> Importar Texto
             </button>
            <span className="text-amber-200 text-sm hidden sm:inline self-center">Configure a logística</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: Logistics Config */}
          <div className="space-y-6">
             <h3 className="text-lg font-medium text-stone-700 border-b border-stone-100 pb-2">1. Rota Logística</h3>
             
             {/* Source City */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                Cidade de Origem
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="text"
                  required
                  list="my-cities-list"
                  value={sourceCity}
                  onChange={(e) => setSourceCity(e.target.value)}
                  placeholder="Ex: Pólis Alpha"
                  className="pl-10 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-3 border bg-stone-50"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Destination Cities (Multiplier) */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                Cidades de Destino (Multiplicador: {destinationCities.length}x)
              </label>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    list="my-cities-list"
                    value={tempDestination}
                    onChange={(e) => setTempDestination(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDestination())}
                    placeholder="Digite e pressione Enter (Ex: Pólis Beta)"
                    className="pl-10 block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-3 border bg-stone-50"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDestination}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Selected Destinations Tags */}
              <div className="bg-stone-50 rounded-md p-3 min-h-[80px] border border-stone-200">
                <div className="flex flex-wrap gap-2">
                  {destinationCities.length === 0 && (
                    <span className="text-sm text-stone-400 italic">Adicione os destinos para calcular o envio...</span>
                  )}
                  {destinationCities.map((city, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-stone-200 text-stone-800 shadow-sm"
                    >
                      {city}
                      <button
                        type="button"
                        onClick={() => handleRemoveDestination(city)}
                        className="ml-2 h-4 w-4 rounded-full inline-flex items-center justify-center text-stone-400 hover:text-red-500 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Resources & Calculator */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-stone-700 border-b border-stone-100 pb-2">2. Carga de Recursos</h3>

            {/* Building Calculator Section */}
            <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-amber-900 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Calculadora de Construção (Auto-preencher)
                </div>
                {showCalculator ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showCalculator && (
                <div className="p-4 border-t border-amber-200 bg-white/50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-amber-800 mb-1">Construção</label>
                      <select 
                        className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 bg-white"
                        value={selectedBuildingId}
                        onChange={(e) => {
                          setSelectedBuildingId(e.target.value);
                          setTargetLevel('');
                        }}
                      >
                        <option value="">Selecione...</option>
                        {BUILDINGS_DB.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-amber-800 mb-1">Nível</label>
                      <select 
                        className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 bg-white"
                        value={targetLevel}
                        disabled={!selectedBuildingId}
                        onChange={(e) => setTargetLevel(Number(e.target.value))}
                      >
                        <option value="">Nível...</option>
                        {selectedBuilding?.costs.map(c => (
                          <option key={c.level} value={c.level}>{c.level}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!selectedBuildingId || targetLevel === ''}
                    onClick={handleApplyCalculator}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-xs font-medium text-white 
                      ${(!selectedBuildingId || targetLevel === '') 
                        ? 'bg-amber-300 cursor-not-allowed' 
                        : 'bg-amber-600 hover:bg-amber-700'} 
                      transition-colors`}
                  >
                    Aplicar Custos
                  </button>
                </div>
              )}
            </div>

            {/* Resources Inputs Grid */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
              <label className="block text-sm font-medium text-stone-600 mb-3">Recursos por Cidade</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(ResourceType).map((type) => (
                  <div key={type} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm hover:border-amber-300 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-stone-100 rounded-full">
                         <ResourceIcon type={type} className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-stone-700">{type}</span>
                    </div>
                    
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={resources[type] || ''}
                      onChange={(e) => handleResourceChange(type, e.target.value)}
                      placeholder="0"
                      className="block w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3 border bg-stone-50 text-right font-mono"
                    />

                    <div className="flex justify-end gap-1 mt-2">
                      <button 
                        type="button" 
                        onClick={() => adjustResource(type, 500)}
                        className="px-2 py-1 text-[10px] bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 rounded border border-stone-200 transition-colors"
                      >
                        +500
                      </button>
                       <button 
                        type="button" 
                        onClick={() => adjustResource(type, 1000)}
                        className="px-2 py-1 text-[10px] bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 rounded border border-stone-200 transition-colors"
                      >
                        +1k
                      </button>
                       <button 
                        type="button" 
                        onClick={() => adjustResource(type, 5000)}
                        className="px-2 py-1 text-[10px] bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 rounded border border-stone-200 transition-colors"
                      >
                        +5k
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-4 text-right">
                Total a enviar: <span className="font-semibold text-stone-600">{((Object.values(resources) as number[]).reduce((a, b) => a + (Number(b)||0), 0) * destinationCities.length).toLocaleString()}</span> recursos
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button Section */}
        <div className="mt-8 pt-6 border-t border-stone-200">
          <button
            type="submit"
            disabled={destinationCities.length === 0}
            className={`w-full lg:w-auto ml-auto flex justify-center items-center py-3 px-8 border border-transparent rounded-md shadow-sm text-base font-medium text-white 
              ${destinationCities.length > 0 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-md transform hover:-translate-y-0.5' 
                : 'bg-stone-300 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200`}
          >
            {destinationCities.length > 1 
              ? `Confirmar Encomenda para ${destinationCities.length} Cidades` 
              : 'Confirmar Encomenda'}
            <Truck className="ml-2 w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowImport(false)}></div>
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full z-10 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Importar Texto do Jogo</h3>
                <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-500">
                   <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Vá para a visão da cidade ou ilha no jogo, pressione <strong>Ctrl+A</strong> (Selecionar Tudo) e <strong>Ctrl+C</strong> (Copiar).
                Em seguida, cole o texto abaixo. O sistema identificará os recursos automaticamente.
              </p>
              <textarea
                className="w-full h-32 border border-stone-300 rounded-md p-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                placeholder="Cole o texto aqui..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowImport(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={parseImportText}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
                >
                  Processar e Preencher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentForm;