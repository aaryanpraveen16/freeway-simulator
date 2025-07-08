
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Car } from "@/utils/trafficSimulation";

interface SpeedByLaneDataPoint {
  time: number;
  overallAvgSpeed: number;
  [key: string]: number; // For lane-specific speeds like lane0, lane1, etc.
}

interface SpeedByLaneChartProps {
  cars: Car[];
  elapsedTime: number;
  dataHistory: SpeedByLaneDataPoint[];
  numLanes: number;
  trafficRule: 'american' | 'european';
}

const SpeedByLaneChart: React.FC<SpeedByLaneChartProps> = ({
  cars,
  elapsedTime,
  dataHistory,
  numLanes,
  trafficRule
}) => {
  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const overallAvgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    const point: SpeedByLaneDataPoint = {
      time: parseFloat(elapsedTime.toFixed(1)),
      overallAvgSpeed: parseFloat(overallAvgSpeed.toFixed(1))
    };
    
    // Calculate average speed per lane
    for (let i = 0; i < numLanes; i++) {
      const carsInLane = cars.filter(car => car.lane === i);
      const avgSpeed = carsInLane.length > 0 
        ? carsInLane.reduce((sum, car) => sum + car.speed, 0) / carsInLane.length 
        : 0;
      point[`lane${i}`] = parseFloat(avgSpeed.toFixed(1));
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
        <CardTitle className="text-lg">Speed by Lane</CardTitle>
        <p className="text-sm text-muted-foreground">
          Average speed by lane and overall freeway speed ({trafficRule} rules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            className="h-full"
            config={{
              overallAvgSpeed: {
                label: "Overall Average Speed",
                color: "#000"
              },
              ...Object.fromEntries(
                Array.from({ length: numLanes }, (_, i) => [
                  `lane${i}`,
                  {
                    label: `Lane ${i + 1}`,
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
                label={{ value: "Speed (mph)", angle: -90, position: "insideLeft" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              
              <Line
                dataKey="overallAvgSpeed"
                stroke="#000"
                strokeWidth={3}
                dot={false}
                name="Overall Average"
              />
              
              {Array.from({ length: numLanes }, (_, i) => (
                <Line
                  key={i}
                  dataKey={`lane${i}`}
                  stroke={laneColors[i] || "#666"}
                  strokeWidth={2}
                  dot={false}
                  name={`Lane ${i + 1}`}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeedByLaneChart;
