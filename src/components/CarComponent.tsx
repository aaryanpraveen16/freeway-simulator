
import React from "react";
import { Car } from "@/utils/trafficSimulation";
import { cn } from "@/lib/utils";
import { Car as CarIcon } from "lucide-react";

interface CarComponentProps {
  car: Car;
  laneLength: number;
  trackRadius: number;
  distanceToCarAhead: number;
}

const CarComponent: React.FC<CarComponentProps> = ({ 
  car, 
  laneLength, 
  trackRadius,
  distanceToCarAhead
}) => {
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
          className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-white/90 rounded-full px-1.5 py-0.5 text-xs font-semibold shadow-sm flex flex-col items-center"
          style={{ color: car.color }}
        >
          <span>{car.name}</span>
          <span>{Math.round(car.speed)} mph</span>
        </div>
        <div 
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/90 rounded-md px-1.5 py-0.5 text-xs shadow-sm"
        >
          {distanceToCarAhead} ft
        </div>
      </div>
    </div>
  );
};

export default CarComponent;
