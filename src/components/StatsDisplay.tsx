
import React, { useMemo } from "react";
import { Car } from "@/utils/trafficSimulation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface StatsDisplayProps {
  cars: Car[];
  laneLength: number;
  elapsedTime: number;
  laneChanges: number;
  unitSystem?: UnitSystem;
  trafficDensity?: number; // Add trafficDensity prop
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  cars,
  laneLength,
  elapsedTime,
  laneChanges,
  unitSystem = 'metric',
}) => {
  const conversions = getUnitConversions(unitSystem);
  // First calculate per-lane stats to get accurate per-lane throughput
  const perLaneStats = useMemo(() => {
    if (!cars.length) return [];
    
    const numLanes = Math.max(...cars.map(c => c.lane)) + 1;
    const laneStats = [];
    
    for (let lane = 0; lane < numLanes; lane++) {
      const laneCars = cars.filter(car => car.lane === lane);
      const carCount = laneCars.length;
      
      if (carCount === 0) {
        laneStats.push({ 
          lane, 
          throughput: 0,
          avgSpeed: 0,
          carCount: 0,
          density: 0,
          calculation: 'No cars in lane'
        });
        continue;
      }
      
      const avgSpeed = laneCars.reduce((sum, car) => sum + car.speed, 0) / carCount;
      const density = carCount / laneLength; // cars/km
      const throughput = avgSpeed * density; // cars/hour for this lane
      
      laneStats.push({
        lane,
        throughput: parseFloat(throughput.toFixed(2)),
        avgSpeed: parseFloat(avgSpeed.toFixed(1)),
        carCount,
        density: parseFloat(density.toFixed(4)),
        calculation: `Lane ${lane + 1}: ${throughput.toFixed(2)} cars/hour`
      });
    }
    
    return laneStats;
  }, [cars, laneLength]);
  
  // Now calculate overall statistics
  const stats = useMemo(() => {
    if (cars.length === 0) {
      return {
        avgSpeed: 0,
        minSpeed: 0,
        maxSpeed: 0,
        density: '0.00',
        elapsedTime: '0.0 sec (0.0 min)',
        throughput: 0,
        totalDensity: 0,
        totalAvgSpeed: 0
      };
    }

    // Calculate basic statistics
    const avgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    const minSpeed = Math.min(...cars.map((car) => car.speed));
    const maxSpeed = Math.max(...cars.map((car) => car.speed));
    
    // Calculate density in cars/kilometer
    const totalDensity = cars.length / laneLength; // cars/km
    
    // Calculate total throughput as sum of all lane throughputs
    const totalThroughput = perLaneStats.reduce((sum, lane) => sum + lane.throughput, 0);
    
    // Format elapsed time as "X.X sec (Y min)"
    const elapsedSeconds = parseFloat(elapsedTime.toFixed(1));
    const elapsedMinutes = (elapsedSeconds / 60).toFixed(1);
    const formattedElapsedTime = `${elapsedSeconds} sec (${elapsedMinutes} min)`;
    
    return {
      avgSpeed: Math.round(conversions.speed.toDisplay(avgSpeed)),
      minSpeed: Math.round(conversions.speed.toDisplay(minSpeed)),
      maxSpeed: Math.round(conversions.speed.toDisplay(maxSpeed)),
      density: conversions.density.toDisplay(totalDensity).toFixed(2),
      elapsedTime: formattedElapsedTime,
      throughput: parseFloat(totalThroughput.toFixed(2)),
      totalDensity, // cars/km (internal)
      totalAvgSpeed: avgSpeed // km/h (internal)
    };
  }, [cars, laneLength, elapsedTime, conversions]);
  
  // Per-lane stats are now calculated first, before the main stats

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Simulation Statistics</CardTitle>
          <CardDescription>
            Current traffic flow metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Speed</p>
              <p className="text-2xl font-bold">{stats.avgSpeed} {conversions.speed.unit}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Traffic Density</p>
              <p className="text-2xl font-bold">{stats.density} {conversions.density.unit}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Throughput</p>
              <p className="text-2xl font-bold">{stats.throughput} cars/hr</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Speed Range</p>
              <p className="text-lg font-semibold">
                {stats.minSpeed} - {stats.maxSpeed} {conversions.speed.unit}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Elapsed Time</p>
              <p className="text-lg font-semibold">{stats.elapsedTime}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Lane Changes</p>
              <p className="text-2xl font-bold">{laneChanges}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Per-lane throughput card */}
      {perLaneStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle>Per-Lane Throughput</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Info className="h-4 w-4" />
                      <span className="sr-only">How is this calculated?</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] p-4">
                    <p className="font-medium mb-2">How throughput is calculated:</p>
                    <p className="text-sm mb-1">For each lane:</p>
                    <ul className="text-xs space-y-1 list-disc pl-4">
                      <li>Average speed = Sum of all car speeds / number of cars</li>
                      <li>Density = Number of cars / lane length (in km)</li>
                      <li>Throughput = Average speed × Density × 3600 (to get cars/hour)</li>
                    </ul>
                    <p className="text-xs mt-2 text-muted-foreground">
                      Hover over any lane's throughput value to see the detailed calculation.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Current throughput for each lane (cars/hour)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {perLaneStats.map(({ lane, throughput, calculation, avgSpeed, carCount, density }) => {
                const laneName = lane === 0 ? 'L' : lane === perLaneStats.length - 1 ? 'R' : `L${lane + 1}`;
                const fullLaneName = lane === 0 ? 'Left' : lane === perLaneStats.length - 1 ? 'Right' : `Lane ${lane + 1}`;
                
                return (
                  <TooltipProvider key={lane}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 border rounded px-2 py-1 bg-muted/20 cursor-help">
                          <span className="text-xs font-medium text-muted-foreground">{laneName}:</span>
                          <span className="text-sm font-bold">{Math.round(throughput)}</span>
                          <span className="text-xs text-muted-foreground">cars/hr</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px] p-3 text-sm" side="top">
                        <p className="font-medium mb-1">{fullLaneName}</p>
                        <p className="text-sm">
                          {carCount} car{carCount !== 1 ? 's' : ''} • {avgSpeed.toFixed(1)} {conversions.speed.unit}
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          = {throughput.toFixed(1)} cars/hour
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatsDisplay;
