
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Car } from "@/utils/trafficSimulation";
import { identifyPacks } from "./PackFormationChart";

interface PackFormationDataPoint {
  density: number;
  speedStdDev: number;
  packCount: number;
  time: number;
}

interface PackFormationHeatMapProps {
  cars: Car[];
  laneLength: number;
  elapsedTime: number;
  dataHistory: PackFormationDataPoint[];
}

const PackFormationHeatMap: React.FC<PackFormationHeatMapProps> = ({
  cars,
  laneLength,
  elapsedTime,
  dataHistory
}) => {
  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const density = cars.length / laneLength; // cars per mile
    const speeds = cars.map(car => car.speed);
    const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const speedVariance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length;
    const speedStdDev = Math.sqrt(speedVariance);
    const packCount = identifyPacks(cars, laneLength);
    
    return {
      density: parseFloat(density.toFixed(2)),
      speedStdDev: parseFloat(speedStdDev.toFixed(2)),
      packCount,
      time: parseFloat(elapsedTime.toFixed(1))
    };
  }, [cars, laneLength, elapsedTime]);

  const chartData = useMemo(() => {
    const historicalData = dataHistory.map(point => ({
      ...point,
      type: 'historical'
    }));
    
    if (currentPoint) {
      return [...historicalData, { ...currentPoint, type: 'current' }];
    }
    
    return historicalData;
  }, [dataHistory, currentPoint]);

  // Function to get color based on pack count
  const getPackCountColor = (packCount: number) => {
    if (packCount === 0) return "#10b981"; // green - no packs
    if (packCount === 1) return "#f59e0b"; // amber - single pack
    if (packCount <= 3) return "#ef4444"; // red - multiple packs
    return "#7c3aed"; // purple - many packs
  };

  const getPackCountSize = (packCount: number) => {
    return Math.max(4, Math.min(12, packCount * 2 + 4));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Pack Formation Heat Map</CardTitle>
        <p className="text-sm text-muted-foreground">
          Relationship between density, speed variation, and pack formation
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartContainer
            className="h-full"
            config={{
              packCount: {
                label: "Pack Count",
                color: "hsl(var(--primary))"
              }
            }}
          >
            <ScatterChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                bottom: 60,
                left: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="density"
                name="Density"
                label={{ 
                  value: "Traffic Density (cars/mile)", 
                  position: "insideBottom", 
                  offset: -40 
                }}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <YAxis
                dataKey="speedStdDev"
                name="Speed Std Dev"
                label={{ 
                  value: "Speed Standard Deviation (mph)", 
                  angle: -90, 
                  position: "insideLeft" 
                }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip 
                formatter={(value, name, props) => {
                  const { payload } = props;
                  return [
                    `${payload.packCount} packs`,
                    'Pack Count'
                  ];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const point = payload[0].payload;
                    return `Density: ${point.density} cars/mile, Speed Std Dev: ${point.speedStdDev} mph`;
                  }
                  return '';
                }}
              />
              <Scatter
                data={chartData.filter(d => d.type === 'historical')}
                fill="#8884d8"
              >
                {chartData.filter(d => d.type === 'historical').map((entry, index) => (
                  <Cell 
                    key={`historical-${index}`}
                    fill={getPackCountColor(entry.packCount)}
                    r={getPackCountSize(entry.packCount)}
                    fillOpacity={0.7}
                  />
                ))}
              </Scatter>
              <Scatter
                data={chartData.filter(d => d.type === 'current')}
                fill="#ef4444"
              >
                {chartData.filter(d => d.type === 'current').map((entry, index) => (
                  <Cell 
                    key={`current-${index}`}
                    fill={getPackCountColor(entry.packCount)}
                    r={getPackCountSize(entry.packCount) + 4}
                    stroke="#000"
                    strokeWidth={2}
                    fillOpacity={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        </div>
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>0 packs</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>1 pack</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>2-3 packs</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <span>4+ packs</span>
            </div>
          </div>
          <p>• Dot size indicates pack count • Black border indicates current state</p>
          <p>• Higher speed variation often correlates with more pack formation</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PackFormationHeatMap;
