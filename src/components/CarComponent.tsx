import React from "react";
import { Car } from "@/utils/trafficSimulation";
import { cn } from "@/lib/utils";
import { Car as CarIcon } from "lucide-react";

interface CarComponentProps {
  car: Car;
  laneLength: number;
  trackLength: number;
  distanceToCarAhead: number;
}

const CarComponent: React.FC<CarComponentProps> = ({ 
  car, 
  laneLength, 
  trackLength,
  distanceToCarAhead
}) => {
  // Calculate the position on the straight road with looping
  const positionPercentage = (car.position % laneLength) / laneLength * 100;
  const leftPosition = (positionPercentage / 100) * trackLength;
  
  // Extract car number from the name (e.g., "Car 3" -> "3")
  const carNumber = car.name.split(' ')[1];
  
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${leftPosition}px`,
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
};

export default CarComponent;
