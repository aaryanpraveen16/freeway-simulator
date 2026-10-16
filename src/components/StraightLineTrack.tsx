
import React from "react";
import { Car, calculateDistanceToCarAhead, Pack } from "@/utils/trafficSimulation";
import WebGLCarRenderer from "./WebGLCarRenderer";
import TrafficHeatStrip from "./TrafficHeatStrip";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StraightLineTrackProps {
  cars: Car[];
  packs?: Pack[];
  laneLength: number;
  numLanes: number;
  stoppedCars?: Set<number>;
  onStopCar?: (carId: number) => void;
  onResumeCar?: (carId: number) => void;
  carSize?: number;
  unitSystem?: UnitSystem;
  currentTime?: number;
  hideHeader?: boolean;
  className?: string;
}

const StraightLineTrack: React.FC<StraightLineTrackProps> = ({
  cars,
  packs = [],
  laneLength,
  numLanes,
  stoppedCars = new Set(),
  onStopCar,
  onResumeCar,
  carSize = 24,
  unitSystem = 'metric',
  currentTime = 0,
  hideHeader = false,
  className = "",
}) => {
  const conversions = getUnitConversions(unitSystem);
  const laneHeight = 80; // Height of each lane in pixels
  const trackPadding = 16; // Padding around the track

  const trackAreaRef = React.useRef<HTMLDivElement>(null);
  const [trackContentWidth, setTrackContentWidth] = React.useState(1200);

  React.useEffect(() => {
    const el = trackAreaRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.getBoundingClientRect().width || el.offsetWidth || el.clientWidth;
      if (w > 0) {
        setTrackContentWidth(w);
      }
    };

    updateWidth();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setTrackContentWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(el);
    window.addEventListener('resize', updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const totalTrackHeight = laneHeight * numLanes;
  const laneCenterOffset = laneHeight * 0.5;
  const carHeight = 20;

  // Animation variants
  const laneVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  // Calculate lane statistics
  const getLaneStats = React.useCallback((laneIndex: number) => {
    const carsInLane = cars.filter(car => car.lane === laneIndex);
    const carCount = carsInLane.length;
    const densityInternal = laneLength > 0 ? carCount / laneLength : 0;
    const densityDisplay = conversions.density.toDisplay(densityInternal);

    // Calculate average speed for the lane
    const totalSpeed = carsInLane.reduce((sum, car) => sum + car.speed, 0);
    const avgSpeedKmh = carsInLane.length > 0 ? totalSpeed / carsInLane.length : 0;
    const avgSpeedDisplay = conversions.speed.toDisplay(avgSpeedKmh);

    return {
      density: {
        value: densityDisplay.toFixed(2),
        unit: conversions.density.unit
      },
      carCount,
      avgSpeed: avgSpeedDisplay.toFixed(1),
      speedUnit: conversions.speed.unit
    };
  }, [cars, laneLength, conversions.density, conversions.speed]);

  // Memoize the lane statistics
  const laneStats = React.useMemo(() => {
    return Array.from({ length: numLanes }, (_, i) => getLaneStats(i));
  }, [numLanes, getLaneStats]);

  // Get lane gradient based on index
  const getLaneGradient = (laneIndex: number) => {
    const gradients = [
      "from-blue-50 to-blue-100",
      "from-emerald-50 to-emerald-100",
      "from-purple-50 to-purple-100",
      "from-amber-50 to-amber-100"
    ];
    return gradients[laneIndex % gradients.length];
  };

  // Get lane speed color based on average speed
  const getSpeedColor = (speed: number) => {
    if (speed < 5) return "text-red-500";
    if (speed < 10) return "text-amber-500";
    return "text-green-600";
  };

  return (
    <div className="w-full max-w-full pb-4">
      <div className="mx-auto flex flex-col gap-6 w-full">

        {/* Track visualization */}
        <div className="w-full">
          <div className={cn("bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-4", className)}>
            {!hideHeader && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Traffic Simulation</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Real-time vehicle movement and interactions</p>
              </div>
            )}

            {/* Track area: Modern Dark Asphalt Freeway */}
            <div
              ref={trackAreaRef}
              className="relative rounded-xl border border-slate-700/80 overflow-hidden shadow-2xl"
              style={{
                height: `${numLanes * laneHeight + trackPadding * 2}px`,
                backgroundColor: '#181b22', // Realistic dark asphalt
                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.6), 0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Top Shoulder / Guardrail Barrier */}
              <div
                className="absolute top-0 left-0 right-0 h-4 border-b border-amber-500/60 flex items-center"
                style={{
                  background: 'linear-gradient(180deg, #27272a 0%, #18181b 100%)',
                }}
              >
                <div className="w-full h-0.5 bg-amber-400/80 shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
              </div>

              {/* Bottom Shoulder / Guardrail Barrier */}
              <div
                className="absolute bottom-0 left-0 right-0 h-4 border-t border-amber-500/60 flex items-center"
                style={{
                  background: 'linear-gradient(0deg, #27272a 0%, #18181b 100%)',
                }}
              >
                <div className="w-full h-0.5 bg-amber-400/80 shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
              </div>

              {/* Lanes */}
              {Array.from({ length: numLanes }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${i * laneHeight + trackPadding}px`,
                    height: `${laneHeight}px`,
                  }}
                >
                  {/* Dashed White Highway Lane Separators */}
                  {i < numLanes - 1 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.45) 0px, rgba(255, 255, 255, 0.45) 24px, transparent 24px, transparent 52px)',
                        boxShadow: '0 0 3px rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  )}

                  {/* Lane badges & Speed stats */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-slate-300 w-6 h-6 rounded-md flex items-center justify-center shadow-lg font-mono">
                      L{i + 1}
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/85 backdrop-blur-md border border-slate-700/70 text-[11px] font-mono px-2.5 py-0.5 rounded-full text-emerald-400 shadow-md">
                      {(() => {
                        const laneCars = cars.filter(car => car.lane === i);
                        const avgSpeedKmh = laneCars.length > 0
                          ? laneCars.reduce((sum, car) => sum + car.speed, 0) / laneCars.length
                          : 0;

                        if (unitSystem === 'imperial') {
                          const mph = avgSpeedKmh * 0.621371;
                          return `${Math.round(mph)} mph`;
                        } else {
                          return `${Math.round(avgSpeedKmh)} km/h`;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Live Freeway Velocity / Density Heat Strip */}
              <TrafficHeatStrip
                cars={cars}
                laneLength={laneLength}
                numLanes={numLanes}
                trackLength={trackContentWidth}
                laneHeight={laneHeight}
              />

              {/* Cars (WebGL Accelerated) */}
              <div className="absolute inset-0 overflow-visible [&_canvas]:!w-full [&_canvas]:!h-full">
                <WebGLCarRenderer
                  cars={cars}
                  packs={packs}
                  laneLength={laneLength}
                  width={trackContentWidth}
                  height={numLanes * laneHeight + trackPadding * 2}
                  trackType="straight"
                  trackLength={trackContentWidth}
                  laneHeight={laneHeight}
                  laneCenterOffset={laneCenterOffset}
                  trackPadding={trackPadding}
                  carSize={carSize}
                  unitSystem={unitSystem}
                  stoppedCars={stoppedCars}
                  onStopCar={onStopCar}
                  onResumeCar={onResumeCar}
                  currentTime={currentTime}
                />
              </div>

              {/* Subtle road distance tick markers along bottom shoulder */}
              <div
                className="absolute bottom-4 left-0 right-0 h-1.5 pointer-events-none opacity-40"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0px, rgba(255, 255, 255, 0.4) 1px, transparent 1px, transparent 40px)',
                }}
              />
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Lane 1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Lane 2</span>
              </div>
              {numLanes > 2 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Lane 3+</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                <span>Stopped</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StraightLineTrack;
