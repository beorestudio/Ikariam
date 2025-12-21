import React, { useState, useEffect } from 'react';
import { Shipment, ResourceType, INITIAL_RESOURCES, ResourceAmount, EmpireCity } from './types';
import ShipmentForm from './components/ShipmentForm';
import ShipmentList from './components/ShipmentList';
import ResourceStats from './components/ResourceStats';
import { PackageOpen, MapPin, Castle, Anchor, RotateCw, Trash2 } from 'lucide-react';
import CityManagerModal from './components/CityManagerModal';
import EmpireManager from './components/Empire/EmpireManager';
import TampermonkeyModal from './components/Empire/TampermonkeyModal';
import { MOCK_EMPIRE_DATA } from './data/mockEmpire';

const App: React.FC = () => {
  const SHIPMENTS_KEY = 'ikariam_manager_shipments_v2';
  const CITIES_KEY = 'ikariam_manager_cities_v2';
  const EMPIRE_KEY = 'ikariam_manager_empire_v2';

  const [currentTab, setCurrentTab] = useState<'logistics' | 'empire'>('logistics');
  const [shipmentPrefill, setShipmentPrefill] = useState<{
    destinations: string[];
    resources: ResourceAmount;
    notes?: string;
  } | null>(null);

  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      const saved = localStorage.getItem(SHIPMENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) { return []; }
  });

  const [myCities, setMyCities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CITIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) { return []; }
  });

  const [empireData, setEmpireData] = useState<EmpireCity[]>(() => {
    try {
      const saved = localStorage.getItem(EMPIRE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) { return []; }
  });

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

  useEffect(() => { localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(shipments)); }, [shipments]);
  useEffect(() => { localStorage.setItem(CITIES_KEY, JSON.stringify(myCities)); }, [myCities]);
  useEffect(() => { localStorage.setItem(EMPIRE_KEY, JSON.stringify(empireData)); }, [empireData]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'IKARIAM_EMPIRE_DATA') {
        const newCities = event.data.payload as EmpireCity[];
        setEmpireData(newCities.sort((a, b) => a.name.localeCompare(b.name)));
        const cityNames = newCities.map(c => c.name);
        setMyCities(prev => Array.from(new Set([...prev, ...cityNames])).sort());
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleAddCity = (city: string) => {
    if (!myCities.includes(city)) setMyCities(prev => [...prev, city].sort());
  };

  const handleRemoveCity = (city: string) => {
    setMyCities(prev => prev.filter(c => c !== city));
  };

  const handleAddShipment = (source: string, destinations: string[], resources: ResourceAmount, notes?: string) => {
    const newShipments: Shipment[] = destinations.map((dest) => ({
      id: crypto.randomUUID(),
      sourceCity: source,
      destinationCity: dest,
      resources: { ...resources },
      shippedResources: { ...INITIAL_RESOURCES },
      createdAt: Date.now(),
      status: 'Pendente',
      notes: notes,
    }));
    setShipments((prev) => [...newShipments, ...prev]);
  };

  const handleDeleteShipment = (id: string) => {
    setShipments((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRegisterShipment = (id: string, sentAmounts: ResourceAmount) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newShipped = { ...s.shippedResources };
        let allCompleted = true;
        (Object.values(ResourceType) as ResourceType[]).forEach((type) => {
          newShipped[type] = (newShipped[type] || 0) + (sentAmounts[type] || 0);
          if (newShipped[type] > s.resources[type]) newShipped[type] = s.resources[type];
          if (newShipped[type] < s.resources[type]) allCompleted = false;
        });
        const totalShipped = Object.values(newShipped).reduce((a: number, b: number) => a + b, 0);
        return { ...s, shippedResources: newShipped, status: totalShipped === 0 ? 'Pendente' : allCompleted ? 'Concluído' : 'Em Andamento' };
      })
    );
  };

  const handleSimulateData = () => {
    setEmpireData(MOCK_EMPIRE_DATA);
    const cityNames = MOCK_EMPIRE_DATA.map(c => c.name);
    setMyCities(prev => Array.from(new Set([...prev, ...cityNames])).sort());
  };

  const handleClearEmpireData = () => { if (confirm('Limpar dados do império?')) setEmpireData([]); };

  const handleCreateShipmentRequest = (destination: string, missingResources: ResourceAmount, description?: string) => {
    setShipmentPrefill({ destinations: [destination], resources: missingResources, notes: description });
    setCurrentTab('logistics');
  };

  return (
    <div className="min-h-screen text-stone-800 pb-12 bg-[#fdfaf6]">
      <header className="bg-gradient-to-r from-amber-900 to-amber-800 text-amber-50 shadow-lg border-b border-amber-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10"><PackageOpen className="w-6 h-6 text-amber-100" /></div>
              <div><h1 className="text-xl font-bold tracking-tight text-white leading-tight">Ikariam Booster</h1><p className="text-amber-200/80 text-xs font-light tracking-wide">Gerenciador Estratégico</p></div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsScriptModalOpen(true)} className="bg-emerald-700/50 hover:bg-emerald-600 text-emerald-50 px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2 border border-emerald-500/30"><RotateCw className="w-3 h-3" /><span className="hidden sm:inline">Sincronizar (Script)</span></button>
            </div>
          </div>
          <div className="flex gap-1 mt-6 overflow-x-auto no-scrollbar">
            <button onClick={() => setCurrentTab('logistics')} className={`flex items-center gap-2 px-6 py-2.5 rounded-t-lg text-sm font-medium transition-all relative ${currentTab === 'logistics' ? 'bg-[#fdfaf6] text-amber-900 shadow-sm z-10 translate-y-0.5' : 'bg-amber-900/40 text-amber-200/80 hover:bg-amber-900/60 hover:text-white'}`}><Anchor className="w-4 h-4" />Logística & Encomendas</button>
            <button onClick={() => setCurrentTab('empire')} className={`flex items-center gap-2 px-6 py-2.5 rounded-t-lg text-sm font-medium transition-all relative ${currentTab === 'empire' ? 'bg-[#fdfaf6] text-amber-900 shadow-sm z-10 translate-y-0.5' : 'bg-amber-900/40 text-amber-200/80 hover:bg-amber-900/60 hover:text-white'}`}><Castle className="w-4 h-4" />Gerenciador do Império</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-[#fdfaf6] min-h-[calc(100vh-140px)]">
        {currentTab === 'logistics' ? (
          <>
            <section>
              <ShipmentForm onAddShipment={handleAddShipment} myCities={myCities} onAddCity={handleAddCity} initialData={shipmentPrefill} empireData={empireData} />
            </section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1"><div className="sticky top-8 space-y-4"><ResourceStats shipments={shipments} /><div className="flex justify-center"><button onClick={() => setIsCityModalOpen(true)} className="text-amber-700 hover:text-amber-900 text-sm font-medium underline decoration-amber-300 decoration-2 underline-offset-4 flex items-center gap-1"><MapPin className="w-3 h-3" /> Gerenciar cidades</button></div></div></div>
              <div className="lg:col-span-2"><ShipmentList shipments={shipments} onDelete={handleDeleteShipment} onRegisterShipment={handleRegisterShipment} /></div>
            </div>
          </>
        ) : (
          <EmpireManager cities={empireData} shipments={shipments} onOpenScriptModal={() => setIsScriptModalOpen(true)} onSimulateData={handleSimulateData} onClearData={handleClearEmpireData} onCreateShipment={handleCreateShipmentRequest} />
        )}
      </main>

      <CityManagerModal isOpen={isCityModalOpen} onClose={() => setIsCityModalOpen(false)} cities={myCities} onAddCity={handleAddCity} onRemoveCity={handleRemoveCity} />
      <TampermonkeyModal isOpen={isScriptModalOpen} onClose={() => setIsScriptModalOpen(false)} />
    </div>
  );
};

export default App;