
import React from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import CarComponent from "./CarComponent";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StraightLineTrackProps {
  cars: Car[];
  laneLength: number;
  numLanes: number;
  stoppedCars?: Set<number>;
  onStopCar?: (carId: number) => void;
  onResumeCar?: (carId: number) => void;
  carSize?: number;
  unitSystem?: UnitSystem;
}

const StraightLineTrack: React.FC<StraightLineTrackProps> = ({
  cars,
  laneLength,
  numLanes,
  stoppedCars = new Set(),
  onStopCar,
  onResumeCar,
  carSize = 24,
  unitSystem = 'imperial',
}) => {
  const conversions = getUnitConversions(unitSystem);
  const laneHeight = 80; // Height of each lane in pixels
  const trackPadding = 16; // Padding around the track
  
  // Calculate track dimensions
  const maxTrackWidth = Math.min(1200, window.innerWidth * 0.9);
  const trackContentWidth = maxTrackWidth - 200; // Space for controls and stats
  const totalTrackHeight = laneHeight * numLanes;
  const laneCenterOffset = laneHeight * 0.6;
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
    <div className="w-full max-w-full p-4">
      <div className="mx-auto flex flex-col lg:flex-row gap-6 max-w-7xl">
        {/* Lane controls and stats */}
        <div className="w-full lg:w-64 space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-800">Traffic Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Vehicles:</span>
                <span className="font-medium">{cars.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Lanes:</span>
                <span className="font-medium">{numLanes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stopped:</span>
                <span className="font-medium text-amber-600">{stoppedCars.size}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-800">Lane Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: numLanes }).map((_, i) => (
                <motion.div 
                  key={i}
                  className="p-3 rounded-lg border border-gray-200 bg-white/50"
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={laneVariant}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        i % 4 === 0 ? 'bg-blue-500' : 
                        i % 4 === 1 ? 'bg-emerald-500' : 
                        i % 4 === 2 ? 'bg-purple-500' : 'bg-amber-500'
                      }`}></div>
                      <span className="font-medium text-gray-800">Lane {i + 1}</span>
                      {i === 0 && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Left</span>}
                      {i === numLanes - 1 && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Right</span>}
                    </div>
                    <div className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                      {laneStats[i]?.carCount || 0} cars
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-gray-500">Density</div>
                      <div className="font-medium">{laneStats[i]?.density.value} {laneStats[i]?.density.unit}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-500">Avg Speed</div>
                      <div className={`font-medium ${getSpeedColor(parseFloat(laneStats[i]?.avgSpeed || '0'))}`}>
                        {laneStats[i]?.avgSpeed} {laneStats[i]?.speedUnit}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Track visualization */}
        <div className="flex-1">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Traffic Simulation</h3>
              <p className="text-sm text-gray-500">Real-time vehicle movement and interactions</p>
            </div>
            
            {/* Track area */}
            <div 
              className="relative rounded-lg border-2 border-gray-200 overflow-hidden"
              style={{ 
                height: `${numLanes * laneHeight + trackPadding * 2}px`,
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
              }}
            >
              {/* Lanes */}
              {Array.from({ length: numLanes }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute left-0 right-0 h-[${laneHeight}px] bg-gradient-to-r ${getLaneGradient(i)}`}
                  style={{
                    top: `${i * laneHeight + trackPadding}px`,
                    height: `${laneHeight}px`,
                    borderBottom: i < numLanes - 1 ? '1px dashed rgba(203, 213, 225, 0.6)' : 'none'
                  }}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={laneVariant}
                >
                  {/* Lane markers */}
                  <div className="absolute inset-0">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm text-xs font-bold text-gray-700 w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                      {i + 1}
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-gray-700 shadow-sm">
                      {(() => {
                        // Calculate average speed for this lane
                        const laneCars = cars.filter(car => car.lane === i);
                        const avgSpeedKmh = laneCars.length > 0 
                          ? laneCars.reduce((sum, car) => sum + car.speed, 0) / laneCars.length
                          : 0;
                        
                        if (unitSystem === 'imperial') {
                          const mph = avgSpeedKmh * 0.621371; // Convert km/h to mph
                          return `${Math.round(mph)} mph`;
                        } else {
                          return `${Math.round(avgSpeedKmh)} km/h`;
                        }
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Cars */}
              <div className="absolute inset-0 overflow-visible">
                {cars.map((car, index) => (
                  <CarComponent 
                    key={car.id} 
                    car={car} 
                    laneLength={laneLength} 
                    trackLength={trackContentWidth}
                    trackType="straight"
                    distanceToCarAhead={calculateDistanceToCarAhead(index, cars, laneLength)}
                    laneOffset={car.lane * laneHeight + laneCenterOffset + carHeight / 2 + trackPadding}
                    isStopped={stoppedCars.has(car.id)}
                    onStopCar={onStopCar}
                    onResumeCar={onResumeCar}
                    carSize={carSize}
                  />
                ))}
              </div>
              
              {/* Grid lines for better spatial reference */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `
                  linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px),
                  linear-gradient(0deg, rgba(0,0,0,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}></div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
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
