
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "@/utils/trafficSimulation";

export interface PackDensityItem {
  densityRange: string;
  carCount: number;
  percentage: number;
}

interface PackDensityChartProps {
  packDensityData: PackDensityItem[];
}

export function calculatePackDensityMetrics(cars: Car[], laneLength: number): PackDensityItem[] {
  if (cars.length === 0) return [];
  
  // Calculate density ranges based on car spacing
  const densityRanges = [
    { label: "Very Dense (0-50ft)", min: 0, max: 50 },
    { label: "Dense (50-100ft)", min: 50, max: 100 },
    { label: "Medium (100-200ft)", min: 100, max: 200 },
    { label: "Light (200-300ft)", min: 200, max: 300 },
    { label: "Very Light (300ft+)", min: 300, max: Infinity }
  ];
  
  // Calculate gaps between consecutive cars
  const gaps: number[] = [];
  for (let i = 0; i < cars.length; i++) {
    const currentCar = cars[i];
    const nextCarIndex = (i + 1) % cars.length;
    const nextCar = cars[nextCarIndex];
    
    let gap = nextCar.position - currentCar.position;
    if (gap < 0) {
      gap += laneLength;
    }
    gaps.push(gap);
  }
  
  // Categorize gaps into density ranges
  const densityData = densityRanges.map(range => {
    const carsInRange = gaps.filter(gap => gap >= range.min && gap < range.max).length;
    const percentage = gaps.length > 0 ? (carsInRange / gaps.length) * 100 : 0;
    
    return {
      densityRange: range.label,
      carCount: carsInRange,
      percentage: Math.round(percentage * 10) / 10
    };
  });
  
  return densityData;
}

const PackDensityChart: React.FC<PackDensityChartProps> = ({ packDensityData }) => {
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Cars: {typeof payload[0].value === 'number' ? payload[0].value : 0}
          </p>
          <p className="text-green-600">
            Percentage: {typeof data.percentage === 'number' ? data.percentage.toFixed(1) : '0.0'}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Traffic Density Distribution</CardTitle>
        <CardDescription>
          Distribution of cars by spacing density ranges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={packDensityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="densityRange" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={customTooltip} />
              <Legend />
              <Bar 
                dataKey="carCount" 
                fill="#3b82f6" 
                name="Number of Cars"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Density ranges:</strong> Based on the gap between consecutive cars
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Very Dense: Cars are very close together (0-50 feet apart)</li>
            <li>Dense: Cars are close together (50-100 feet apart)</li>
            <li>Medium: Normal spacing (100-200 feet apart)</li>
            <li>Light: Cars are well spaced (200-300 feet apart)</li>
            <li>Very Light: Cars are far apart (300+ feet apart)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PackDensityChart;
