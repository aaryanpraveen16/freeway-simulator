
import React, { useMemo } from "react";
import { Car } from "@/utils/trafficSimulation";
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
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  cars,
  laneLength,
  elapsedTime,
  laneChanges,
}) => {
  const stats = useMemo(() => {
    const avgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    const minSpeed = Math.min(...cars.map((car) => car.speed));
    const maxSpeed = Math.max(...cars.map((car) => car.speed));
    const density = (cars.length / laneLength).toFixed(2); // cars per mile
    
    // Calculate freeway throughput (cars per hour per lane)
    // Throughput = average speed * density
    const throughputPerLane = avgSpeed * parseFloat(density);
    const totalThroughput = throughputPerLane * (cars.length > 0 ? Math.max(...cars.map(c => c.lane)) + 1 : 1);
    
    return {
      avgSpeed: Math.round(avgSpeed),
      minSpeed: Math.round(minSpeed),
      maxSpeed: Math.round(maxSpeed),
      density,
      elapsedTime: elapsedTime.toFixed(1),
      throughput: Math.round(totalThroughput),
    };
  }, [cars, laneLength, elapsedTime]);
  
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
            <p className="text-2xl font-bold">{stats.avgSpeed} mph</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Traffic Density</p>
            <p className="text-2xl font-bold">{stats.density} cars/mi</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Freeway Throughput</p>
            <p className="text-2xl font-bold">{stats.throughput} cars/hr</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Speed Range</p>
            <p className="text-lg font-semibold">
              {stats.minSpeed} - {stats.maxSpeed} mph
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Elapsed Time</p>
            <p className="text-lg font-semibold">{stats.elapsedTime} sec</p>
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
