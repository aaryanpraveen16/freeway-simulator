import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import { useToast } from "@/hooks/use-toast";
import { calculateStabilizedValue, extractDataValues } from "@/utils/stabilizedValueCalculator";

interface SpeedByLaneDataPoint {
  time: number;
  overallAvgSpeed: number;
  [key: string]: number; // For lane-specific speeds like lane0, lane1, etc.
}

interface SpeedByLaneChartProps {
  cars: Car[];
  elapsedTime: number;
  dataHistory: SpeedByLaneDataPoint[];
  numLanes: number;
  trafficRule: 'american' | 'european';
  unitSystem: UnitSystem;
}

const SpeedByLaneChart: React.FC<SpeedByLaneChartProps> = ({
  cars,
  elapsedTime,
  dataHistory,
  numLanes,
  trafficRule,
  unitSystem
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const conversions = getUnitConversions(unitSystem);

  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const overallAvgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    const point: SpeedByLaneDataPoint = {
      time: parseFloat(elapsedTime.toFixed(1)),
      overallAvgSpeed: parseFloat(conversions.speed.toDisplay(overallAvgSpeed).toFixed(1))
    };
    
    // Calculate average speed per lane
    for (let i = 0; i < numLanes; i++) {
      const carsInLane = cars.filter(car => car.lane === i);
      const avgSpeed = carsInLane.length > 0 
        ? carsInLane.reduce((sum, car) => sum + car.speed, 0) / carsInLane.length 
        : 0;
      point[`lane${i}`] = parseFloat(conversions.speed.toDisplay(avgSpeed).toFixed(1));
    }
    
    return point;
  }, [cars, elapsedTime, numLanes, conversions]);

  const chartData = useMemo(() => {
    const data = [...dataHistory];
    if (currentPoint) {
      data.push(currentPoint);
    }
    return data.slice(-50); // Keep last 50 points
  }, [dataHistory, currentPoint]);

  // Calculate stabilized values for each lane and overall average
  const stabilizedValues = useMemo(() => {
    const results: { [key: string]: any } = {};
    
    // Overall average speed
    const overallData = extractDataValues(chartData, 'overallAvgSpeed');
    results.overall = calculateStabilizedValue(overallData);
    
    // Individual lanes
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
      downloadLink.download = "speed-by-lane-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Chart exported",
        description: "Speed by lane chart has been exported successfully",
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
          <CardTitle className="text-lg">Speed by Lane</CardTitle>
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
          Average speed by lane and overall freeway speed ({trafficRule} rules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={{
              overallAvgSpeed: {
                label: "Overall Average Speed",
                color: "#000"
              },
              ...Object.fromEntries(
                Array.from({ length: numLanes }, (_, i) => [
                  `lane${i}`,
                  {
                    label: `Lane ${i + 1}`,
                    color: laneColors[i] || "#666"
                  }
                ])
              )
            }}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                label={{ value: `Speed (${conversions.speed.unit})`, angle: -90, position: "insideLeft" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              
              <Line
                dataKey="overallAvgSpeed"
                stroke="#000"
                strokeWidth={3}
                dot={false}
                name="Overall Average"
              />
              
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
          <h4 className="text-sm font-semibold mb-2">Stabilized Values:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Overall Average:</span>
              <span className={`font-mono ${stabilizedValues.overall?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.overall?.value?.toFixed(1) || 'N/A'} {conversions.speed.unit}
                {stabilizedValues.overall?.isStabilized && ' ✓'}
              </span>
            </div>
            {Array.from({ length: numLanes }, (_, i) => (
              <div key={i} className="flex justify-between">
                <span>Lane {i + 1}:</span>
                <span className={`font-mono ${stabilizedValues[`lane${i}`]?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                  {stabilizedValues[`lane${i}`]?.value?.toFixed(1) || 'N/A'} {conversions.speed.unit}
                  {stabilizedValues[`lane${i}`]?.isStabilized && ' ✓'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✓ indicates stabilized values (low variance). Confidence based on recent data consistency.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeedByLaneChart;
