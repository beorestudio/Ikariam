import { EmpireCity, ResourceType } from '../types';

export const MOCK_EMPIRE_DATA: EmpireCity[] = [
  {
    id: 1,
    name: "Pólis Alpha",
    coords: "[50:50]",
    islandId: 100,
    resources: {
      [ResourceType.Madeira]: { resourceType: ResourceType.Madeira, currentAmount: 12500, maxCapacity: 20000, production: 500, isFull: false },
      [ResourceType.Vinho]: { resourceType: ResourceType.Vinho, currentAmount: 4500, maxCapacity: 10000, production: 0, isFull: false },
      [ResourceType.Marmore]: { resourceType: ResourceType.Marmore, currentAmount: 8900, maxCapacity: 15000, production: 300, isFull: false },
      [ResourceType.Cristal]: { resourceType: ResourceType.Cristal, currentAmount: 200, maxCapacity: 15000, production: 0, isFull: false },
      [ResourceType.Enxofre]: { resourceType: ResourceType.Enxofre, currentAmount: 1200, maxCapacity: 15000, production: 0, isFull: false }
    },
    buildings: [
      { buildingId: "town_hall", level: 25, name: "Câmara Municipal" },
      { buildingId: "academy", level: 18, name: "Academia" },
      { buildingId: "warehouse", level: 20, name: "Armazém" },
      { buildingId: "tavern", level: 15, name: "Taberna" },
      { buildingId: "palace", level: 5, name: "Palácio" }
    ],
    updatedAt: Date.now()
  },
  {
    id: 2,
    name: "Vinha do Monte",
    coords: "[50:51]",
    islandId: 101,
    resources: {
      [ResourceType.Madeira]: { resourceType: ResourceType.Madeira, currentAmount: 32000, maxCapacity: 50000, production: 900, isFull: false },
      [ResourceType.Vinho]: { resourceType: ResourceType.Vinho, currentAmount: 38000, maxCapacity: 40000, production: 600, isFull: true },
      [ResourceType.Marmore]: { resourceType: ResourceType.Marmore, currentAmount: 1200, maxCapacity: 40000, production: 0, isFull: false }
    },
    buildings: [
      { buildingId: "town_hall", level: 22, name: "Câmara Municipal" },
      { buildingId: "warehouse", level: 25, name: "Armazém" },
      { buildingId: "wine_grower", level: 18, name: "Viticultor" },
      { buildingId: "tavern", level: 20, name: "Taberna" }
    ],
    updatedAt: Date.now()
  },
  {
    id: 3,
    name: "Marmolândia",
    coords: "[52:51]",
    islandId: 102,
    resources: {
      [ResourceType.Madeira]: { resourceType: ResourceType.Madeira, currentAmount: 5000, maxCapacity: 10000, production: 200, isFull: false },
      [ResourceType.Marmore]: { resourceType: ResourceType.Marmore, currentAmount: 8500, maxCapacity: 10000, production: 450, isFull: true }
    },
    buildings: [
      { buildingId: "town_hall", level: 15, name: "Câmara Municipal" },
      { buildingId: "stonemason", level: 12, name: "Pedreiro" },
      { buildingId: "barracks", level: 10, name: "Quartel" },
      { buildingId: "wall", level: 15, name: "Muralha" }
    ],
    updatedAt: Date.now()
  }
];