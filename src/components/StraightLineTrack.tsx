
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
  const trackWidth = 60; // width of each lane in pixels (increased for better visibility)
  const trackHeight = 100; // height of the track in pixels (not currently used)
  // Use a maximum width that fits within most screens while being responsive
  const maxTrackWidth = Math.min(1200, window.innerWidth * 0.8); // 80% of screen width, max 1200px
  const trackLength = maxTrackWidth - 160; // Account for labels and padding
  const totalTrackHeight = trackWidth * numLanes; // total height for all lanes
  const laneCenterOffset = trackWidth * 0.6; // Position cars lower in the lane (60% from top)
  const carHeight = 16; // height of car for vertical centering
  
  // Calculate density per lane
  const getLaneDensity = (laneIndex: number) => {
    const carsInLane = cars.filter(car => car.lane === laneIndex);
    const carCount = carsInLane.length;
    const density = laneLength > 0 ? (carCount / laneLength).toFixed(2) : "0.00";
    return density;
  };

  // Get lane color based on index
  const getLaneColor = (laneIndex: number) => {
    const colors = [
      "bg-slate-200", // Lane 1
      "bg-gray-200",  // Lane 2
      "bg-stone-200", // Lane 3
      "bg-neutral-200", // Lane 4
    ];
    return colors[laneIndex % colors.length];
  };
  
  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="relative mx-auto flex items-center gap-4" style={{ width: Math.min(maxTrackWidth, window.innerWidth - 40), height: totalTrackHeight + 50 }}>
        {/* Lane labels and density */}
        <div className="flex flex-col justify-center flex-shrink-0" style={{ height: totalTrackHeight, marginTop: "25px" }}>
          {Array.from({ length: numLanes }, (_, i) => {
            const density = getLaneDensity(i);
            return (
              <div 
                key={i} 
                className="flex flex-col justify-center text-xs text-gray-700 font-medium"
                style={{ height: trackWidth }}
              >
                <div className="font-bold">Lane {i + 1}</div>
                <div className="text-gray-600">{density}/mi</div>
              </div>
            );
          })}
        </div>
        
        {/* Track container */}
        <div className="relative flex-1 min-w-0">
          {/* Info display - moved above the track */}
          <div className="mb-2 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {cars.length} Cars • {numLanes} Lanes
            </span>
          </div>
          
          {/* Track rendering with distinct lanes */}
          <div className="relative border-2 border-gray-800 rounded-lg overflow-hidden" style={{ width: trackLength, height: totalTrackHeight }}>
            {/* Create lanes with distinct styling */}
            {Array.from({ length: numLanes }, (_, i) => (
              <div key={i} className="absolute" style={{ width: trackLength, height: trackWidth, top: i * trackWidth }}>
                {/* Lane background with alternating colors */}
                <div 
                  className={`absolute ${getLaneColor(i)} ${i === numLanes - 1 ? 'border-b-2 border-gray-800' : 'border-b-2 border-yellow-400'}`}
                  style={{
                    width: trackLength,
                    height: trackWidth,
                    left: 0,
                    top: 0,
                  }}
                />
                
                {/* Center line for the lane */}
                {i > 0 && (
                  <div 
                    className="absolute border-t-2 border-dashed border-gray-400"
                    style={{
                      width: trackLength,
                      top: 0,
                      left: 0,
                    }}
                  />
                )}
                
                {/* Lane number indicator on the left */}
                <div 
                  className="absolute bg-blue-600 text-white text-xs font-bold rounded-r px-2 py-1 flex items-center justify-center"
                  style={{
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: "20px",
                    minWidth: "25px",
                  }}
                >
                  {i + 1}
                </div>
                
                {/* Speed indicators on the right */}
                <div 
                  className="absolute bg-green-600 text-white text-xs font-medium rounded-l px-2 py-1 flex items-center justify-center"
                  style={{
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: "16px",
                  }}
                >
                  {65 + i * 5} mph
                </div>
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
              laneOffset={car.lane * trackWidth + laneCenterOffset + carHeight / 2}
              isStopped={stoppedCars.has(car.id)}
              onStopCar={onStopCar}
              onResumeCar={onResumeCar}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StraightLineTrack;
