import React, { useState } from 'react';
import { SavedSimulation } from '@/services/simulationService';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UnitSystem, getUnitConversions } from '@/utils/unitConversion';

interface SimulationParametersCollapsibleProps {
  selectedSimulations: SavedSimulation[];
  unitSystem?: UnitSystem;
}

const SimulationParametersCollapsible: React.FC<SimulationParametersCollapsibleProps> = ({
  selectedSimulations,
  unitSystem = 'metric',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const conversions = getUnitConversions(unitSystem);

  if (selectedSimulations.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg bg-muted/30 mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Simulation Parameters ({selectedSimulations.length} simulation{selectedSimulations.length !== 1 ? 's' : ''})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {selectedSimulations.map((sim, index) => (
            <div key={sim.id} className="border rounded-lg p-4 bg-background">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-sm">{sim.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  #{sim.simulationNumber}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs capitalize"
                  style={{
                    borderColor: sim.trafficRule === 'american' ? '#ff4d4f' : '#1890ff',
                    color: sim.trafficRule === 'american' ? '#ff4d4f' : '#1890ff'
                  }}
                >
                  {sim.trafficRule}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Freeway Length:</span>
                  <p className="font-medium">
                    {conversions.distance.toDisplay(sim.params.freewayLength || 10).toFixed(2)} {conversions.distance.unit}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Lanes:</span>
                  <p className="font-medium">{sim.params.numLanes || 2}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Traffic Density:</span>
                  <p className="font-medium">{(sim.params.trafficDensity || 0).toFixed(2)} cars/km</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Cars:</span>
                  <p className="font-medium">{sim.finalStats.totalCars}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Speed Limit:</span>
                  <p className="font-medium">
                    {conversions.speed.toDisplay(sim.params.speedLimit || 120).toFixed(0)} {conversions.speed.unit}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Speed:</span>
                  <p className="font-medium">
                    {conversions.speed.toDisplay(sim.params.minSpeed || 80).toFixed(0)} {conversions.speed.unit}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Speed:</span>
                  <p className="font-medium">
                    {conversions.speed.toDisplay(sim.params.maxSpeed || 140).toFixed(0)} {conversions.speed.unit}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="font-medium">{sim.duration.toFixed(1)}s</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Lane Changes:</span>
                  <p className="font-medium">{sim.finalStats.laneChanges}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Speed:</span>
                  <p className="font-medium">
                    {conversions.speed.toDisplay(sim.finalStats.averageSpeed).toFixed(1)} {conversions.speed.unit}
                  </p>
                </div>
                {(sim.params as any).aggressiveDriverPercentage !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Aggressive Drivers:</span>
                    <p className="font-medium">{((sim.params as any).aggressiveDriverPercentage * 100).toFixed(0)}%</p>
                  </div>
                )}
                {(sim.params as any).cautiousDriverPercentage !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Cautious Drivers:</span>
                    <p className="font-medium">{((sim.params as any).cautiousDriverPercentage * 100).toFixed(0)}%</p>
                  </div>
                )}
                {sim.params.driverReactionTime !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Reaction Time:</span>
                    <p className="font-medium">{sim.params.driverReactionTime.toFixed(2)}s</p>
                  </div>
                )}
                {sim.params.laneChangeCooldown !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Lane Cooldown:</span>
                    <p className="font-medium">{sim.params.laneChangeCooldown.toFixed(1)}s</p>
                  </div>
                )}
                {(sim.params as any).minFollowingDistance !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Min Following Distance:</span>
                    <p className="font-medium">
                      {conversions.distance.toDisplay((sim.params as any).minFollowingDistance).toFixed(2)} {conversions.distance.unit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimulationParametersCollapsible;
