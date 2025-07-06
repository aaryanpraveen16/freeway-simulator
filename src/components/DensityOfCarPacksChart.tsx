
import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";

interface DensityOfCarPacksDataPoint {
  time: number;
  overallDensity: number;
  averagePackSize: number;
  totalPacks: number;
}

interface DensityOfCarPacksChartProps {
  cars: Car[];
  elapsedTime: number;
  laneLength: number;
  dataHistory: DensityOfCarPacksDataPoint[];
  numLanes: number;
  trafficRule: 'american' | 'european';
}

// Helper function to identify packs across all lanes
const identifyPacksInFreeway = (cars: Car[], laneLength: number) => {
  if (cars.length === 0) return { packCount: 0, totalPackSize: 0 };
  
  // Group cars by lane first
  const carsByLane: { [key: number]: Car[] } = {};
  cars.forEach(car => {
    if (!carsByLane[car.lane]) carsByLane[car.lane] = [];
    carsByLane[car.lane].push(car);
  });
  
  let totalPacks = 0;
  let totalPackSize = 0;
  
  // Identify packs in each lane
  Object.values(carsByLane).forEach(carsInLane => {
    const sortedCars = [...carsInLane].sort((a, b) => a.position - b.position);
    let packCount = 1;
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
    
    totalPackSize += currentPackSize; // Add the last pack
    totalPacks += packCount;
  });
  
  return { packCount: totalPacks, totalPackSize };
};

const DensityOfCarPacksChart: React.FC<DensityOfCarPacksChartProps> = ({
  cars,
  elapsedTime,
  laneLength,
  dataHistory,
  numLanes,
  trafficRule
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    // Overall freeway density (cars per mile)
    const overallDensity = cars.length / laneLength;
    
    // Calculate pack information for the entire freeway
    const { packCount, totalPackSize } = identifyPacksInFreeway(cars, laneLength);
    
    const point: DensityOfCarPacksDataPoint = {
      time: parseFloat(elapsedTime.toFixed(1)),
      overallDensity: parseFloat(overallDensity.toFixed(2)),
      totalPacks: packCount,
      averagePackSize: packCount > 0 ? parseFloat((totalPackSize / packCount).toFixed(1)) : 0
    };
    
    return point;
  }, [cars, elapsedTime, laneLength, numLanes]);

  const chartData = useMemo(() => {
    const data = [...dataHistory];
    if (currentPoint) {
      data.push(currentPoint);
    }
    return data.slice(-50); // Keep last 50 points
  }, [dataHistory, currentPoint]);

  const handleExportImage = () => {
    if (!chartRef.current) return;
    
    try {
      const svgElement = chartRef.current.querySelector("svg");
      if (!svgElement) {
        throw new Error("SVG element not found");
      }
      
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      clonedSvg.setAttribute("style", "background-color: white;");
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(svgBlob);
      downloadLink.download = "density-of-car-packs-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Chart exported",
        description: "Density of car packs chart has been exported successfully",
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
          <CardTitle className="text-lg">Freeway Traffic Density</CardTitle>
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
        <p className="text-sm text-muted-foreground">
          Overall freeway traffic density and pack formation ({trafficRule} rules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={{
              overallDensity: {
                label: "Traffic Density",
                color: "#000"
              },
              averagePackSize: {
                label: "Average Pack Size",
                color: "#dc2626"
              },
              totalPacks: {
                label: "Total Packs",
                color: "#059669"
              }
            }}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                label={{ value: "Density / Pack Metrics", angle: -90, position: "insideLeft" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              
              <Line
                dataKey="overallDensity"
                stroke="#000"
                strokeWidth={3}
                dot={false}
                name="Traffic Density (cars/mile)"
              />
              
              <Line
                dataKey="averagePackSize"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                name="Avg Pack Size (cars)"
                strokeDasharray="5 5"
              />
              
              <Line
                dataKey="totalPacks"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                name="Total Packs"
                strokeDasharray="3 3"
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DensityOfCarPacksChart;
