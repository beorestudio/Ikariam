import React from 'react';
import { ResourceType } from '../types';
import { Pickaxe, Wine, Box, Gem, FlaskConical } from 'lucide-react';

interface ResourceIconProps {
  type: ResourceType;
  className?: string;
}

const ResourceIcon: React.FC<ResourceIconProps> = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case ResourceType.Madeira:
      return <Pickaxe className={`${className} text-amber-800`} />;
    case ResourceType.Vinho:
      return <Wine className={`${className} text-rose-600`} />;
    case ResourceType.Marmore:
      return <Box className={`${className} text-stone-500`} />; // Using Box for Marble block
    case ResourceType.Cristal:
      return <Gem className={`${className} text-cyan-500`} />;
    case ResourceType.Enxofre:
      return <FlaskConical className={`${className} text-yellow-500`} />;
    default:
      return null;
  }
};

export default ResourceIcon;