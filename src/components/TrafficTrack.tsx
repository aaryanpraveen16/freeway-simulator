import React, { useState } from "react";
import { Car, calculateDistanceToCarAhead, Pack } from "@/utils/trafficSimulation";
import CanvasCarRenderer from "./CanvasCarRenderer";
import StraightLineTrack from "./StraightLineTrack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitSystem } from "@/utils/unitConversion";
import Stats from "stats.js";
import { useEffect, useRef } from "react";

interface TrafficTrackProps {
  cars: Car[];
  packs?: Pack[];
  laneLength: number;
  numLanes: number;
  stoppedCars?: Set<number>;
  onStopCar?: (carId: number) => void;
  onResumeCar?: (carId: number) => void;
  carSize?: number;
  unitSystem?: UnitSystem;
  currentTime?: number;
}

const TrafficTrack: React.FC<TrafficTrackProps> = ({
  cars,
  packs = [],
  laneLength,
  numLanes,
  stoppedCars = new Set(),
  onStopCar,
  onResumeCar,
  carSize = 24,
  unitSystem = 'metric',
  currentTime = 0,
}) => {
  const [activeView, setActiveView] = useState<"circular" | "straight">("straight");
  const trackRadius = 180; // radius in pixels
  const trackWidth = 30; // width of each lane in pixels
  const trackLength = 800; // length of the track in pixels

  // For circular view, we only show one lane
  const totalTrackSize = trackRadius * 2 + trackWidth;

  // Set a very high z-index for the tooltips to ensure they appear above everything
  const tooltipZIndex = 2147483647; // Maximum 32-bit integer
  const monitorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!monitorRef.current) return;

    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    stats.dom.style.position = 'absolute';
    stats.dom.style.left = '10px';
    stats.dom.style.top = '10px';
    stats.dom.style.zIndex = '100';
    monitorRef.current.appendChild(stats.dom);

    const animate = () => {
      stats.begin();
      // monitored code goes here
      stats.end();
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      if (monitorRef.current && monitorRef.current.contains(stats.dom)) {
        monitorRef.current.removeChild(stats.dom);
      }
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="space-y-4 relative" ref={monitorRef}>
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
                <CanvasCarRenderer
                  cars={cars}
                  packs={packs}
                  laneLength={laneLength}
                  width={totalTrackSize}
                  height={totalTrackSize}
                  trackType="circular"
                  trackRadius={trackRadius}
                  carSize={carSize}
                  unitSystem={unitSystem}
                  stoppedCars={stoppedCars}
                  onStopCar={onStopCar}
                  onResumeCar={onResumeCar}
                  currentTime={currentTime}
                />
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
              packs={packs}
              laneLength={laneLength}
              numLanes={numLanes}
              stoppedCars={stoppedCars}
              onStopCar={onStopCar}
              onResumeCar={onResumeCar}
              carSize={carSize}
              unitSystem={unitSystem}
              currentTime={currentTime}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TrafficTrack;
