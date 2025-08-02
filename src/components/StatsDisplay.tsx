
import React, { useMemo } from "react";
import { Car } from "@/utils/trafficSimulation";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatsDisplayProps {
  cars: Car[];
  laneLength: number;
  elapsedTime: number;
  laneChanges: number;
  unitSystem: UnitSystem;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  cars,
  laneLength,
  elapsedTime,
  laneChanges,
  unitSystem,
}) => {
  const conversions = getUnitConversions(unitSystem);
  
  const stats = useMemo(() => {
    const avgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    const minSpeed = Math.min(...cars.map((car) => car.speed));
    const maxSpeed = Math.max(...cars.map((car) => car.speed));
    const density = cars.length / laneLength; // cars per mile (internal)
    
    // Calculate freeway throughput (cars per hour per lane)
    // Throughput = average speed * density
    const throughputPerLane = avgSpeed * density;
    const totalThroughput = throughputPerLane * (cars.length > 0 ? Math.max(...cars.map(c => c.lane)) + 1 : 1);
    
    // Format elapsed time as "X.X sec (Y min)"
    const elapsedSeconds = parseFloat(elapsedTime.toFixed(1));
    const elapsedMinutes = (elapsedSeconds / 60).toFixed(1);
    const formattedElapsedTime = `${elapsedSeconds} sec (${elapsedMinutes} min)`;
    
    return {
      avgSpeed: Math.round(conversions.speed.toDisplay(avgSpeed)),
      minSpeed: Math.round(conversions.speed.toDisplay(minSpeed)),
      maxSpeed: Math.round(conversions.speed.toDisplay(maxSpeed)),
      density: conversions.density.toDisplay(density).toFixed(2),
      elapsedTime: formattedElapsedTime,
      throughput: Math.round(totalThroughput),
    };
  }, [cars, laneLength, elapsedTime, conversions]);
  
  return (
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
            <p className="text-sm text-muted-foreground">Freeway Throughput</p>
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
  );
};

export default StatsDisplay;
