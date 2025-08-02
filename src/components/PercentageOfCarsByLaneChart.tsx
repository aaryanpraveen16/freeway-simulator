import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { UnitSystem } from "@/utils/unitConversion";
import { useToast } from "@/hooks/use-toast";
import { calculateStabilizedValue, extractDataValues } from "@/utils/stabilizedValueCalculator";

interface PercentageOfCarsByLaneDataPoint {
  time: number;
  [key: string]: number; // For lane percentages like lane0, lane1, etc.
}

interface PercentageOfCarsByLaneChartProps {
  cars: Car[];
  elapsedTime: number;
  dataHistory: PercentageOfCarsByLaneDataPoint[];
  numLanes: number;
  trafficRule: 'american' | 'european';
  unitSystem: UnitSystem;
}

const PercentageOfCarsByLaneChart: React.FC<PercentageOfCarsByLaneChartProps> = ({
  cars,
  elapsedTime,
  dataHistory,
  numLanes,
  trafficRule,
  unitSystem
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const point: PercentageOfCarsByLaneDataPoint = {
      time: parseFloat(elapsedTime.toFixed(1))
    };
    
    const totalCars = cars.length;
    
    // Calculate percentage of cars in each lane
    for (let i = 0; i < numLanes; i++) {
      const carsInLane = cars.filter(car => car.lane === i).length;
      const percentage = totalCars > 0 ? (carsInLane / totalCars) * 100 : 0;
      point[`lane${i}`] = parseFloat(percentage.toFixed(1));
    }
    
    return point;
  }, [cars, elapsedTime, numLanes]);

  const chartData = useMemo(() => {
    const data = [...dataHistory];
    if (currentPoint) {
      data.push(currentPoint);
    }
    return data.slice(-50); // Keep last 50 points
  }, [dataHistory, currentPoint]);

  // Calculate stabilized values for each lane
  const stabilizedValues = useMemo(() => {
    const results: { [key: string]: any } = {};
    
    for (let i = 0; i < numLanes; i++) {
      const laneData = extractDataValues(chartData, `lane${i}`);
      results[`lane${i}`] = calculateStabilizedValue(laneData);
    }
    
    return results;
  }, [chartData, numLanes]);

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
      downloadLink.download = "percentage-by-lane-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Chart exported",
        description: "Percentage by lane chart has been exported successfully",
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

  const laneColors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Percentage of Cars by Lane</CardTitle>
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
          Distribution of cars across lanes over time ({trafficRule} rules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={Object.fromEntries(
              Array.from({ length: numLanes }, (_, i) => [
                `lane${i}`,
                {
                  label: `Lane ${i + 1}`,
                  color: laneColors[i] || "#666"
                }
              ])
            )}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }}
                domain={[0, 100]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              
              {Array.from({ length: numLanes }, (_, i) => (
                <Line
                  key={i}
                  dataKey={`lane${i}`}
                  stroke={laneColors[i] || "#666"}
                  strokeWidth={2}
                  dot={false}
                  name={`Lane ${i + 1}`}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
        
        {/* Stabilized Values Display */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Stabilized Distribution:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Array.from({ length: numLanes }, (_, i) => (
              <div key={i} className="flex justify-between">
                <span>Lane {i + 1}:</span>
                <span className={`font-mono ${stabilizedValues[`lane${i}`]?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                  {stabilizedValues[`lane${i}`]?.value?.toFixed(1) || 'N/A'}%
                  {stabilizedValues[`lane${i}`]?.isStabilized && ' ✓'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✓ indicates stabilized values. Total should sum to ~100%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PercentageOfCarsByLaneChart;
