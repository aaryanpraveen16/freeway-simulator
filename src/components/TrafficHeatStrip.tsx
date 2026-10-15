import React, { useMemo } from "react";
import { Car } from "@/utils/trafficSimulation";

interface TrafficHeatStripProps {
  cars: Car[];
  laneLength: number;
  numLanes: number;
  trackLength?: number;
  laneHeight?: number;
  segmentsCount?: number;
  className?: string;
}

// Convert average speed (km/h) into an evocative, readable color
function getSpeedColor(kmh: number | null): string {
  if (kmh === null) return "rgba(100, 116, 139, 0.25)"; // No cars, neutral track

  if (kmh > 75) {
    // Free Flow: Emerald Green
    return "rgba(16, 185, 129, 0.75)";
  } else if (kmh > 45) {
    // Moderate Flow: Yellow-Green
    return "rgba(132, 204, 22, 0.75)";
  } else if (kmh > 25) {
    // Heavy / Slow Traffic: Amber
    return "rgba(245, 158, 11, 0.85)";
  } else if (kmh > 8) {
    // Shockwave / Stop-and-Go: Coral Red
    return "rgba(239, 68, 68, 0.9)";
  } else {
    // Gridlock / Stopped Jam: Vivid Crimson
    return "rgba(185, 28, 28, 0.95)";
  }
}

export const TrafficHeatStrip: React.FC<TrafficHeatStripProps> = ({
  cars,
  laneLength,
  numLanes,
  trackLength,
  laneHeight = 80,
  segmentsCount = 40,
  className = "",
}) => {
  // Compute per-lane, per-segment average speeds
  const laneSegments = useMemo(() => {
    const segmentLength = laneLength / segmentsCount;
    const result: Array<Array<{ speed: number | null; count: number }>> = [];

    for (let l = 0; l < numLanes; l++) {
      const segments: Array<{ sumSpeed: number; count: number }> = Array.from(
        { length: segmentsCount },
        () => ({ sumSpeed: 0, count: 0 })
      );

      // Aggregate cars into spatial bins
      cars.forEach((car) => {
        if (car.lane === l) {
          const segIdx = Math.min(
            segmentsCount - 1,
            Math.max(0, Math.floor(car.position / segmentLength))
          );
          segments[segIdx].sumSpeed += car.speed;
          segments[segIdx].count += 1;
        }
      });

      result.push(
        segments.map((seg) => ({
          speed: seg.count > 0 ? seg.sumSpeed / seg.count : null,
          count: seg.count,
        }))
      );
    }

    return result;
  }, [cars, laneLength, numLanes, segmentsCount]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {laneSegments.map((segments, laneIndex) => {
        // Place the heat strip at the bottom border of each lane
        const topPosition = (laneIndex + 1) * laneHeight + 16 - 4; // 16px track padding, 4px strip height

        return (
          <div
            key={laneIndex}
            className="absolute left-0 right-0 flex h-1.5 opacity-80 backdrop-blur-xs transition-opacity duration-300"
            style={{ top: `${topPosition}px` }}
          >
            {segments.map((seg, segIdx) => (
              <div
                key={segIdx}
                className="flex-1 transition-colors duration-200"
                style={{
                  backgroundColor: getSpeedColor(seg.speed),
                  boxShadow:
                    seg.speed !== null && seg.speed < 20
                      ? "0 0 6px rgba(239, 68, 68, 0.6)"
                      : undefined,
                }}
                title={
                  seg.count > 0
                    ? `Lane ${laneIndex + 1} (${Math.round((segIdx / segmentsCount) * laneLength)}m): ${seg.speed!.toFixed(1)} km/h`
                    : undefined
                }
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default TrafficHeatStrip;
