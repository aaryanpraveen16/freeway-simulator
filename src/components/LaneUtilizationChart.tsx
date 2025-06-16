
import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Download, Info } from "lucide-react";
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
  'hsl(220, 70%, 50%)', // Blue for Lane 1 (leftmost)
  'hsl(142, 72%, 45%)', // Green for Lane 2
  'hsl(45, 93%, 47%)',  // Yellow for Lane 3
  'hsl(348, 83%, 47%)', // Red for Lane 4
  'hsl(280, 70%, 50%)', // Purple for Lane 5
  'hsl(24, 70%, 50%)',  // Orange for Lane 6 (rightmost)
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

  const averageUtilization = useMemo(() => {
    if (chartData.length === 0) return {};
    
    const averages: { [key: string]: number } = {};
    for (let i = 0; i < numLanes; i++) {
      const laneKey = `lane${i}`;
      const sum = chartData.reduce((acc, point) => acc + (point[laneKey] || 0), 0);
      averages[laneKey] = parseFloat((sum / chartData.length).toFixed(1));
    }
    return averages;
  }, [chartData, numLanes]);

  const idealUtilization = parseFloat((100 / numLanes).toFixed(1));

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
          <CardTitle className="text-lg">Lane Distribution Analysis</CardTitle>
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
          Real-time traffic distribution across lanes with utilization trends
        </p>
      </CardHeader>
      <CardContent>
        {/* Current Statistics */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Info size={14} />
            Current Lane Distribution
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Array.from({ length: numLanes }, (_, index) => {
              const laneKey = `lane${index}`;
              const current = currentPoint[laneKey] || 0;
              const average = averageUtilization[laneKey] || 0;
              const isOverUtilized = current > idealUtilization * 1.2;
              const isUnderUtilized = current < idealUtilization * 0.8;
              
              return (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: LANE_COLORS[index % LANE_COLORS.length] }}
                    />
                    <span className="font-medium">Lane {index + 1}</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${isOverUtilized ? 'text-red-600' : isUnderUtilized ? 'text-amber-600' : 'text-green-600'}`}>
                      {current}%
                    </div>
                    <div className="text-gray-500">avg: {average}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Ideal distribution:</span> {idealUtilization}% per lane
          </div>
        </div>

        <div className="h-[300px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={Object.fromEntries(
              Array.from({ length: numLanes }, (_, index) => [
                `lane${index}`,
                {
                  label: `Lane ${index + 1}${index === 0 ? ' (Left)' : index === numLanes - 1 ? ' (Right)' : ''}`,
                  color: LANE_COLORS[index % LANE_COLORS.length]
                }
              ])
            )}
          >
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                {Array.from({ length: numLanes }, (_, index) => (
                  <linearGradient key={`gradient-${index}`} id={`gradient-lane${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={LANE_COLORS[index % LANE_COLORS.length]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={LANE_COLORS[index % LANE_COLORS.length]} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                name="Time"
                label={{ value: "Time (seconds)", position: "insideBottomRight", offset: -10 }}
              />
              <YAxis
                label={{ value: "Usage (%)", angle: -90, position: "insideLeft" }}
                domain={[0, 100]}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}%`, 
                  `Lane ${parseInt(name.toString().replace('lane', '')) + 1}`
                ]}
                labelFormatter={(label) => `Time: ${label}s`}
              />
              <Legend />
              
              {/* Render areas for each lane */}
              {Array.from({ length: numLanes }, (_, index) => (
                <Area
                  key={`lane${index}`}
                  type="monotone"
                  dataKey={`lane${index}`}
                  name={`Lane ${index + 1}${index === 0 ? ' (Left)' : index === numLanes - 1 ? ' (Right)' : ''}`}
                  stroke={LANE_COLORS[index % LANE_COLORS.length]}
                  fill={`url(#gradient-lane${index})`}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        </div>
        
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Balanced (±20% of ideal)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span>Under-utilized (&lt;80% of ideal)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Over-utilized (&gt;120% of ideal)</span>
            </div>
          </div>
          <p>• Left lanes (blue) are typically for faster traffic and passing</p>
          <p>• Right lanes are for slower traffic and vehicles preparing to exit</p>
          <p>• Cars automatically move to exit lanes when approaching their destination</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LaneUtilizationChart;
