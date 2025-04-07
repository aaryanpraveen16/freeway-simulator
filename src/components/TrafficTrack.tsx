import React from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import CarComponent from "./CarComponent";

interface TrafficTrackProps {
  cars: Car[];
  laneLength: number;
}

const TrafficTrack: React.FC<TrafficTrackProps> = ({ cars, laneLength }) => {
  const trackWidth = 30; // width of the track in pixels
  const trackHeight = 100; // height of the track in pixels
  const trackLength = 800; // length of the track in pixels
  
  return (
    <div className="relative mx-auto" style={{ width: trackLength, height: trackHeight + 50 }}>
      {/* Track */}
      <div 
        className="absolute border-8 border-gray-300 bg-gray-100"
        style={{
          width: trackLength,
          height: trackHeight,
          left: "0",
          top: "25px",
        }}
      />
      
      {/* Road markings */}
      <div 
        className="absolute border-dashed border-2 border-gray-400"
        style={{
          width: trackLength,
          height: trackHeight,
          left: "0",
          top: "25px",
        }}
      />
      
      {/* Center line */}
      <div 
        className="absolute border-dashed border-2 border-gray-400"
        style={{
          width: trackLength,
          height: 0,
          left: "0",
          top: "75px",
        }}
      />
      
      {/* Cars */}
      {cars.map((car, index) => (
        <CarComponent 
          key={car.id} 
          car={car} 
          laneLength={laneLength} 
          trackLength={trackLength}
          distanceToCarAhead={calculateDistanceToCarAhead(index, cars, laneLength)}
        />
      ))}
      
      {/* Info display */}
      <div 
        className="absolute bg-white shadow-sm flex items-center justify-center p-2 rounded"
        style={{
          left: "10px",
          top: "10px",
        }}
      >
        <span className="text-sm font-medium text-gray-500">
          {cars.length} Cars
        </span>
      </div>
    </div>
  );
};

export default TrafficTrack;
