
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Car } from "@/utils/trafficSimulation";
import { identifyPacks } from "./PackFormationChart";

interface AveragePackLengthChartProps {
  packLengthHistory: {
    time: number;
    averageLength: number;
  }[];
}

const AveragePackLengthChart: React.FC<AveragePackLengthChartProps> = ({ packLengthHistory }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Average Pack Length Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            config={{
              averageLength: {
                label: "Average Length",
                color: "hsl(var(--chart-yellow))"
              }
            }}
          >
            <LineChart
              data={packLengthHistory}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                name="Time"
                label={{ value: "Time (seconds)", position: "insideBottomRight", offset: -10 }}
              />
              <YAxis
                label={{ value: "Average Pack Length (feet)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip formatter={(value) => [`${value.toFixed(1)} feet`, "Average Pack Length"]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageLength"
                name="Average Length"
                stroke="hsl(var(--chart-yellow))"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate average pack length
export const calculateAveragePackLength = (cars: Car[], laneLength: number): number => {
  if (cars.length === 0) return 0;
  
  // Sort cars by position
  const sortedCars = [...cars].sort((a, b) => a.position - b.position);
  
  let packCount = 1;
  let currentPackStart = 0;
  let packLengths: number[] = [];
  let currentPackSpeed = sortedCars[0].speed;
  
  const safeDistanceThreshold = 100; // Safe distance threshold in feet
  const gapThresholdBuffer = 50; // Buffer for gap threshold in feet
  const totalGapThreshold = safeDistanceThreshold + gapThresholdBuffer;
  
  for (let i = 1; i < sortedCars.length; i++) {
    const car = sortedCars[i];
    const prevCar = sortedCars[i - 1];
    
    // Calculate gap between current car and previous car
    let gap = car.position - prevCar.position;
    
    // Adjust for track wraparound
    if (gap < 0) {
      gap += laneLength;
    }
    
    // Check both speed difference AND gap criteria
    const speedDifference = Math.abs(car.speed - currentPackSpeed);
    const isNewPackBySpeed = speedDifference > 10;
    const isNewPackByGap = gap > totalGapThreshold;
    
    if (isNewPackBySpeed || isNewPackByGap) {
      // Calculate length of current pack
      let packLength = prevCar.position - sortedCars[currentPackStart].position;
      
      // Adjust for track wraparound for the pack length
      if (packLength < 0) {
        packLength += laneLength;
      }
      
      packLengths.push(packLength);
      packCount++;
      currentPackStart = i;
      currentPackSpeed = car.speed;
    }
  }
  
  // Don't forget the last pack
  let lastPackLength = sortedCars[sortedCars.length - 1].position - sortedCars[currentPackStart].position;
  
  // Adjust for track wraparound
  if (lastPackLength < 0) {
    lastPackLength += laneLength;
  }
  
  packLengths.push(lastPackLength);
  
  // Calculate average
  const totalPackLength = packLengths.reduce((sum, length) => sum + length, 0);
  return packLengths.length ? totalPackLength / packLengths.length : 0;
};

export default AveragePackLengthChart;
