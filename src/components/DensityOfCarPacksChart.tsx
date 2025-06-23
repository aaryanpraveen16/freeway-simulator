
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Car } from "@/utils/trafficSimulation";

interface DensityOfCarPacksDataPoint {
  time: number;
  overallDensity: number;
  averagePackSize: number;
  [key: string]: number; // For lane-specific densities
}

interface DensityOfCarPacksChartProps {
  cars: Car[];
  elapsedTime: number;
  laneLength: number;
  dataHistory: DensityOfCarPacksDataPoint[];
  numLanes: number;
  trafficRule: 'american' | 'european';
}

// Helper function to identify packs in a specific lane
const identifyPacksInLane = (carsInLane: Car[], laneLength: number) => {
  if (carsInLane.length === 0) return { packCount: 0, totalPackSize: 0 };
  
  const sortedCars = [...carsInLane].sort((a, b) => a.position - b.position);
  let packCount = 1;
  let totalPackSize = 1;
  let currentPackSize = 1;
  
  for (let i = 1; i < sortedCars.length; i++) {
    const distance = Math.abs(sortedCars[i].position - sortedCars[i-1].position);
    const relativeDistance = distance / laneLength;
    
    // If cars are close together (within 0.02 of track length), they're in the same pack
    if (relativeDistance < 0.02) {
      currentPackSize++;
    } else {
      totalPackSize += currentPackSize;
      packCount++;
      currentPackSize = 1;
    }
  }
  
  return { packCount, totalPackSize };
};

const DensityOfCarPacksChart: React.FC<DensityOfCarPacksChartProps> = ({
  cars,
  elapsedTime,
  laneLength,
  dataHistory,
  numLanes,
  trafficRule
}) => {
  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    // Overall density (cars per mile)
    const overallDensity = cars.length / laneLength;
    
    // Calculate pack information for all cars
    let totalPacks = 0;
    let totalPackSize = 0;
    
    const point: DensityOfCarPacksDataPoint = {
      time: parseFloat(elapsedTime.toFixed(1)),
      overallDensity: parseFloat(overallDensity.toFixed(2)),
      averagePackSize: 0
    };
    
    // Calculate density and pack info per lane
    for (let i = 0; i < numLanes; i++) {
      const carsInLane = cars.filter(car => car.lane === i);
      const laneDensity = carsInLane.length / laneLength;
      const { packCount, totalPackSize: lanePackSize } = identifyPacksInLane(carsInLane, laneLength);
      
      point[`lane${i}Density`] = parseFloat(laneDensity.toFixed(2));
      point[`lane${i}Packs`] = packCount;
      
      totalPacks += packCount;
      totalPackSize += lanePackSize;
    }
    
    point.averagePackSize = totalPacks > 0 ? parseFloat((totalPackSize / totalPacks).toFixed(1)) : 0;
    
    return point;
  }, [cars, elapsedTime, laneLength, numLanes]);

  const chartData = useMemo(() => {
    const data = [...dataHistory];
    if (currentPoint) {
      data.push(currentPoint);
    }
    return data.slice(-50); // Keep last 50 points
  }, [dataHistory, currentPoint]);

  const laneColors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Density of Car Packs</CardTitle>
        <p className="text-sm text-muted-foreground">
          Overall density of car packs (# per mile) and average size of packs ({trafficRule} rules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            className="h-full"
            config={{
              overallDensity: {
                label: "Overall Density",
                color: "#000"
              },
              averagePackSize: {
                label: "Average Pack Size",
                color: "#dc2626"
              },
              ...Object.fromEntries(
                Array.from({ length: numLanes }, (_, i) => [
                  `lane${i}Density`,
                  {
                    label: `Lane ${i + 1} Density`,
                    color: laneColors[i] || "#666"
                  }
                ])
              )
            }}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                label={{ value: "Density (packs/mile)", angle: -90, position: "insideLeft" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              
              <Line
                dataKey="overallDensity"
                stroke="#000"
                strokeWidth={3}
                dot={false}
                name="Overall Density"
              />
              
              <Line
                dataKey="averagePackSize"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                name="Avg Pack Size"
                strokeDasharray="5 5"
              />
              
              {Array.from({ length: numLanes }, (_, i) => (
                <Line
                  key={i}
                  dataKey={`lane${i}Density`}
                  stroke={laneColors[i] || "#666"}
                  strokeWidth={1.5}
                  dot={false}
                  name={`Lane ${i + 1}`
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DensityOfCarPacksChart;
