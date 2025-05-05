
import React from "react";
import { Car } from "@/utils/trafficSimulation";
import { cn } from "@/lib/utils";
import { Car as CarIcon } from "lucide-react";

interface CarComponentProps {
  car: Car;
  laneLength: number;
  trackRadius?: number; // for circular track
  trackLength?: number; // for straight track
  trackType?: "circular" | "straight";
  distanceToCarAhead: number;
}

const CarComponent: React.FC<CarComponentProps> = ({ 
  car, 
  laneLength, 
  trackRadius = 180,
  trackLength = 800,
  trackType = "circular",
  distanceToCarAhead
}) => {
  // Extract car number from the name (e.g., "Car 3" -> "3")
  const carNumber = car.name.split(' ')[1];
  
  if (trackType === "circular") {
    // Calculate the angle based on the car's position in the loop
    const angle = (car.position / laneLength) * 360;
    
    return (
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: "50%",
          top: "50%",
          transform: `rotate(${angle}deg) translateX(${trackRadius}px) rotate(-${angle}deg)`,
        }}
      >
        <div className="relative">
          <div className="relative">
            <CarIcon 
              size={24} 
              className={cn("transform -translate-x-1/2 -translate-y-1/2")}
              color={car.color}
              fill={car.color}
              style={{
                filter: `drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.25))`,
              }}
            />
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold"
              style={{ textShadow: "0px 0px 2px rgba(0, 0, 0, 0.8)" }}
            >
              {carNumber}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Straight line positioning
    // Calculate the x position based on the car's position in the loop
    const xPosition = (car.position / laneLength) * trackLength;
    
    return (
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${xPosition}px`,
          top: "75px", // Center of the track
        }}
      >
        <div className="relative">
          <div className="relative">
            <CarIcon 
              size={24} 
              className={cn("transform -translate-x-1/2 -translate-y-1/2")}
              color={car.color}
              fill={car.color}
              style={{
                filter: `drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.25))`,
              }}
            />
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold"
              style={{ textShadow: "0px 0px 2px rgba(0, 0, 0, 0.8)" }}
            >
              {carNumber}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default CarComponent;
