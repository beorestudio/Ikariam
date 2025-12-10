import React from 'react';
import { Shipment, ResourceType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Pickaxe, Wine, Box, Gem, FlaskConical } from 'lucide-react';

interface ResourceStatsProps {
  shipments: Shipment[];
}

const ResourceStats: React.FC<ResourceStatsProps> = ({ shipments }) => {
  // Aggregate data based on REMAINING resources
  const data = Object.values(ResourceType).map((type) => {
    const totalRemaining = shipments.reduce((sum, shipment) => {
      const total = shipment.resources[type] || 0;
      const shipped = shipment.shippedResources[type] || 0;
      return sum + Math.max(0, total - shipped);
    }, 0);

    return {
      name: type,
      total: totalRemaining,
    };
  });

  const getBarColor = (name: string) => {
    switch (name) {
      case ResourceType.Madeira: return '#92400e'; // amber-800
      case ResourceType.Vinho: return '#be123c'; // rose-700
      case ResourceType.Marmore: return '#78716c'; // stone-500
      case ResourceType.Cristal: return '#0891b2'; // cyan-600
      case ResourceType.Enxofre: return '#ca8a04'; // yellow-600
      default: return '#8884d8';
    }
  };

  const getIcon = (name: string) => {
      switch (name) {
      case ResourceType.Madeira: return <Pickaxe className="w-4 h-4 text-amber-800" />;
      case ResourceType.Vinho: return <Wine className="w-4 h-4 text-rose-700" />;
      case ResourceType.Marmore: return <Box className="w-4 h-4 text-stone-500" />;
      case ResourceType.Cristal: return <Gem className="w-4 h-4 text-cyan-600" />;
      case ResourceType.Enxofre: return <FlaskConical className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  }

  return (
    <div className="bg-white rounded-xl shadow border border-stone-200 p-6 h-full">
      <h2 className="font-semibold text-lg text-stone-700 mb-4">Recursos Pendentes</h2>
      
      {/* 
        Grid adjusted for sidebar usage:
        - Mobile: 2 cols
        - LG (Sidebar): 1 or 2 cols depending on space
      */}
      <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 mb-6">
        {data.map((item) => (
            <div key={item.name} className="bg-stone-50 rounded-lg p-3 border border-stone-200 flex flex-col items-center justify-center text-center">
                <div className="mb-1 bg-white p-1.5 rounded-full shadow-sm">
                    {getIcon(item.name)}
                </div>
                <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wide">{item.name}</span>
                <span className="text-sm font-bold text-stone-800">{item.total.toLocaleString()}</span>
            </div>
        ))}
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#57534e', fontSize: 10 }} 
                dy={10}
                interval={0}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a8a29e', fontSize: 10 }}
            />
            <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} animationDuration={1000}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResourceStats;