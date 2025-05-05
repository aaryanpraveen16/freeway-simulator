
import React, { useState } from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import CarComponent from "./CarComponent";
import StraightLineTrack from "./StraightLineTrack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrafficTrackProps {
  cars: Car[];
  laneLength: number;
}

const TrafficTrack: React.FC<TrafficTrackProps> = ({ cars, laneLength }) => {
  const [activeView, setActiveView] = useState<"circular" | "straight">("circular");
  const trackRadius = 180; // radius in pixels
  const trackWidth = 30; // width of the track in pixels
  const trackHeight = 100; // height of the track in pixels
  const trackLength = 800; // length of the track in pixels
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="circular" onValueChange={(value) => setActiveView(value as "circular" | "straight")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="circular">Circular Track</TabsTrigger>
          <TabsTrigger value="straight">Straight Track</TabsTrigger>
        </TabsList>
        <TabsContent value="circular">
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
            {cars.map((car, index) => (
              <CarComponent 
                key={car.id} 
                car={car} 
                laneLength={laneLength} 
                trackRadius={trackRadius}
                trackType="circular"
                distanceToCarAhead={calculateDistanceToCarAhead(index, cars, laneLength)}
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
        </TabsContent>
        <TabsContent value="straight">
          <StraightLineTrack cars={cars} laneLength={laneLength} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrafficTrack;
