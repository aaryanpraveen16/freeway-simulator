import React from "react";
import { Car, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CarStatsCardProps {
  cars: Car[];
  laneLength: number;
}

const CarStatsCard: React.FC<CarStatsCardProps> = ({ cars, laneLength }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Individual Car Stats</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cars.map((car, index) => {
            const distanceToCarAhead = calculateDistanceToCarAhead(
              index,
              cars,
              laneLength
            );

            return (
              <div
                key={car.id}
                className="flex flex-col p-3 border rounded-lg"
                style={{ borderColor: car.color }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: car.color }}
                  />
                  <span className="font-semibold">{car.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Desired Speed:
                    </span>
                    <span className="font-medium ml-1">
                      {Math.round(car.desiredSpeed)} mph
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Current Speed:
                    </span>
                    <span className="font-medium ml-1">
                      {Math.round(car.speed)} mph
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium ml-1">
                      {distanceToCarAhead} ft
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CarStatsCard;
