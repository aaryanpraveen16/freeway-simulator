import React, { useState, useMemo } from "react";
import { Car, calculateDistanceToCarAhead, getCarColor, identifyPacks } from "@/utils/trafficSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Car as CarIcon, Users } from "lucide-react";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";

interface CarStatsCardProps {
  cars: Car[];
  laneLength: number;
  params: import("@/utils/trafficSimulation").SimulationParams;
  showPackInfo?: boolean;
  unitSystem?: UnitSystem;
}

const CarStatsCard: React.FC<CarStatsCardProps> = ({
  cars,
  laneLength,
  params,
  showPackInfo = true,
  unitSystem = "imperial",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllPacks, setShowAllPacks] = useState(false);
  const conversions = getUnitConversions(unitSystem);

  // Identify Packs
  const { packs, carPackMap } = useMemo(() => {
    const identifiedPacks = identifyPacks(cars, laneLength, params.tDist);

    const formattedPacks = identifiedPacks.map((p) => ({
      packId: p.packId,
      speed: p.avgSpeed,
      carCount: p.cars.length,
    }));

    const map: Record<number, number> = {};
    identifiedPacks.forEach((pack) => {
      pack.cars.forEach((car) => {
        map[car.id] = pack.packId;
      });
    });

    return { packs: formattedPacks, carPackMap: map };
  }, [cars, laneLength, params.tDist]);

  const multiCarPacks = packs.filter((pack) => pack.carCount > 1);
  const displayedPacks = showAllPacks ? multiCarPacks : multiCarPacks.slice(0, 6);

  // Filter cars based on search query
  const filteredCars = useMemo(() => {
    if (!searchTerm.trim()) return cars;

    const term = searchTerm.toLowerCase().trim();
    return cars.filter((car) => {
      if (car.name?.toLowerCase().includes(term)) return true;
      if (car.id.toString().includes(term)) return true;
      if (car.driverType.toLowerCase().includes(term)) return true;
      if (`lane ${car.lane + 1}`.includes(term) || (car.lane + 1).toString().includes(term)) return true;
      return false;
    });
  }, [cars, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Pack Information (if enabled) */}
      {showPackInfo && (
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Traffic Pack Clusters
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Cohesive vehicle pelotons forming on the track</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                {multiCarPacks.length} {multiCarPacks.length === 1 ? "Pack" : "Packs"}
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {multiCarPacks.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                No clustered multi-car packs currently active. Traffic is flowing freely.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {displayedPacks.map((pack) => (
                  <div
                    key={pack.packId}
                    className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Pack #{pack.packId + 1}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {pack.carCount} cars
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cluster Speed:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {Math.round(conversions.speed.toDisplay(pack.speed))} {conversions.speed.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {multiCarPacks.length > 6 && (
              <div className="flex justify-center mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllPacks(!showAllPacks)}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  {showAllPacks ? "Show Less" : `View all ${multiCarPacks.length} packs`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Individual Vehicle Telemetry */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CarIcon className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Vehicle Fleet Inspector
                </CardTitle>
                <p className="text-xs text-muted-foreground">Real-time stats and behavior for individual cars</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredCars.length} of {cars.length} cars
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <Input
              placeholder="Search by ID, driver type, or lane..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-800/50"
            />
          </div>

          {/* Cars Grid */}
          <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
            {filteredCars.map((car) => {
              const originalIndex = cars.findIndex((c) => c.id === car.id);
              const distanceToCarAhead = calculateDistanceToCarAhead(originalIndex, cars, laneLength);
              const packId = carPackMap[car.id];
              const tripProgress = Math.min((car.distanceTraveled / car.distTripPlanned) * 100, 100);
              const carColor = getCarColor(car);

              return (
                <div
                  key={car.id}
                  className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:border-slate-300 transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: carColor }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {car.name || `Car #${car.id}`}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                        {car.driverType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-slate-500">
                        Lane {car.lane + 1}
                      </span>
                      {showPackInfo && packId !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-medium">
                          Pack #{packId + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clean Non-redundant Car Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-t border-b border-slate-100 dark:border-slate-800/60 text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="text-[10px] block text-slate-400">Speed</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {Math.round(conversions.speed.toDisplay(car.speed))}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-0.5">
                        / {Math.round(conversions.speed.toDisplay(car.desiredSpeed))} {conversions.speed.unit}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] block text-slate-400">Gap Ahead</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {unitSystem === "metric"
                          ? `${(distanceToCarAhead * 1000).toFixed(0)}m`
                          : `${(conversions.distance.toDisplay(distanceToCarAhead) * 5280).toFixed(0)}ft`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] block text-slate-400">Trip Progress</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {Math.round(tripProgress)}%
                      </span>
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full bg-slate-200/70 dark:bg-slate-700/50 rounded-full h-1.5 mt-2">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${tripProgress}%`,
                        backgroundColor: carColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {filteredCars.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-6">
                No vehicles match your search filter.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarStatsCard;
