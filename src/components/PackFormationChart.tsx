
import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";

interface PackFormationChartProps {
  packHistory: {
    time: number;
    packCount: number;
  }[];
}

const PackFormationChart: React.FC<PackFormationChartProps> = ({ packHistory }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleExportImage = () => {
    if (!chartRef.current) return;
    
    try {
      // Convert the chart to an SVG
      const svgElement = chartRef.current.querySelector("svg");
      if (!svgElement) {
        throw new Error("SVG element not found");
      }
      
      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Set background for the SVG
      clonedSvg.setAttribute("background", "white");
      
      // Serialize SVG to a string
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      
      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(svgBlob);
      downloadLink.download = "pack-formation-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Show success message
      toast({
        title: "Chart exported",
        description: "Pack formation chart has been exported successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error exporting chart:", error);
      toast({
        title: "Export failed",
        description: "Could not export the chart. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Pack Formation Over Time</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={handleExportImage}
          >
            <Download size={16} />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={{
              packCount: {
                label: "Pack Count",
                color: "hsl(var(--primary))"
              }
            }}
          >
            <LineChart
              data={packHistory}
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
                label={{ value: "Number of Packs", angle: -90, position: "insideLeft" }}
              />
              <Tooltip formatter={(value) => [`${value}`, "Number of Packs"]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="packCount"
                name="Pack Count"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to identify packs, to be used across components
export const identifyPacks = (cars: Car[]): number => {
  if (!cars.length) return 0;
  
  // Sort cars by position
  const sortedCars = [...cars].sort((a, b) => a.position - b.position);
  
  let packCount = 1; // Start with at least one pack
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
      // Assuming laneLength is known, but since it's not available here
      // we'll use a large value as a heuristic
      const estimatedLaneLength = 5000;
      gap += estimatedLaneLength;
    }
    
    // Check both speed difference AND gap criteria
    const speedDifference = Math.abs(car.speed - currentPackSpeed);
    const isNewPackBySpeed = speedDifference > 10;
    const isNewPackByGap = gap > totalGapThreshold;
    
    if (isNewPackBySpeed || isNewPackByGap) {
      packCount++;
      currentPackSpeed = car.speed;
    }
  }
  
  return packCount;
};

export default PackFormationChart;
