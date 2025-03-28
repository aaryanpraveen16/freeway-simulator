
import React from "react";
import { Car } from "@/utils/trafficSimulation";
import CarComponent from "./CarComponent";

interface TrafficTrackProps {
  cars: Car[];
  laneLength: number;
}

const TrafficTrack: React.FC<TrafficTrackProps> = ({ cars, laneLength }) => {
  const trackRadius = 180; // radius in pixels
  const trackWidth = 30; // width of the track in pixels
  
  return (
    <div className="relative mx-auto" style={{ width: 2 * trackRadius + 100, height: 2 * trackRadius + 100 }}>
      {/* Track */}
      <div 
        className="absolute rounded-full border-8 border-gray-300 bg-gray-100"
        style={{
          width: 2 * trackRadius + trackWidth,
          height: 2 * trackRadius + trackWidth,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      
      {/* Road markings */}
      <div 
        className="absolute rounded-full border-dashed border-2 border-gray-400"
        style={{
          width: 2 * trackRadius,
          height: 2 * trackRadius,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      
      {/* Cars */}
      {cars.map((car) => (
        <CarComponent 
          key={car.id} 
          car={car} 
          laneLength={laneLength} 
          trackRadius={trackRadius} 
        />
      ))}
      
      {/* Center */}
      <div 
        className="absolute bg-white rounded-full shadow-sm flex items-center justify-center"
        style={{
          width: trackRadius,
          height: trackRadius,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
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
