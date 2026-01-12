import React from "react";
import { SimulationParams } from "@/utils/trafficSimulation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";

interface SimulationParametersProps {
  params: SimulationParams;
  trafficRule: 'american' | 'european';
  unitSystem?: 'metric' | 'imperial';
}

const SimulationParameters: React.FC<SimulationParametersProps> = ({
  params,
  trafficRule,
  unitSystem = 'metric'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Get unit conversions
  const unitConversions = getUnitConversions(unitSystem as UnitSystem);

  // Convert values
  const convertedDensity = unitConversions.density.toDisplay(params.trafficDensity);
  const convertedSpeedLimit = unitConversions.speed.toDisplay(params.speedLimit || 130);
  const convertedMinSpeed = unitConversions.speed.toDisplay(params.minSpeed || 20);
  const convertedMaxSpeed = unitConversions.speed.toDisplay(params.maxSpeed || 130);
  const convertedMeanSpeed = unitConversions.speed.toDisplay(params.meanSpeed || 90);

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
            <p>Density: {convertedDensity.toFixed(2)} {unitConversions.density.unit}</p>
            <p>Vehicle Mix: {vehicleDistribution}</p>
            <p>Lanes: {params.numLanes || 3}</p>
            <p>Traffic Rule: {trafficRule === 'american' ? 'American' : 'European'}</p>
          </div>

          <div className="space-y-1">
            <p className="font-medium">Speed Parameters</p>
            <p>Speed Limit: {convertedSpeedLimit.toFixed(0)} {unitConversions.speed.unit}</p>
            <p>Min Speed: {convertedMinSpeed.toFixed(0)} {unitConversions.speed.unit}</p>
            <p>Max Speed: {convertedMaxSpeed.toFixed(0)} {unitConversions.speed.unit}</p>
            <p>Mean Speed: {convertedMeanSpeed.toFixed(0)} {unitConversions.speed.unit}</p>
          </div>

          <div className="space-y-1">
            <p className="font-medium">Vehicle Parameters</p>
            <p>Car Length: {params.lengthCar} m</p>
            <p>Time Headway: {params.tDist} s</p>
            <p>Max Deceleration: {params.aMax} m/s²</p>
            <p>Accel Reaction: {params.driverReactionTime?.toFixed(1) || '2.0'} s</p>
            <p>Brake Reaction: {params.brakingReactionTime?.toFixed(1) || '1.0'} s</p>
            <p>Lane Change Cooldown: {params.laneChangeCooldown?.toFixed(1) || '5.0'} s</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SimulationParameters;
