import React, { useState } from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import CarComponent from "./CarComponent";
import StraightLineTrack from "./StraightLineTrack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrafficTrackProps {
  cars: Car[];
  laneLength: number;
  numLanes: number;
}

const TrafficTrack: React.FC<TrafficTrackProps> = ({ cars, laneLength, numLanes }) => {
  const [activeView, setActiveView] = useState<"circular" | "straight">("circular");
  const trackRadius = 180; // radius in pixels
  const trackWidth = 30; // width of each lane in pixels
  const trackLength = 800; // length of the track in pixels
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="circular" onValueChange={(value) => setActiveView(value as "circular" | "straight")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="circular">Circular Track</TabsTrigger>
          <TabsTrigger value="straight">Straight Track</TabsTrigger>
        </TabsList>
        <TabsContent value="circular">
          <div className="relative mx-auto" style={{ width: trackRadius * 2 + trackWidth * numLanes, height: trackRadius * 2 + trackWidth * numLanes }}>
            {/* Create lanes */}
            {Array.from({ length: numLanes }, (_, i) => {
              const currentRadius = trackRadius + (i * trackWidth);
              return (
                <div key={i} className="absolute" style={{ width: currentRadius * 2, height: currentRadius * 2, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                  {/* Lane background */}
                  <div 
                    className="absolute border-8 border-gray-300 bg-gray-100 rounded-full"
                    style={{
                      width: currentRadius * 2,
                      height: currentRadius * 2,
                      left: "0",
                      top: "0",
                    }}
                  />
                  
                  {/* Lane markings */}
                  <div 
                    className="absolute border-dashed border-2 border-gray-400 rounded-full"
                    style={{
                      width: currentRadius * 2,
                      height: currentRadius * 2,
                      left: "0",
                      top: "0",
                    }}
                  />
                </div>
              );
            })}
            
            {/* Cars */}
            {cars.map((car, index) => (
              <CarComponent 
                key={car.id} 
                car={car} 
                laneLength={laneLength} 
                trackRadius={trackRadius + (car.lane * trackWidth)}
                trackType="circular"
                distanceToCarAhead={calculateDistanceToCarAhead(index, cars, laneLength)}
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
          <StraightLineTrack cars={cars} laneLength={laneLength} numLanes={numLanes} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrafficTrack;
