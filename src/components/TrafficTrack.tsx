import React, { useState } from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import CarComponent from "./CarComponent";
import StraightLineTrack from "./StraightLineTrack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrafficTrackProps {
  cars: Car[];
  laneLength: number;
  numLanes: number;
  stoppedCars?: Set<number>;
  onStopCar?: (carId: number) => void;
  onResumeCar?: (carId: number) => void;
}

const TrafficTrack: React.FC<TrafficTrackProps> = ({ 
  cars, 
  laneLength, 
  numLanes,
  stoppedCars = new Set(),
  onStopCar,
  onResumeCar,
}) => {
  const [activeView, setActiveView] = useState<"circular" | "straight">("straight");
  const trackRadius = 180; // radius in pixels
  const trackWidth = 30; // width of each lane in pixels
  const trackLength = 800; // length of the track in pixels
  
  // For circular view, we only show one lane
  const totalTrackSize = trackRadius * 2 + trackWidth;
  
  return (
    <div className="space-y-4">
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "circular" | "straight")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="circular">Circular Track</TabsTrigger>
          <TabsTrigger value="straight">Straight Track</TabsTrigger>
        </TabsList>
        
        <TabsContent value="circular">
          <div className="relative mx-auto" style={{ width: totalTrackSize, height: totalTrackSize }}>
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
            
            {/* Cars */}
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
              />
            ))}
            
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
        <TabsContent value="straight">
          <StraightLineTrack 
            cars={cars} 
            laneLength={laneLength} 
            numLanes={numLanes}
            stoppedCars={stoppedCars}
            onStopCar={onStopCar}
            onResumeCar={onResumeCar}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrafficTrack;
