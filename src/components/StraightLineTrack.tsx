import React from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import CarComponent from "./CarComponent";

interface StraightLineTrackProps {
  cars: Car[];
  laneLength: number;
  numLanes: number;
}

const StraightLineTrack: React.FC<StraightLineTrackProps> = ({ cars, laneLength, numLanes }) => {
  const trackWidth = 30; // width of each lane in pixels
  const trackHeight = 100; // height of the track in pixels
  const trackLength = 800; // length of the track in pixels
  const totalTrackHeight = trackWidth * numLanes; // total height for all lanes
  
  return (
    <div className="relative mx-auto" style={{ width: trackLength, height: totalTrackHeight + 50 }}>
      {/* Info display - moved above the track */}
      <div className="mb-2 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-500">
          {cars.length} Cars • {numLanes} Lanes
        </span>
      </div>
      {/* Track container */}
      <div className="absolute" style={{ width: trackLength, height: totalTrackHeight, top: "25px" }}>
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
        />
      ))}
    </div>
  );
};

export default StraightLineTrack;
