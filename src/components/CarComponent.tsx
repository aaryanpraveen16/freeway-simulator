
import React, { useRef, useEffect } from "react";
import { Car } from "@/utils/trafficSimulation";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Car as CarIcon, Truck, Bike, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Use the provided distanceToCarAhead prop (already in meters)
  const gapToCarAhead = distanceToCarAhead;

  const getVehicleIcon = () => {
    const baseClass = "transition-all duration-200 ease-out";
    const hoverClass = isStopped ? "" : "group-hover:scale-110 group-hover:drop-shadow-lg";
    
    const iconProps = {
      size: carSize,
      className: cn(baseClass, hoverClass, isStopped ? "opacity-70" : ""),
      style: { color: car.color },
      fill: isStopped ? "#9ca3af" : car.color,
      stroke: isStopped ? "#6b7280" : "#1f2937",
      strokeWidth: 1.5
    };

    if (isStopped) {
      return (
        <div className="relative">
          <div className="absolute -inset-1 bg-red-500/20 rounded-full blur-sm group-hover:opacity-75 transition-opacity"></div>
          <AlertCircle {...iconProps} className={cn(iconProps.className, "relative")} />
        </div>
      );
    }

    switch (car.vehicleType) {
      case "truck":
        return <Truck {...iconProps} />;
      case "motorcycle":
        return <Bike {...iconProps} />;
      case "car":
      default:
        return <CarIcon {...iconProps} />;
    }
  };
  
  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        className="absolute z-10"
        style={{
          left: position.x - carSize / 2,
          top: trackType === "straight" ? position.y - carSize / 2 : position.y - carSize / 2,
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={cn(
                "relative group cursor-pointer",
                isStopped ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={handleClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {getVehicleIcon()}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 shadow-xl p-3 max-w-xs"
            sideOffset={8}
            align="center"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-yellow-300">{car.name}</h4>
                <span className="text-xs px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-300">
                  {car.vehicleType}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Speed:</span>
                  <span className="font-mono text-gray-100">{car.speed.toFixed(1)} m/s</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Gap:</span>
                  <span className="font-mono text-gray-100">{gapToCarAhead !== undefined ? (gapToCarAhead * 1000).toFixed(1) : 'N/A'} m</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Lane:</span>
                  <span className="font-mono text-gray-100">{car.lane + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Status:</span>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-medium",
                    isStopped 
                      ? "bg-red-900/30 text-red-400" 
                      : "bg-emerald-900/30 text-emerald-400"
                  )}>
                    {isStopped ? 'Stopped' : 'Moving'}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-amber-400/90 flex items-center gap-1.5">
                <Info size={12} />
                <span>Click to {isStopped ? 'resume' : 'stop'}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
};

export default CarComponent;
