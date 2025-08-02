
import React from "react";
import { Car, calculateDistanceToCarAhead, getCarColor } from "@/utils/trafficSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";

interface CarStatsCardProps {
  cars: Car[];
  laneLength: number;
  showPackInfo?: boolean;
  unitSystem?: UnitSystem;
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

  if (!cars.length) {
    return { packs, carPackMap };
  }

  const sortedCars = [...cars].sort((a, b) => a.position - b.position);

  let currentPack: number[] = [sortedCars[0].id];
  let currentPackSpeed = sortedCars[0].speed;
  let currentPackLane = sortedCars[0].lane;
  let packId = 0;

  // All thresholds in miles
  const gapThreshold = 0.20; // in miles (~53 ft)
  const speedDiffThreshold = 20; // mph

  for (let i = 1; i < sortedCars.length; i++) {
    const car = sortedCars[i];
    const prevCar = sortedCars[i - 1];

    // Calculate gap between current car and previous car
    let gap = car.position - prevCar.position;
    if (gap < 0) {
      gap += sortedCars[sortedCars.length - 1].position + gapThreshold; // handle wraparound
    }

    const speedDifference = Math.abs(car.speed - currentPackSpeed);
    const isNewPackBySpeed = speedDifference > speedDiffThreshold;
    const isNewPackByGap = gap > gapThreshold;
    const isNewPackByLane = car.lane !== prevCar.lane;

    if (!isNewPackBySpeed && !isNewPackByGap && !isNewPackByLane) {
      currentPack.push(car.id);
    } else {
      if (currentPack.length > 0) {
        packs.push({
          packId,
          speed: Math.round(currentPackSpeed),
          carCount: currentPack.length
        });
        currentPack.forEach(carId => {
          carPackMap[carId] = packId;
        });
        packId++;
      }
      currentPack = [car.id];
      currentPackSpeed = car.speed;
      currentPackLane = car.lane;
    }
  }

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

const CarStatsCard: React.FC<CarStatsCardProps> = ({ cars, laneLength, showPackInfo = true, unitSystem = 'imperial' }) => {
  const conversions = getUnitConversions(unitSystem);
  const { packs, carPackMap } = identifyPacks(cars);
  
  // Filter packs to only show those with more than 1 car
  const multiCarPacks = packs.filter(pack => pack.carCount > 1);

  return (
    <div className="space-y-4">
      {showPackInfo && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pack Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Multi-Car Packs:</span>
                <span>{multiCarPacks.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {multiCarPacks.map((pack) => (
                  <div key={pack.packId} className="p-3 border rounded-lg">
                    <div className="font-semibold mb-1">Pack #{pack.packId + 1}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cars:</span>
                        <span className="font-medium ml-1">{pack.carCount}</span>
                      </div>
                       <div>
                         <span className="text-muted-foreground">Speed:</span>
                         <span className="font-medium ml-1">{Math.round(conversions.speed.toDisplay(pack.speed))} {conversions.speed.unit}</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              {multiCarPacks.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No packs with multiple cars detected
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                  style={{ borderColor: getCarColor(car) }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getCarColor(car) }}
                    />
                    <span className="font-semibold">{car.name}</span>
                    {showPackInfo && (
                      <span className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        Pack #{packId + 1}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                     <div>
                       <span className="text-muted-foreground">Desired Speed:</span>
                       <span className="font-medium ml-1">{Math.round(conversions.speed.toDisplay(car.desiredSpeed))} {conversions.speed.unit}</span>
                     </div>
                     <div>
                       <span className="text-muted-foreground">Current Speed:</span>
                       <span className="font-medium ml-1">{Math.round(conversions.speed.toDisplay(car.speed))} {conversions.speed.unit}</span>
                     </div>
                     <div>
                       <span className="text-muted-foreground">Distance to Car Ahead:</span>
                       <span className="font-medium ml-1">{conversions.distance.toDisplay(distanceToCarAhead).toFixed(2)} {conversions.distance.unit}</span>
                     </div>
                    <div>
                      <span className="text-muted-foreground">Trip Progress:</span>
                      <span className="font-medium ml-1">{Math.round(tripProgress)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Lane:</span>
                      <span className="font-medium ml-1">Lane {car.lane + 1}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lane Change Prob.:</span>
                      <span className="font-medium ml-1">{car.laneChangeProbability?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lane Stickiness:</span>
                      <span className="font-medium ml-1">{car.laneStickiness?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${tripProgress}%`,
                          backgroundColor: getCarColor(car)
                        }}
                      ></div>
                    </div>
                     <div className="flex justify-between text-xs text-muted-foreground mt-1">
                       <span>{conversions.distance.toDisplay(car.distanceTraveled).toFixed(2)} {conversions.distance.unit}</span>
                       <span>{conversions.distance.toDisplay(car.distTripPlanned).toFixed(2)} {conversions.distance.unit}</span>
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
