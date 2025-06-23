
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Car } from "@/utils/trafficSimulation";

interface PercentageOfCarsByLaneDataPoint {
  time: number;
  [key: string]: number; // For lane percentages like lane0, lane1, etc.
}

interface PercentageOfCarsByLaneChartProps {
  cars: Car[];
  elapsedTime: number;
  dataHistory: PercentageOfCarsByLaneDataPoint[];
  numLanes: number;
  trafficRule: 'american' | 'european';
}

const PercentageOfCarsByLaneChart: React.FC<PercentageOfCarsByLaneChartProps> = ({
  cars,
  elapsedTime,
  dataHistory,
  numLanes,
  trafficRule
}) => {
  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const point: PercentageOfCarsByLaneDataPoint = {
      time: parseFloat(elapsedTime.toFixed(1))
    };
    
    const totalCars = cars.length;
    
    // Calculate percentage of cars in each lane
    for (let i = 0; i < numLanes; i++) {
      const carsInLane = cars.filter(car => car.lane === i).length;
      const percentage = totalCars > 0 ? (carsInLane / totalCars) * 100 : 0;
      point[`lane${i}`] = parseFloat(percentage.toFixed(1));
    }
    
    return point;
  }, [cars, elapsedTime, numLanes]);

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
        <CardTitle className="text-lg">Percentage of Cars by Lane</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribution of cars across lanes over time ({trafficRule} rules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            className="h-full"
            config={Object.fromEntries(
              Array.from({ length: numLanes }, (_, i) => [
                `lane${i}`,
                {
                  label: `Lane ${i + 1}`,
                  color: laneColors[i] || "#666"
                }
              ])
            )}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }}
                domain={[0, 100]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              
              {Array.from({ length: numLanes }, (_, i) => (
                <Line
                  key={i}
                  dataKey={`lane${i}`}
                  stroke={laneColors[i] || "#666"}
                  strokeWidth={2}
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

export default PercentageOfCarsByLaneChart;
