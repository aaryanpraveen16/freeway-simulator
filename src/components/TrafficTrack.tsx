import React, { useState } from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import CarComponent from "./CarComponent";
import StraightLineTrack from "./StraightLineTrack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitSystem } from "@/utils/unitConversion";

interface TrafficTrackProps {
  cars: Car[];
  laneLength: number;
  numLanes: number;
  stoppedCars?: Set<number>;
  onStopCar?: (carId: number) => void;
  onResumeCar?: (carId: number) => void;
  carSize?: number;
  unitSystem?: UnitSystem;
}

const TrafficTrack: React.FC<TrafficTrackProps> = ({
  cars,
  laneLength,
  numLanes,
  stoppedCars = new Set(),
  onStopCar,
  onResumeCar,
  carSize = 24,
  unitSystem = 'imperial',
}) => {
  const [activeView, setActiveView] = useState<"circular" | "straight">("straight");
  const trackRadius = 180; // radius in pixels
  const trackWidth = 30; // width of each lane in pixels
  const trackLength = 800; // length of the track in pixels
  
  // For circular view, we only show one lane
  const totalTrackSize = trackRadius * 2 + trackWidth;
  
  // Set a very high z-index for the tooltips to ensure they appear above everything
  const tooltipZIndex = 2147483647; // Maximum 32-bit integer
  
  return (
    <div className="space-y-4 relative">
      <div className="relative" style={{ zIndex: 1 }}>
        <Tabs 
          value={activeView} 
          onValueChange={(value) => setActiveView(value as "circular" | "straight")}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <TabsList className="grid w-full grid-cols-2 relative" style={{ zIndex: 1, position: 'relative' }}>
            <TabsTrigger value="circular">Circular Track</TabsTrigger>
            <TabsTrigger value="straight">Straight Track</TabsTrigger>
          </TabsList>
          
          <TabsContent value="circular">
            <div className="relative mx-auto mt-[50px]" style={{ width: totalTrackSize, height: totalTrackSize }}>
              {/* Single lane for circular view */}
              <div 
                className="absolute" 
                style={{ 
                  width: trackRadius * 2, 
                  height: trackRadius * 2, 
                  left: "50%", 
                  top: "50%", 
                  transform: "translate(-50%, -50%)" 
                }}
              >
                {/* Lane background */}
                <div 
                  className="absolute border-8 border-gray-300 bg-gray-100 rounded-full"
                  style={{
                    width: trackRadius * 2,
                    height: trackRadius * 2,
                    left: "0",
                    top: "0",
                  }}
                />
                
                {/* Lane markings */}
                <div 
                  className="absolute border-dashed border-2 border-gray-400 rounded-full"
                  style={{
                    width: trackRadius * 2,
                    height: trackRadius * 2,
                    left: "0",
                    top: "0",
                  }}
                />
              </div>
              
              {/* Cars container with high z-index to ensure tooltips appear above all */}
              <div className="relative" style={{ zIndex: 2 }}>
                {cars.map((car, index) => (
                  <CarComponent 
                    key={car.id} 
                    car={car} 
                    laneLength={laneLength} 
                    trackRadius={trackRadius}
                    trackType="circular"
                    distanceToCarAhead={calculateDistanceToCarAhead(index, cars, laneLength)}
                    isStopped={stoppedCars.has(car.id)}
                    onStopCar={onStopCar}
                    onResumeCar={onResumeCar}
                    carSize={carSize}
                  />
                ))}
              </div>
              
              {/* Center info */}
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
                  {cars.length} Cars • {numLanes} Lanes
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="straight" className="mt-[50px]">
            <StraightLineTrack 
              cars={cars} 
              laneLength={laneLength} 
              numLanes={numLanes}
              stoppedCars={stoppedCars}
              onStopCar={onStopCar}
              onResumeCar={onResumeCar}
              carSize={carSize}
              unitSystem={unitSystem}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TrafficTrack;
