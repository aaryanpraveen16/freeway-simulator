
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
    
    // Initialize all lanes with 0
    for (let i = 0; i < numLanes; i++) {
      laneDistribution[`lane${i}`] = 0;
    }
    
    // Count cars in each lane
    cars.forEach(car => {
      const laneKey = `lane${car.lane}`;
      laneDistribution[laneKey] = (laneDistribution[laneKey] || 0) + 1;
    });
    
    return {
      time: parseFloat(elapsedTime.toFixed(1)),
      ...laneDistribution
    };
  }, [cars, elapsedTime, numLanes]);

  const chartData = useMemo(() => {
    if (dataHistory.length === 0 && currentPoint) {
      return [currentPoint];
    }
    return dataHistory;
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
      
      const allPaths = clonedSvg.querySelectorAll("path");
      allPaths.forEach(path => {
        const currentWidth = path.getAttribute("stroke-width") || "1";
        if (parseFloat(currentWidth) <= 1) {
          path.setAttribute("stroke-width", "2");
        }
      });
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(svgBlob);
      downloadLink.download = "lane-utilization-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Chart exported",
        description: "Lane utilization chart has been exported successfully",
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
          Distribution of cars across different lanes over time
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
                label={{ value: "Number of Cars", angle: -90, position: "insideLeft" }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${value} cars`, 
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
          <p>• Shows the number of cars in each lane over time</p>
          <p>• Helps identify lane preferences and utilization patterns</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LaneUtilizationChart;
