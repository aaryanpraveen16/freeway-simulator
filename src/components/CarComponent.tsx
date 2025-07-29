
import React from "react";
import { Car } from "@/utils/trafficSimulation";
import { cn } from "@/lib/utils";
import { Car as CarIcon, StopCircle, Truck, Bike } from "lucide-react";
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
  carSize?: number;
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
  carSize = 24,
}) => {
  
  // Calculate position based on track type
  // Add a small vertical offset to position cars lower in their lanes
  const verticalOffset = 10; // pixels to offset the car downward
  
  const position = trackType === "circular" && trackRadius
    ? {
        x: trackRadius + trackRadius * Math.cos((car.position / laneLength) * 2 * Math.PI),
        y: trackRadius + trackRadius * Math.sin((car.position / laneLength) * 2 * Math.PI) + verticalOffset,
      }
    : {
        x: (car.position / laneLength) * (trackLength || 0),
        y: (laneOffset || 0) + verticalOffset, // Add vertical offset to position lower in the lane
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

  // Get the appropriate icon based on vehicle type
  const getVehicleIcon = () => {
    if (isStopped) {
      return (
        <StopCircle
          size={carSize}
          className="text-red-500"
          strokeWidth={2}
        />
      );
    }

    switch (car.vehicleType) {
      case "truck":
        return (
          <Truck
            size={carSize}
            className={cn("transition-colors", "hover:scale-110")}
            style={{ color: car.color }}
            fill={car.color}
            stroke="#222"
          />
        );
      case "motorcycle":
        return (
          <Bike
            size={carSize}
            className={cn("transition-colors", "hover:scale-110")}
            style={{ color: car.color }}
            fill={car.color}
            stroke="#222"
          />
        );
      case "car":
      default:
        return (
          <CarIcon
            size={carSize}
            className={cn("transition-colors", "hover:scale-110")}
            style={{ color: car.color }}
            fill={car.color}
            stroke="#222"
          />
        );
    }
  };
  
  return (
    <div
      className="absolute transition-all duration-100 ease-linear"
      style={{
        left: position.x - carSize / 2,
        top: trackType === "straight" ? position.y - carSize / 2 : position.y - carSize / 2,
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
        {getVehicleIcon()}
        
        {/* Enhanced Tooltip with viewport-aware positioning */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/95 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap z-[2147483647] border border-gray-700"
          style={{
            backdropFilter: 'blur(4px)',
            minWidth: '180px',
            pointerEvents: 'auto',
            transform: 'translateX(-50%) translateZ(0)',
            // Position above by default, but flip to bottom if near top of viewport
            bottom: '100%',
            marginBottom: '0.5rem',
            // Add viewport constraint styles
            maxWidth: 'calc(100vw - 2rem)',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          ref={(el) => {
            if (!el) return;
            // Check if tooltip would go off-screen
            const rect = el.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Reset any previous positioning
            el.style.bottom = '100%';
            el.style.top = 'auto';
            el.style.left = '50%';
            el.style.right = 'auto';
            el.style.transform = 'translateX(-50%)';
            
            // If tooltip would go off the top, position it below instead
            if (rect.top < 10) {
              el.style.bottom = 'auto';
              el.style.top = '100%';
              el.style.marginTop = '0.5rem';
              el.style.marginBottom = '0';
            }
            
            // If tooltip would go off the right, align right edge
            if (rect.right > viewportWidth - 10) {
              el.style.left = 'auto';
              el.style.right = '0';
              el.style.transform = 'none';
            }
            
            // If tooltip would go off the left, align left edge
            if (rect.left < 10) {
              el.style.left = '0';
              el.style.transform = 'none';
            }
          }}
        >
          <div className="font-semibold text-yellow-300">{car.name} <span className="text-gray-300 text-xs">({car.vehicleType})</span></div>
          <div className="mt-1 pt-1 border-t border-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-300">Speed:</span>
              <span className="font-mono">{Math.round(car.speed)} mph</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Gap:</span>
              <span className="font-mono">{distanceToCarAhead.toFixed(3)} mi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Lane:</span>
              <span className="font-mono">{car.lane + 1}</span>
            </div>
          </div>
          <div className="mt-2 pt-1 text-center text-yellow-300 text-xs font-medium border-t border-gray-700">
            {isStopped ? "Click to resume" : "Click to stop"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarComponent;
