import React from "react";
import { SimulationParams } from "@/utils/trafficSimulation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SimulationParametersProps {
  params: SimulationParams;
  trafficRule: 'american' | 'european';
  unitSystem?: 'metric' | 'imperial';
}

const SimulationParameters: React.FC<SimulationParametersProps> = ({
  params,
  trafficRule,
  unitSystem = 'imperial'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Convert units if needed
  const speedUnit = unitSystem === 'metric' ? 'km/h' : 'mph';
  const distanceUnit = unitSystem === 'metric' ? 'km' : 'miles';
  const densityUnit = unitSystem === 'metric' ? 'veh/km' : 'veh/mile';
  
  // Format vehicle type distribution
  const vehicleDistribution = Object.entries(params.vehicleTypeDensity)
    .map(([type, percent]) => `${type}: ${percent}%`)
    .join(', ');

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="mt-4 border rounded-lg overflow-hidden"
    >
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full flex justify-between items-center px-4 py-2 text-sm font-medium"
        >
          <span>Simulation Parameters</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 pt-0 text-sm bg-muted/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="font-medium">Traffic Parameters</p>
            <p>Density: {params.trafficDensity.toFixed(2)} {densityUnit}</p>
            <p>Vehicle Mix: {vehicleDistribution}</p>
            <p>Lanes: {params.numLanes || 3}</p>
            <p>Traffic Rule: {trafficRule === 'american' ? 'American' : 'European'}</p>
          </div>
          
          <div className="space-y-1">
            <p className="font-medium">Speed Parameters</p>
            <p>Speed Limit: {params.speedLimit} {speedUnit}</p>
            <p>Min Speed: {params.minSpeed} {speedUnit}</p>
            <p>Max Speed: {params.maxSpeed} {speedUnit}</p>
            <p>Mean Speed: {params.meanSpeed} {speedUnit}</p>
          </div>
          
          <div className="space-y-1">
            <p className="font-medium">Vehicle Parameters</p>
            <p>Car Length: {params.lengthCar} m</p>
            <p>Time Headway: {params.tDist} s</p>
            <p>Max Deceleration: {params.aMax} m/s²</p>
            <p>Politeness: {params.politenessFactor?.toFixed(2) || '0.50'}</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SimulationParameters;
