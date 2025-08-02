import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Car } from "@/utils/trafficSimulation";

interface PackDensityByLaneDataPoint {
  trafficDensity: number;
  [key: string]: number; // lane0_packDensity, lane0_avgPackSize, etc.
}

interface PackDensityByLaneChartProps {
  cars: Car[];
  laneLength: number;
  dataHistory: PackDensityByLaneDataPoint[];
  numLanes: number;
  trafficRule: 'american' | 'european';
}

const identifyPacksInLane = (cars: Car[], laneLength: number) => {
  if (cars.length === 0) return { packCount: 0, totalPackSize: 0 };
  const sortedCars = [...cars].sort((a, b) => a.position - b.position);
  let packCount = 1;
  let currentPackSize = 1;
  for (let i = 1; i < sortedCars.length; i++) {
    const distance = Math.abs(sortedCars[i].position - sortedCars[i-1].position);
    const relativeDistance = distance / laneLength;
    if (relativeDistance < 0.02) {
      currentPackSize++;
    } else {
      packCount++;
      currentPackSize = 1;
    }
  }
  return { packCount, totalPackSize: currentPackSize };
};

const PackDensityByLaneChart: React.FC<PackDensityByLaneChartProps> = ({
  cars,
  laneLength,
  dataHistory,
  numLanes,
  trafficRule
}) => {
  const currentPoint = React.useMemo(() => {
    if (cars.length === 0) return null;
    const trafficDensity = laneLength > 0 ? cars.length / laneLength : 0;
    const point: PackDensityByLaneDataPoint = { trafficDensity };
    for (let i = 0; i < numLanes; i++) {
      const carsInLane = cars.filter(car => car.lane === i);
      const { packCount, totalPackSize } = identifyPacksInLane(carsInLane, laneLength);
      point[`lane${i}_packDensity`] = laneLength > 0 ? packCount / laneLength : 0;
      point[`lane${i}_avgPackSize`] = packCount > 0 ? totalPackSize / packCount : 0;
    }
    return point;
  }, [cars, laneLength, numLanes]);

  const chartData = React.useMemo(() => {
    const data = [...dataHistory];
    if (currentPoint) {
      data.push(currentPoint);
    }
    return data.slice(-50);
  }, [dataHistory, currentPoint]);

  const laneColors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Pack Density by Lane vs. Traffic Density</CardTitle>
        <p className="text-sm text-muted-foreground">
          Density of car packs and average pack size by lane, by traffic density ({trafficRule} rules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            className="h-full"
            config={Object.fromEntries(
              Array.from({ length: numLanes }, (_, i) => [
                `lane${i}_packDensity`,
                {
                  label: `Lane ${i + 1} Pack Density`,
                  color: laneColors[i] || "#666"
                }
              ]).concat(
                Array.from({ length: numLanes }, (_, i) => [
                  `lane${i}_avgPackSize`,
                  {
                    label: `Lane ${i + 1} Avg Pack Size`,
                    color: laneColors[i] || "#666",
                    theme: undefined
                  }
                ])
              )
            )}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="trafficDensity"
                label={{ value: "Traffic density (cars/mile)", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                label={{ value: "Pack Density / Avg Pack Size", angle: -90, position: "insideLeft" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {Array.from({ length: numLanes }, (_, i) => (
                <Line
                  key={`lane${i}_packDensity`}
                  dataKey={`lane${i}_packDensity`}
                  stroke={laneColors[i] || "#666"}
                  strokeWidth={2}
                  dot={false}
                  name={`Lane ${i + 1} Pack Density`}
                />
              ))}
              {Array.from({ length: numLanes }, (_, i) => (
                <Line
                  key={`lane${i}_avgPackSize`}
                  dataKey={`lane${i}_avgPackSize`}
                  stroke={laneColors[i] || "#666"}
                  strokeWidth={2}
                  dot={false}
                  name={`Lane ${i + 1} Avg Pack Size`}
                  strokeDasharray="5 5"
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PackDensityByLaneChart; 