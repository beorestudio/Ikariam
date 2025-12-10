import React, { useState, useEffect } from 'react';
import { Shipment, ResourceType, INITIAL_RESOURCES, ResourceAmount } from './types';
import ShipmentForm from './components/ShipmentForm';
import ShipmentList from './components/ShipmentList';
import ResourceStats from './components/ResourceStats';
import { PackageOpen } from 'lucide-react';

const App: React.FC = () => {
  // Initialize state from localStorage if available
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      const saved = localStorage.getItem('ikariam_manager_shipments');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load shipments from storage:', error);
      return [];
    }
  });

  // Save to localStorage whenever shipments change
  useEffect(() => {
    localStorage.setItem('ikariam_manager_shipments', JSON.stringify(shipments));
  }, [shipments]);

  // Function to handle adding new shipments (supports multiple destinations)
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
          
          // Ensure we don't exceed total (optional safety check)
          if (newShipped[type] > s.resources[type]) {
            newShipped[type] = s.resources[type];
          }

          if (newShipped[type] < s.resources[type]) {
            allCompleted = false;
          }
        });

        // Determine status
        let newStatus: Shipment['status'] = 'Em Andamento';
        
        // Check if anything was shipped at all
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
            <PackageOpen className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gerenciador de Construção</h1>
              <p className="text-amber-200 text-sm">Logística e Recursos</p>
            </div>
          </div>
          <div className="text-right text-sm opacity-80">
            {shipments.length} Encomendas Ativas
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Main Section: New Shipment Form */}
        <section>
          <ShipmentForm onAddShipment={handleAddShipment} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Section: Stats - Takes up 1 column on large screens */}
          <div className="lg:col-span-1">
             <div className="sticky top-8">
               <ResourceStats shipments={shipments} />
             </div>
          </div>

          {/* List Section - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <ShipmentList 
              shipments={shipments} 
              onDelete={handleDeleteShipment} 
              onRegisterShipment={handleRegisterShipment}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;