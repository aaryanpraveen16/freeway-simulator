import React from "react";
import { Car } from "@/utils/trafficSimulation";
import { cn } from "@/lib/utils";
import { Car as CarIcon, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarComponentProps {
  car: Car;
  laneLength: number;
  trackRadius?: number; // for circular track
  trackLength?: number; // for straight track
  trackType?: "circular" | "straight";
  distanceToCarAhead: number;
  laneOffset?: number; // vertical offset for lane position
  isStopped?: boolean;
  onStopCar?: (carId: number) => void;
  onResumeCar?: (carId: number) => void;
}

const CarComponent: React.FC<CarComponentProps> = ({
  car,
  laneLength,
  trackRadius,
  trackLength,
  trackType = "circular",
  distanceToCarAhead,
  laneOffset = 0,
  isStopped = false,
  onStopCar,
  onResumeCar,
}) => {
  const carSize = 24; // size of car icon in pixels
  
  // Calculate position based on track type
  const position = trackType === "circular" && trackRadius
    ? {
        x: trackRadius + trackRadius * Math.cos((car.position / laneLength) * 2 * Math.PI),
        y: trackRadius + trackRadius * Math.sin((car.position / laneLength) * 2 * Math.PI),
      }
    : {
        x: (car.position / laneLength) * (trackLength || 0),
        y: laneOffset + (trackType === "straight" ? 15 : 0), // Center in lane for straight track
      };
  
  // Calculate rotation for circular track
  const rotation = trackType === "circular"
    ? (car.position / laneLength) * 360 + 90
    : 0;

  const handleClick = () => {
    if (isStopped && onResumeCar) {
      onResumeCar(car.id);
    } else if (!isStopped && onStopCar) {
      onStopCar(car.id);
    }
  };
  
  return (
    <div
      className="absolute transition-all duration-100 ease-linear"
      style={{
        left: position.x - carSize / 2,
        top: position.y - carSize / 2,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div
        className={cn(
          "relative",
          "group cursor-pointer",
          isStopped && "opacity-75"
        )}
        onClick={handleClick}
      >
        {isStopped ? (
          <StopCircle
            size={carSize}
            className="text-red-500"
            strokeWidth={2}
          />
        ) : (
          <CarIcon
            size={carSize}
            className={cn(
              "transition-colors",
              "hover:scale-110"
            )}
            style={{ color: car.color }}
            fill={car.color}
            stroke="#222"
          />
        )}
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          <div>{car.name}</div>
          <div>Current Speed: {Math.round(car.speed)} mph</div>
          <div>Gap: {distanceToCarAhead.toFixed(3)} mi</div>
          <div>Lane: {car.lane + 1}</div>
          <div className="mt-1 text-yellow-300">
            {isStopped ? "Click to resume" : "Click to stop"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarComponent;
