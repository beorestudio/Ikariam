import React, { useState, useEffect } from 'react';
import { Shipment, ResourceType, INITIAL_RESOURCES, ResourceAmount, User, EmpireCity } from './types';
import ShipmentForm from './components/ShipmentForm';
import ShipmentList from './components/ShipmentList';
import ResourceStats from './components/ResourceStats';
import { PackageOpen, LogOut, User as UserIcon, MapPin, Castle, Anchor, RotateCw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import CityManagerModal from './components/CityManagerModal';
import EmpireManager from './components/Empire/EmpireManager';
import TampermonkeyModal from './components/Empire/TampermonkeyModal';
import { MOCK_EMPIRE_DATA } from './data/mockEmpire';

// --- Internal Component for the Authenticated App Content ---
const AuthenticatedApp: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Storage keys
  const SHIPMENTS_KEY = `ikariam_manager_shipments_${user?.id}`;
  const CITIES_KEY = `ikariam_manager_cities_${user?.id}`;
  const EMPIRE_KEY = `ikariam_manager_empire_${user?.id}`;

  // --- Navigation State ---
  const [currentTab, setCurrentTab] = useState<'logistics' | 'empire'>('logistics');

  // --- Shipment Prefill State (For automatic creation from Empire Manager) ---
  const [shipmentPrefill, setShipmentPrefill] = useState<{
    destinations: string[];
    resources: ResourceAmount;
    notes?: string;
  } | null>(null);

  // --- Shipments State ---
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      const saved = localStorage.getItem(SHIPMENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load shipments from storage:', error);
      return [];
    }
  });

  // --- Manual Cities State (Logistics) ---
  const [myCities, setMyCities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CITIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load cities from storage:', error);
      return [];
    }
  });

  // --- Empire Data State (Auto-Updated) ---
  const [empireData, setEmpireData] = useState<EmpireCity[]>(() => {
    try {
      const saved = localStorage.getItem(EMPIRE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

  // Persistence Effects
  useEffect(() => {
    if (user?.id) localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(shipments));
  }, [shipments, user, SHIPMENTS_KEY]);

  useEffect(() => {
    if (user?.id) localStorage.setItem(CITIES_KEY, JSON.stringify(myCities));
  }, [myCities, user, CITIES_KEY]);

  useEffect(() => {
    if (user?.id) localStorage.setItem(EMPIRE_KEY, JSON.stringify(empireData));
  }, [empireData, user, EMPIRE_KEY]);

  // --- Real-time Data Listener ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: In production, check event.origin
      // For this local/preview tool, we accept messages to allow the Tampermonkey script to work
      
      if (event.data && event.data.type === 'IKARIAM_EMPIRE_DATA') {
        console.log('Received Empire Data:', event.data.payload);
        const newCities = event.data.payload as EmpireCity[];
        
        // Merge strategy: Update existing cities, add new ones
        setEmpireData(prev => {
          const map = new Map<number, EmpireCity>();
          // Explicitly iterate to populate map to ensure type safety and avoid mixed inference
          prev.forEach(c => map.set(c.id, c));
          newCities.forEach(c => map.set(c.id, c));
          return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        });

        // Also update the "Manual Cities" list for logistics convenience
        const cityNames = newCities.map(c => c.name);
        setMyCities(prev => {
          const combined = new Set([...prev, ...cityNames]);
          return Array.from(combined).sort();
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handlers
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
        return {
          ...s,
          shippedResources: newShipped,
          status: totalShipped === 0 ? 'Pendente' : allCompleted ? 'Concluído' : 'Em Andamento',
        };
      })
    );
  };

  // Simulate Data Handler
  const handleSimulateData = () => {
    setEmpireData(MOCK_EMPIRE_DATA);
    // Also update myCities for consistency
    const cityNames = MOCK_EMPIRE_DATA.map(c => c.name);
    setMyCities(prev => {
        const combined = new Set([...prev, ...cityNames]);
        return Array.from(combined).sort();
    });
  };

  // Clear Empire Data Handler
  const handleClearEmpireData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados do império? Isso removerá as cidades importadas.')) {
        setEmpireData([]);
        localStorage.removeItem(EMPIRE_KEY);
    }
  };

  // Handle Create Shipment Request from Empire Manager
  const handleCreateShipmentRequest = (destination: string, missingResources: ResourceAmount, description?: string) => {
    setShipmentPrefill({
      destinations: [destination],
      resources: missingResources,
      notes: description
    });
    setCurrentTab('logistics');
  };

  return (
    <div className="min-h-screen text-stone-800 pb-12 bg-[#fdfaf6]">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-900 to-amber-800 text-amber-50 shadow-lg border-b border-amber-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                <PackageOpen className="w-6 h-6 text-amber-100" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-tight">Ikariam Booster</h1>
                <p className="text-amber-200/80 text-xs font-light tracking-wide">Gerenciador Estratégico</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsScriptModalOpen(true)}
                className="bg-emerald-700/50 hover:bg-emerald-600 text-emerald-50 px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2 border border-emerald-500/30"
                title="Conectar ao Jogo"
              >
                <RotateCw className="w-3 h-3" />
                <span className="hidden sm:inline">Sincronizar (Script)</span>
              </button>

              <div className="h-8 w-px bg-amber-700/50 mx-1 hidden md:block"></div>

              <div className="flex flex-col items-end mr-1">
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">Imperador</span>
                <span className="text-sm font-medium flex items-center gap-1 text-white">
                  <UserIcon className="w-3 h-3" /> {user?.username}
                </span>
              </div>
              <button 
                onClick={logout}
                className="bg-amber-950/30 hover:bg-amber-950/60 text-amber-100 p-2 rounded-md transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setCurrentTab('logistics')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-t-lg text-sm font-medium transition-all relative ${
                currentTab === 'logistics' 
                  ? 'bg-[#fdfaf6] text-amber-900 shadow-sm z-10 translate-y-0.5' 
                  : 'bg-amber-900/40 text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <Anchor className="w-4 h-4" />
              Logística & Encomendas
            </button>
            <button
              onClick={() => setCurrentTab('empire')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-t-lg text-sm font-medium transition-all relative ${
                currentTab === 'empire' 
                  ? 'bg-[#fdfaf6] text-amber-900 shadow-sm z-10 translate-y-0.5' 
                  : 'bg-amber-900/40 text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
              }`}
            >
              <Castle className="w-4 h-4" />
              Gerenciador do Império
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-[#fdfaf6] min-h-[calc(100vh-140px)]">
        
        {currentTab === 'logistics' ? (
          <>
            <section>
              <ShipmentForm 
                onAddShipment={handleAddShipment} 
                myCities={myCities}
                onAddCity={handleAddCity}
                initialData={shipmentPrefill}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                 <div className="sticky top-8 space-y-4">
                   <ResourceStats shipments={shipments} />
                   <div className="flex justify-center">
                      <button 
                        onClick={() => setIsCityModalOpen(true)}
                        className="text-amber-700 hover:text-amber-900 text-sm font-medium underline decoration-amber-300 decoration-2 underline-offset-4 flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" /> Gerenciar lista de cidades
                      </button>
                   </div>
                 </div>
              </div>

              <div className="lg:col-span-2">
                <ShipmentList 
                  shipments={shipments} 
                  onDelete={handleDeleteShipment} 
                  onRegisterShipment={handleRegisterShipment}
                />
              </div>
            </div>
          </>
        ) : (
          <EmpireManager 
            cities={empireData} 
            onOpenScriptModal={() => setIsScriptModalOpen(true)}
            onSimulateData={handleSimulateData}
            onClearData={handleClearEmpireData}
            onCreateShipment={handleCreateShipmentRequest}
          />
        )}
      </main>

      {/* Modals */}
      <CityManagerModal 
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        cities={myCities}
        onAddCity={handleAddCity}
        onRemoveCity={handleRemoveCity}
      />

      <TampermonkeyModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
      />
    </div>
  );
};

// ... AppContent and App Wrapper remain same ...
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6] text-amber-800">Carregando império...</div>;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <AuthenticatedApp />;
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;