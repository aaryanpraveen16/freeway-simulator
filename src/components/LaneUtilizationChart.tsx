
import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";

interface LaneUtilizationDataPoint {
  time: number;
  [key: string]: number; // Dynamic lane keys like "lane0", "lane1", etc.
}

interface LaneUtilizationChartProps {
  cars: Car[];
  elapsedTime: number;
  dataHistory: LaneUtilizationDataPoint[];
  numLanes: number;
}

const LANE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-blue))', 
  'hsl(var(--chart-green))', 
  'hsl(var(--chart-purple))',
  'hsl(var(--chart-red))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(320, 70%, 50%)'
];

const LaneUtilizationChart: React.FC<LaneUtilizationChartProps> = ({
  cars,
  elapsedTime,
  dataHistory,
  numLanes
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentPoint = useMemo(() => {
    const laneDistribution: { [key: string]: number } = {};
    const totalCars = cars.length;
    
    // Initialize all lanes with 0
    for (let i = 0; i < numLanes; i++) {
      laneDistribution[`lane${i}`] = 0;
    }
    
    // Count cars in each lane and convert to percentage
    cars.forEach(car => {
      const laneKey = `lane${car.lane}`;
      laneDistribution[laneKey] = (laneDistribution[laneKey] || 0) + 1;
    });
    
    // Convert to percentages
    for (let i = 0; i < numLanes; i++) {
      const laneKey = `lane${i}`;
      laneDistribution[laneKey] = totalCars > 0 ? 
        parseFloat(((laneDistribution[laneKey] / totalCars) * 100).toFixed(1)) : 0;
    }
    
    return {
      time: parseFloat(elapsedTime.toFixed(1)),
      ...laneDistribution
    };
  }, [cars, elapsedTime, numLanes]);

  const chartData = useMemo(() => {
    if (dataHistory.length === 0 && currentPoint) {
      return [currentPoint];
    }
    
    // Convert historical data to percentages if not already
    return dataHistory.map(point => {
      const totalCars = Object.keys(point)
        .filter(key => key.startsWith('lane'))
        .reduce((sum, key) => sum + point[key], 0);
      
      if (totalCars === 0) return point;
      
      const convertedPoint: any = { time: point.time };
      for (let i = 0; i < numLanes; i++) {
        const laneKey = `lane${i}`;
        convertedPoint[laneKey] = parseFloat(((point[laneKey] / totalCars) * 100).toFixed(1));
      }
      return convertedPoint;
    });
  }, [dataHistory, currentPoint, numLanes]);

  const handleExportImage = async () => {
    if (!chartRef.current) return;
    
    try {
      // Wait a bit for the chart to fully render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const svgElement = chartRef.current.querySelector("svg");
      if (!svgElement) {
        throw new Error("Chart not found. Please wait for the chart to load.");
      }
      
      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Set proper dimensions and background
      const bbox = svgElement.getBoundingClientRect();
      clonedSvg.setAttribute("width", bbox.width.toString());
      clonedSvg.setAttribute("height", bbox.height.toString());
      clonedSvg.setAttribute("style", "background-color: white;");
      
      // Enhance line visibility
      const allPaths = clonedSvg.querySelectorAll("path");
      allPaths.forEach(path => {
        const currentWidth = path.getAttribute("stroke-width") || "1";
        if (parseFloat(currentWidth) <= 2) {
          path.setAttribute("stroke-width", "3");
        }
      });
      
      // Enhance dots
      const allCircles = clonedSvg.querySelectorAll("circle");
      allCircles.forEach(circle => {
        const currentR = circle.getAttribute("r") || "3";
        if (parseFloat(currentR) <= 3) {
          circle.setAttribute("r", "4");
        }
      });
      
      // Serialize and download
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      
      const url = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `lane-utilization-${new Date().toISOString().slice(0, 10)}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Chart exported",
        description: "Lane utilization chart has been exported successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error exporting chart:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not export the chart. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Lane Utilization Over Time</CardTitle>
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
          Percentage of traffic distribution across lanes over time
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={{
              lane0: {
                label: "Lane 1",
                color: LANE_COLORS[0]
              },
              lane1: {
                label: "Lane 2", 
                color: LANE_COLORS[1]
              },
              lane2: {
                label: "Lane 3",
                color: LANE_COLORS[2]
              },
              lane3: {
                label: "Lane 4",
                color: LANE_COLORS[3]
              }
            }}
          >
            <LineChart
              data={chartData}
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
                label={{ value: "Utilization (%)", angle: -90, position: "insideLeft" }}
                domain={[0, 100]}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}%`, 
                  `Lane ${parseInt(name.toString().replace('lane', '')) + 1}`
                ]}
              />
              <Legend />
              
              {/* Render lines for each lane */}
              {Array.from({ length: numLanes }, (_, index) => (
                <Line
                  key={`lane${index}`}
                  type="monotone"
                  dataKey={`lane${index}`}
                  name={`Lane ${index + 1}`}
                  stroke={LANE_COLORS[index % LANE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Shows the percentage of cars in each lane over time</p>
          <p>• Helps identify lane preferences and balance across lanes</p>
          <p>• Ideal distribution would be roughly equal across all lanes</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LaneUtilizationChart;
