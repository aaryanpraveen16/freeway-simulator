
import React from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import CarComponent from "./CarComponent";

interface StraightLineTrackProps {
  cars: Car[];
  laneLength: number;
  numLanes: number;
  stoppedCars?: Set<number>;
  onStopCar?: (carId: number) => void;
  onResumeCar?: (carId: number) => void;
}

const StraightLineTrack: React.FC<StraightLineTrackProps> = ({ 
  cars, 
  laneLength, 
  numLanes,
  stoppedCars = new Set(),
  onStopCar,
  onResumeCar,
}) => {
  const trackWidth = 30; // width of each lane in pixels
  const trackHeight = 100; // height of the track in pixels
  const trackLength = 800; // length of the track in pixels
  const totalTrackHeight = trackWidth * numLanes; // total height for all lanes
  
  // Calculate cars per lane and density
  const getLaneStats = (laneIndex: number) => {
    const carsInLane = cars.filter(car => car.lane === laneIndex);
    const carCount = carsInLane.length;
    const density = laneLength > 0 ? (carCount / laneLength).toFixed(2) : "0.00";
    return { carCount, density };
  };
  
  return (
    <div className="relative mx-auto flex items-center gap-4" style={{ width: trackLength + 120, height: totalTrackHeight + 50 }}>
      {/* Lane labels and stats */}
      <div className="flex flex-col justify-center" style={{ height: totalTrackHeight, marginTop: "25px" }}>
        {Array.from({ length: numLanes }, (_, i) => {
          const { carCount, density } = getLaneStats(i);
          return (
            <div 
              key={i} 
              className="flex flex-col justify-center text-xs text-gray-600"
              style={{ height: trackWidth }}
            >
              <div className="font-semibold">Lane {i + 1}</div>
              <div>{carCount} cars</div>
              <div>{density}/mi</div>
            </div>
          );
        })}
      </div>
      
      {/* Track container */}
      <div className="relative">
        {/* Info display - moved above the track */}
        <div className="mb-2 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-500">
            {cars.length} Cars • {numLanes} Lanes
          </span>
        </div>
        
        <div className="relative" style={{ width: trackLength, height: totalTrackHeight }}>
          {/* Create lanes */}
          {Array.from({ length: numLanes }, (_, i) => (
            <div key={i} className="absolute" style={{ width: trackLength, height: trackWidth, top: i * trackWidth }}>
              {/* Lane background */}
              <div 
                className="absolute border-8 border-gray-300 bg-gray-100"
                style={{
                  width: trackLength,
                  height: trackWidth,
                  left: "0",
                }}
              />
              
              {/* Lane markings */}
              <div 
                className="absolute border-dashed border-2 border-gray-400"
                style={{
                  width: trackLength,
                  height: trackWidth,
                  left: "0",
                }}
              />
              
              {/* Center line */}
              <div 
                className="absolute border-dashed border-2 border-gray-400"
                style={{
                  width: trackLength,
                  height: 0,
                  left: "0",
                  top: trackWidth / 2,
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Cars */}
        {cars.map((car, index) => (
          <CarComponent 
            key={car.id} 
            car={car} 
            laneLength={laneLength} 
            trackLength={trackLength}
            trackType="straight"
            distanceToCarAhead={calculateDistanceToCarAhead(index, cars, laneLength)}
            laneOffset={car.lane * trackWidth}
            isStopped={stoppedCars.has(car.id)}
            onStopCar={onStopCar}
            onResumeCar={onResumeCar}
          />
        ))}
      </div>
    </div>
  );
};

export default StraightLineTrack;
