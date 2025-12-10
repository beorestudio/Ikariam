export enum ResourceType {
  Madeira = 'Madeira',
  Vinho = 'Vinho',
  Marmore = 'Mármore',
  Cristal = 'Cristal',
  Enxofre = 'Enxofre',
}

export interface ResourceAmount {
  [ResourceType.Madeira]: number;
  [ResourceType.Vinho]: number;
  [ResourceType.Marmore]: number;
  [ResourceType.Cristal]: number;
  [ResourceType.Enxofre]: number;
}

export interface Shipment {
  id: string;
  sourceCity: string;
  destinationCity: string;
  resources: ResourceAmount; // The total requested amount
  shippedResources: ResourceAmount; // The amount already sent
  createdAt: number;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
}

export const INITIAL_RESOURCES: ResourceAmount = {
  [ResourceType.Madeira]: 0,
  [ResourceType.Vinho]: 0,
  [ResourceType.Marmore]: 0,
  [ResourceType.Cristal]: 0,
  [ResourceType.Enxofre]: 0,
};

// --- User / Auth Structures ---

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: number;
}

// --- Database Structures ---

export interface BuildingCost {
  level: number;
  resources: ResourceAmount;
}

export interface Building {
  id: string;
  name: string;
  description?: string;
  costs: BuildingCost[]; // Array of costs per level
}

// --- Empire Manager Structures ---

export interface EmpireBuilding {
  buildingId: string;
  level: number;
  name: string;
  position?: number;
}

export interface CityProduction {
  resourceType: ResourceType;
  production: number; // per hour
  maxCapacity: number;
  currentAmount: number;
  isFull: boolean;
}

export interface EmpireCity {
  id: number; // Ikariam City ID
  name: string;
  coords: string; // "[x:y]"
  islandId: number;
  resources: {
    [key in ResourceType]?: CityProduction;
  };
  buildings: EmpireBuilding[];
  researchPoints?: number;
  updatedAt: number;
}
