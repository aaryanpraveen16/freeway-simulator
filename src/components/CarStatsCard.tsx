
import React, { useState, useMemo } from "react";
import { Car, calculateDistanceToCarAhead, getCarColor, identifyPacks } from "@/utils/trafficSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";

interface CarStatsCardProps {
  cars: Car[];
  laneLength: number;
  params: import("@/utils/trafficSimulation").SimulationParams;
  showPackInfo?: boolean;
  unitSystem?: UnitSystem;
}

const CarStatsCard: React.FC<CarStatsCardProps> = ({ cars, laneLength, params, showPackInfo = true, unitSystem = 'imperial' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllPacks, setShowAllPacks] = useState(false);
  const conversions = getUnitConversions(unitSystem);

  // Use the centralized identifyPacks function
  const { packs, carPackMap } = useMemo(() => {
    const identifiedPacks = identifyPacks(cars, laneLength, params.tDist);

    // Transform to the format expected by this component
    const formattedPacks = identifiedPacks.map(p => ({
      packId: p.packId,
      speed: p.avgSpeed,
      carCount: p.cars.length
    }));

    const map: Record<number, number> = {};
    identifiedPacks.forEach(pack => {
      pack.cars.forEach(car => {
        map[car.id] = pack.packId;
      });
    });

    return { packs: formattedPacks, carPackMap: map };
  }, [cars, laneLength, params.tDist]);

  // Filter packs to only show those with more than 1 car
  const multiCarPacks = packs.filter(pack => pack.carCount > 1);

  // Limit displayed packs to 9 unless showAllPacks is true
  const displayedPacks = showAllPacks ? multiCarPacks : multiCarPacks.slice(0, 9);

  // Filter cars based on search term
  const filteredCars = useMemo(() => {
    if (!searchTerm.trim()) return cars;

    const term = searchTerm.toLowerCase().trim();
    return cars.filter(car => {
      // Search by car name
      if (car.name.toLowerCase().includes(term)) return true;

      // Search by car ID
      if (car.id.toString().includes(term)) return true;

      // Search by driver type
      if (car.driverType.toLowerCase().includes(term)) return true;

      // Search by lane number
      if (`lane ${car.lane + 1}`.includes(term) || (car.lane + 1).toString().includes(term)) return true;

      // Search by speed (current or desired)
      if (Math.round(car.speed).toString().includes(term)) return true;
      if (Math.round(car.desiredSpeed).toString().includes(term)) return true;

      return false;
    });
  }, [cars, searchTerm]);

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
                {displayedPacks.map((pack) => (
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
              {multiCarPacks.length > 9 && (
                <div className="flex justify-center mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllPacks(!showAllPacks)}
                  >
                    {showAllPacks ? 'Show Less' : `Show More (${multiCarPacks.length - 9} more)`}
                  </Button>
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
          {/* Search Input */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search cars by name, ID, driver type, lane, or speed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <div className="text-sm text-muted-foreground mt-1">
                Showing {filteredCars.length} of {cars.length} cars
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCars.map((car) => {
              // Find the original index of this car in the full cars array for distance calculation
              const originalIndex = cars.findIndex(c => c.id === car.id);
              const distanceToCarAhead = calculateDistanceToCarAhead(
                originalIndex,
                cars,
                laneLength,
                params.lengthCar // Pass the car length in meters
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
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Driver Type:</span>
                        <span className="font-medium ml-1 capitalize">{car.driverType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lane Change Prob:</span>
                        <span className="font-medium ml-1">{(car.laneChangeProbability * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Deceleration:</span>
                        <span className="font-medium ml-1">{params.aMax.toFixed(1)} m/s²</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vehicle Length:</span>
                        <span className="font-medium ml-1">{(params.lengthCar * 3.28084).toFixed(1)} ft ({(params.lengthCar).toFixed(1)} m)</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Distance to Car Ahead:</span>
                      <span className="font-medium ml-1">
                        {unitSystem === 'metric' ? (
                          <>
                            {distanceToCarAhead.toFixed(3)} km
                            <span className="text-muted-foreground">
                              {' '}({Math.round(distanceToCarAhead * 1000)} m)
                            </span>
                          </>
                        ) : (
                          `${conversions.distance.toDisplay(distanceToCarAhead).toFixed(2)} ${conversions.distance.unit}`
                        )}
                      </span>
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
            {filteredCars.length === 0 && (
              <div className="col-span-2 text-center text-muted-foreground py-8">
                No cars match your search criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarStatsCard;
