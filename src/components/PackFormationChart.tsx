
import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, BarChart2 } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";

export interface PackHistoryItem {
  time: number;
  packCount: number;
  runId?: string; // Add runId to distinguish between different simulation runs
}

interface PackFormationChartProps {
  packHistory: PackHistoryItem[];
  previousRunsData?: PackHistoryItem[][];
  onSaveCurrentRun?: () => void;
  onTogglePreviousRuns?: () => void;
  showPreviousRuns?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-blue))', 
  'hsl(var(--chart-green))', 
  'hsl(var(--chart-purple))',
  'hsl(var(--chart-red))'
];

const PackFormationChart: React.FC<PackFormationChartProps> = ({ 
  packHistory,
  previousRunsData = [],
  onSaveCurrentRun,
  onTogglePreviousRuns,
  showPreviousRuns = false
}) => {
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
      clonedSvg.setAttribute("style", "background-color: white;");
      
      // Ensure all elements are visible in export
      const allPaths = clonedSvg.querySelectorAll("path");
      allPaths.forEach(path => {
        // Increase stroke-width for better visibility
        const currentWidth = path.getAttribute("stroke-width") || "1";
        if (parseFloat(currentWidth) <= 1) {
          path.setAttribute("stroke-width", "2");
        }
      });
      
      // Enhance dots visibility
      const allCircles = clonedSvg.querySelectorAll("circle");
      allCircles.forEach(circle => {
        circle.setAttribute("r", "4"); // Increase radius
        circle.setAttribute("stroke-width", "2");
      });
      
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
          <div className="flex items-center gap-2">
            {onSaveCurrentRun && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={onSaveCurrentRun}
              >
                <BarChart2 size={16} />
                Save Run
              </Button>
            )}
            {onTogglePreviousRuns && previousRunsData.length > 0 && (
              <Button 
                variant={showPreviousRuns ? "default" : "outline"} 
                size="sm" 
                className="flex items-center gap-1"
                onClick={onTogglePreviousRuns}
              >
                {showPreviousRuns ? "Hide" : "Show"} Previous
              </Button>
            )}
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
                name="Current Run"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
              
              {/* Display previous runs if toggled on */}
              {showPreviousRuns && previousRunsData.map((runData, index) => (
                <Line
                  key={`prev-run-${index}`}
                  type="monotone"
                  data={runData}
                  dataKey="packCount"
                  name={`Run ${index + 1}`}
                  stroke={COLORS[(index + 1) % COLORS.length]}
                  strokeWidth={1.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
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
