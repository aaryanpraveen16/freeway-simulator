import React, { useMemo } from "react";
import { Car } from "@/utils/trafficSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Gauge, TrendingUp, Compass, Clock, Zap, Info, Layers } from "lucide-react";

interface StatsDisplayProps {
  cars: Car[];
  laneLength: number;
  elapsedTime: number;
  laneChanges: number;
  unitSystem?: UnitSystem;
  trafficDensity?: number;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  cars,
  laneLength,
  elapsedTime,
  laneChanges,
  unitSystem = "metric",
}) => {
  const conversions = getUnitConversions(unitSystem);

  // Calculate per-lane statistics
  const perLaneStats = useMemo(() => {
    if (!cars.length) return [];

    const numLanes = Math.max(...cars.map((c) => c.lane)) + 1;
    const laneStats = [];

    for (let lane = 0; lane < numLanes; lane++) {
      const laneCars = cars.filter((car) => car.lane === lane);
      const carCount = laneCars.length;

      if (carCount === 0) {
        laneStats.push({
          lane,
          throughput: 0,
          avgSpeed: 0,
          carCount: 0,
          density: 0,
        });
        continue;
      }

      const avgSpeed = laneCars.reduce((sum, car) => sum + car.speed, 0) / carCount;
      const density = carCount / laneLength; // cars/km
      const throughput = avgSpeed * density; // cars/hour for this lane

      laneStats.push({
        lane,
        throughput: parseFloat(throughput.toFixed(1)),
        avgSpeed: parseFloat(avgSpeed.toFixed(1)),
        carCount,
        density: parseFloat(density.toFixed(2)),
      });
    }

    return laneStats;
  }, [cars, laneLength]);

  // Overall statistics summary (deduplicated & formatted)
  const stats = useMemo(() => {
    if (cars.length === 0) {
      return {
        avgSpeed: 0,
        minSpeed: 0,
        maxSpeed: 0,
        density: "0.0",
        elapsedTimeStr: "0.0s",
        throughput: 0,
        totalCars: 0,
      };
    }

    const avgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    const minSpeed = Math.min(...cars.map((car) => car.speed));
    const maxSpeed = Math.max(...cars.map((car) => car.speed));
    const totalDensity = cars.length / laneLength;
    const totalThroughput = perLaneStats.reduce((sum, lane) => sum + lane.throughput, 0);

    const elapsedSeconds = Math.floor(elapsedTime);
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = (elapsedSeconds % 60).toString().padStart(2, "0");
    const elapsedTimeStr = mins > 0 ? `${mins}m ${secs}s` : `${elapsedTime.toFixed(1)}s`;

    return {
      avgSpeed: Math.round(conversions.speed.toDisplay(avgSpeed)),
      minSpeed: Math.round(conversions.speed.toDisplay(minSpeed)),
      maxSpeed: Math.round(conversions.speed.toDisplay(maxSpeed)),
      density: conversions.density.toDisplay(totalDensity).toFixed(1),
      elapsedTimeStr,
      throughput: Math.round(totalThroughput),
      totalCars: cars.length,
    };
  }, [cars, laneLength, elapsedTime, perLaneStats, conversions]);

  return (
    <div className="space-y-4">
      {/* Simulation Key Telemetry Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Simulation Telemetry
                </CardTitle>
                <p className="text-xs text-muted-foreground">Real-time aggregate freeway metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{stats.elapsedTimeStr}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Avg Speed */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <Gauge className="w-3.5 h-3.5 text-blue-500" />
                <span>Avg Speed</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.avgSpeed}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {conversions.speed.unit}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Range: {stats.minSpeed} – {stats.maxSpeed}
              </div>
            </div>

            {/* Total Throughput */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>Throughput</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.throughput.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">cars/h</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Across all {perLaneStats.length} lanes
              </div>
            </div>

            {/* Traffic Density */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <Compass className="w-3.5 h-3.5 text-purple-500" />
                <span>Traffic Density</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.density}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {conversions.density.unit}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {stats.totalCars} total vehicles
              </div>
            </div>

            {/* Lane Changes */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Lane Changes</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {laneChanges}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                MOBIL maneuvers
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Lane Telemetry Card */}
      {perLaneStats.length > 0 && (
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Lane-by-Lane Breakdown
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Distribution of flow, speed, and volume</p>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <Info className="h-4 w-4" />
                      <span className="sr-only">How is lane throughput calculated?</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] p-3 text-xs leading-relaxed" side="left">
                    <p className="font-semibold mb-1 text-slate-900 dark:text-white">Throughput Formula</p>
                    <p className="text-muted-foreground">
                      Throughput = Average Speed × Density per lane. Reflects vehicle throughput rate per hour.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {perLaneStats.map(({ lane, throughput, avgSpeed, carCount }) => {
                const laneLabel =
                  lane === 0 ? "Lane 1 (Leftmost)" : lane === perLaneStats.length - 1 ? `Lane ${lane + 1} (Rightmost)` : `Lane ${lane + 1}`;
                const displaySpeed = Math.round(conversions.speed.toDisplay(avgSpeed));

                return (
                  <div
                    key={lane}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {laneLabel}
                      </span>
                      <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                        {carCount} {carCount === 1 ? "car" : "cars"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Flow</span>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {Math.round(throughput)}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-0.5">cars/h</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Avg Speed</span>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {displaySpeed}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-0.5">{conversions.speed.unit}</span>
                      </div>
                    </div>
                  </div>
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
