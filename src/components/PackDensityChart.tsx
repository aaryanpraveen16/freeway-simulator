
import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";

export interface PackDensityItem {
  packId: number;
  carCount: number;
  avgSpeed: number;
  density: number;
}

interface PackDensityChartProps {
  packDensityData: PackDensityItem[];
}

const PackDensityChart: React.FC<PackDensityChartProps> = ({ packDensityData }) => {
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
      
      // Serialize SVG to a string
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      
      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(svgBlob);
      downloadLink.download = "pack-density-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Show success message
      toast({
        title: "Chart exported",
        description: "Pack density chart has been exported successfully",
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
          <CardTitle className="text-lg">Pack Density Analysis</CardTitle>
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
              carCount: {
                label: "Car Count",
                color: "hsl(var(--chart-blue))"
              },
              density: {
                label: "Density",
                color: "hsl(var(--chart-green))"
              },
              avgSpeed: {
                label: "Avg Speed",
                color: "hsl(var(--chart-purple))"
              }
            }}
          >
            <BarChart
              data={packDensityData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="packId" 
                name="Pack"
                label={{ value: "Pack Number", position: "insideBottomRight", offset: -10 }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                label={{ value: "Count", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Speed (mph)", angle: 90, position: "insideRight" }}
              />
              <Tooltip formatter={(value, name) => {
                if (name === "density") return [`${value.toFixed(2)} cars/100ft`, "Density"];
                if (name === "avgSpeed") return [`${value.toFixed(1)} mph`, "Avg Speed"];
                return [`${value}`, name === "carCount" ? "Car Count" : name];
              }} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="carCount" 
                name="Car Count" 
                fill="hsl(var(--chart-blue))" 
              />
              <Bar 
                yAxisId="left"
                dataKey="density" 
                name="Density" 
                fill="hsl(var(--chart-green))" 
              />
              <Bar 
                yAxisId="right"
                dataKey="avgSpeed" 
                name="Avg Speed" 
                fill="hsl(var(--chart-purple))" 
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate pack density metrics
export const calculatePackDensityMetrics = (cars: Car[], laneLength: number): PackDensityItem[] => {
  if (cars.length === 0) return [];
  
  // Sort cars by position
  const sortedCars = [...cars].sort((a, b) => a.position - b.position);
  
  let packId = 1;
  let packStartIdx = 0;
  let packs: {
    packId: number;
    cars: Car[];
    startPos: number;
    endPos: number;
  }[] = [];
  
  const safeDistanceThreshold = 100; // Safe distance threshold in feet
  const gapThresholdBuffer = 50; // Buffer for gap threshold in feet
  const totalGapThreshold = safeDistanceThreshold + gapThresholdBuffer;
  
  // First identify packs
  for (let i = 1; i < sortedCars.length; i++) {
    const car = sortedCars[i];
    const prevCar = sortedCars[i - 1];
    
    // Calculate gap between current car and previous car
    let gap = car.position - prevCar.position;
    
    // Adjust for track wraparound
    if (gap < 0) {
      gap += laneLength;
    }
    
    // Check for new pack based on gap
    if (gap > totalGapThreshold) {
      // End current pack
      let startPos = sortedCars[packStartIdx].position;
      let endPos = prevCar.position;
      
      packs.push({
        packId,
        cars: sortedCars.slice(packStartIdx, i),
        startPos,
        endPos: endPos < startPos ? endPos + laneLength : endPos // Handle wraparound
      });
      
      // Start new pack
      packId++;
      packStartIdx = i;
    }
  }
  
  // Don't forget the last pack
  packs.push({
    packId,
    cars: sortedCars.slice(packStartIdx),
    startPos: sortedCars[packStartIdx].position,
    endPos: sortedCars[sortedCars.length - 1].position
  });
  
  // Calculate metrics for each pack
  return packs.map(pack => {
    const carCount = pack.cars.length;
    const packLength = (pack.endPos - pack.startPos + laneLength) % laneLength;
    const density = packLength > 0 ? (carCount * 100) / packLength : 0; // Cars per 100 feet
    const avgSpeed = pack.cars.reduce((sum, car) => sum + car.speed, 0) / carCount;
    
    return {
      packId: pack.packId,
      carCount,
      avgSpeed,
      density
    };
  });
};

export default PackDensityChart;
