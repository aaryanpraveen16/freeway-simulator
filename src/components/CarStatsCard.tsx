import React from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CarStatsCardProps {
  cars: Car[];
  laneLength: number;
}

interface PackInfo {
  packId: number;
  speed: number;
  carCount: number;
}

// Function to identify packs of cars with similar speeds
const identifyPacks = (cars: Car[]): { packs: PackInfo[], carPackMap: Record<number, number> } => {
  const packs: PackInfo[] = [];
  const carPackMap: Record<number, number> = {};
  
  // Handle empty cars array
  if (!cars.length) {
    return { packs, carPackMap };
  }
  
  // Sort cars by position to find adjacent cars
  const sortedCars = [...cars].sort((a, b) => a.position - b.position);
  
  let currentPack: number[] = [sortedCars[0].id];
  let currentPackSpeed = sortedCars[0].speed;
  let packId = 0;
  
  const safeDistanceThreshold = 100; // Safe distance threshold in feet
  const gapThresholdBuffer = 50; // Buffer for gap threshold in feet
  const totalGapThreshold = safeDistanceThreshold + gapThresholdBuffer;
  
  // Group cars into packs based on similar speeds and gap thresholds
  for (let i = 1; i < sortedCars.length; i++) {
    const car = sortedCars[i];
    const prevCar = sortedCars[i - 1];
    
    // Calculate gap between current car and previous car
    let gap = car.position - prevCar.position;
    
    // Adjust for track wraparound
    if (gap < 0) {
      gap += sortedCars[sortedCars.length - 1].position + 1000;
    }
    
    // Check for new pack: ONLY gap must be large (proximity-based packs)
    const isNewPack = gap > 700;
    
    if (!isNewPack) {
      currentPack.push(car.id);
    } else {
      // Create a new pack with the cars collected so far
      if (currentPack.length > 0) {
        packs.push({
          packId,
          speed: Math.round(currentPackSpeed),
          carCount: currentPack.length
        });
        // Map cars to their respective packs
        currentPack.forEach(carId => {
          carPackMap[carId] = packId;
        });
        packId++;
      }
      // Start a new pack
      currentPack = [car.id];
      currentPackSpeed = car.speed;
    }
  }
  
  // Don't forget to process the last pack
  if (currentPack.length > 0) {
    packs.push({
      packId,
      speed: Math.round(currentPackSpeed),
      carCount: currentPack.length
    });
    
    currentPack.forEach(carId => {
      carPackMap[carId] = packId;
    });
  }
  
  return { packs, carPackMap };
};

const CarStatsCard: React.FC<CarStatsCardProps> = ({ cars, laneLength }) => {
  const { packs, carPackMap } = identifyPacks(cars);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Pack Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">Total Packs:</span>
              <span>{packs.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packs.map((pack) => (
                <div key={pack.packId} className="p-3 border rounded-lg">
                  <div className="font-semibold mb-1">Pack #{pack.packId + 1}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cars:</span>
                      <span className="font-medium ml-1">{pack.carCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Speed:</span>
                      <span className="font-medium ml-1">{pack.speed} mph</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Individual Car Stats</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[400px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cars.map((car, index) => {
              const distanceToCarAhead = calculateDistanceToCarAhead(
                index,
                cars,
                laneLength
              );
              
              const packId = carPackMap[car.id];
              
              // Calculate trip progress percentage
              const tripProgress = Math.min(
                (car.distanceTraveled / car.distTripPlanned) * 100,
                100
              );

              return (
                <div
                  key={car.id}
                  className="flex flex-col p-3 border rounded-lg"
                  style={{ borderColor: car.color }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: car.color }}
                    />
                    <span className="font-semibold">{car.name}</span>
                    <span className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                      Pack #{packId + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Desired Speed:
                      </span>
                      <span className="font-medium ml-1">
                        {Math.round(car.desiredSpeed)} mph
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Current Speed:
                      </span>
                      <span className="font-medium ml-1">
                        {Math.round(car.speed)} mph
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="font-medium ml-1">
                        {(distanceToCarAhead / 5280).toFixed(2)} mi
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trip Progress:</span>
                      <span className="font-medium ml-1">
                        {Math.round(tripProgress)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Lane:</span>
                      <span className="font-medium ml-1">
                        Lane {car.lane + 1}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Driver Type:</span>
                      <span className="font-medium ml-1 capitalize">
                        {car.driverType}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lane Change:</span>
                      <span className="font-medium ml-1">
                        {Math.round(car.laneChangeProbability * 100)}% likely
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lane Stickiness:</span>
                      <span className="font-medium ml-1">
                        {Math.round(car.laneStickiness * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${tripProgress}%`,
                          backgroundColor: car.color
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{(car.distanceTraveled / 5280).toFixed(2)} mi</span>
                      <span>{(car.distTripPlanned / 5280).toFixed(2)} mi</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarStatsCard;
