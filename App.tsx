import React, { useState, useEffect } from 'react';
import { Shipment, ResourceType, INITIAL_RESOURCES, ResourceAmount, User } from './types';
import ShipmentForm from './components/ShipmentForm';
import ShipmentList from './components/ShipmentList';
import ResourceStats from './components/ResourceStats';
import { PackageOpen, LogOut, User as UserIcon, MapPin } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import CityManagerModal from './components/CityManagerModal';

// --- Internal Component for the Authenticated App Content ---
const AuthenticatedApp: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Storage keys
  const SHIPMENTS_KEY = `ikariam_manager_shipments_${user?.id}`;
  const CITIES_KEY = `ikariam_manager_cities_${user?.id}`;

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

  // --- Cities State ---
  const [myCities, setMyCities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CITIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load cities from storage:', error);
      return [];
    }
  });
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // Persistence Effects
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(shipments));
    }
  }, [shipments, user, SHIPMENTS_KEY]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(CITIES_KEY, JSON.stringify(myCities));
    }
  }, [myCities, user, CITIES_KEY]);

  // City Handlers
  const handleAddCity = (city: string) => {
    if (!myCities.includes(city)) {
      setMyCities(prev => [...prev, city].sort());
    }
  };

  const handleRemoveCity = (city: string) => {
    setMyCities(prev => prev.filter(c => c !== city));
  };

  // Shipment Handlers
  const handleAddShipment = (
    source: string,
    destinations: string[],
    resources: ResourceAmount
  ) => {
    const newShipments: Shipment[] = destinations.map((dest) => ({
      id: crypto.randomUUID(),
      sourceCity: source,
      destinationCity: dest,
      resources: { ...resources },
      shippedResources: { ...INITIAL_RESOURCES },
      createdAt: Date.now(),
      status: 'Pendente',
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

        // Calculate new shipped amounts
        const newShipped = { ...s.shippedResources };
        let allCompleted = true;

        (Object.values(ResourceType) as ResourceType[]).forEach((type) => {
          newShipped[type] = (newShipped[type] || 0) + (sentAmounts[type] || 0);
          
          // Ensure we don't exceed total
          if (newShipped[type] > s.resources[type]) {
            newShipped[type] = s.resources[type];
          }

          if (newShipped[type] < s.resources[type]) {
            allCompleted = false;
          }
        });

        // Determine status
        let newStatus: Shipment['status'] = 'Em Andamento';
        const totalShipped = Object.values(newShipped).reduce((a: number, b: number) => a + b, 0);
        
        if (totalShipped === 0) {
          newStatus = 'Pendente';
        } else if (allCompleted) {
          newStatus = 'Concluído';
        }

        return {
          ...s,
          shippedResources: newShipped,
          status: newStatus,
        };
      })
    );
  };

  return (
    <div className="min-h-screen text-stone-800 pb-12">
      {/* Header */}
      <header className="bg-amber-800 text-amber-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <PackageOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Gerenciador de Construção</h1>
              <p className="text-amber-200 text-xs md:text-sm">Logística e Recursos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCityModalOpen(true)}
              className="bg-amber-700 hover:bg-amber-600 text-amber-50 px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 border border-amber-600 shadow-sm"
              title="Gerenciar Minhas Cidades"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Minhas Cidades</span>
            </button>

            <div className="hidden md:flex flex-col items-end mr-2 border-l border-amber-700 pl-4">
              <span className="text-xs text-amber-300 uppercase tracking-wider">Imperador</span>
              <span className="font-medium flex items-center gap-1">
                <UserIcon className="w-3 h-3" /> {user?.username}
              </span>
            </div>
            <button 
              onClick={logout}
              className="bg-amber-900/50 hover:bg-amber-900 text-amber-100 px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Main Section: New Shipment Form */}
        <section>
          <ShipmentForm 
            onAddShipment={handleAddShipment} 
            myCities={myCities}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Section: Stats */}
          <div className="lg:col-span-1">
             <div className="sticky top-8 space-y-4">
               <ResourceStats shipments={shipments} />
               
               <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 text-center text-sm text-amber-800">
                 Logado como <strong>{user?.username}</strong>. 
                 <br/>
                 Seus dados estão isolados neste navegador.
               </div>
             </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
            <ShipmentList 
              shipments={shipments} 
              onDelete={handleDeleteShipment} 
              onRegisterShipment={handleRegisterShipment}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <CityManagerModal 
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        cities={myCities}
        onAddCity={handleAddCity}
        onRemoveCity={handleRemoveCity}
      />
    </div>
  );
};

// --- Main App Wrapper ---

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