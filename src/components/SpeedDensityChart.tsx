
import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import { useToast } from "@/hooks/use-toast";
import { calculateStabilizedValue, extractDataValues } from "@/utils/stabilizedValueCalculator";

interface SpeedDensityDataPoint {
  density: number;
  speed: number;
  time: number;
}

interface SpeedDensityChartProps {
  cars: Car[];
  elapsedTime: number;
  dataHistory: SpeedDensityDataPoint[];
  numLanes: number;
  trafficRule: 'american' | 'european';
  laneLength: number;
  unitSystem: UnitSystem;
}

const SpeedDensityChart: React.FC<SpeedDensityChartProps> = ({
  cars,
  elapsedTime,
  dataHistory,
  numLanes,
  trafficRule,
  laneLength,
  unitSystem
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const conversions = getUnitConversions(unitSystem);

  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const avgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    // Calculate overall density (cars per mile)
    const density = cars.length / laneLength; // cars per mile (overall freeway density)
    
    return {
      density: parseFloat(conversions.density.toDisplay(density).toFixed(3)),
      speed: parseFloat(conversions.speed.toDisplay(avgSpeed).toFixed(1)),
      time: parseFloat(elapsedTime.toFixed(1))
    };
  }, [cars, elapsedTime, laneLength, numLanes, conversions]);

  const chartData = useMemo(() => {
    const historicalData = dataHistory.map(point => ({
      ...point,
      type: 'historical'
    }));
    
    if (currentPoint) {
      return [...historicalData, { ...currentPoint, type: 'current' }];
    }
    
    return historicalData;
  }, [dataHistory, currentPoint]);

  // Calculate stabilized values
  const stabilizedValues = useMemo(() => {
    const densityData = extractDataValues(dataHistory, 'density');
    const speedData = extractDataValues(dataHistory, 'speed');
    
    return {
      density: calculateStabilizedValue(densityData),
      speed: calculateStabilizedValue(speedData)
    };
  }, [dataHistory]);

  const handleExportImage = () => {
    if (!chartRef.current) return;
    
    try {
      const svgElement = chartRef.current.querySelector("svg");
      if (!svgElement) {
        throw new Error("SVG element not found");
      }
      
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      clonedSvg.setAttribute("style", "background-color: white;");
      
      const allCircles = clonedSvg.querySelectorAll("circle");
      allCircles.forEach(circle => {
        circle.setAttribute("r", "4");
        circle.setAttribute("stroke-width", "2");
      });
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(svgBlob);
      downloadLink.download = "speed-density-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Chart exported",
        description: "Speed-density chart has been exported successfully",
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
          <CardTitle className="text-lg">Speed-Density Relationship</CardTitle>
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
          Fundamental relationship between traffic density and average speed ({trafficRule} rules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={{
              density: {
                label: "Traffic Density",
                color: "#3B82F6"
              },
              speed: {
                label: "Average Speed",
                color: "#EF4444"
              }
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="density"
                  name="Density"
                  label={{ value: `Traffic Density (${conversions.density.unit})`, position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  dataKey="speed"
                  name="Speed"
                  label={{ value: `Average Speed (${conversions.speed.unit})`, angle: -90, position: "insideLeft" }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "density") return [`${typeof value === 'number' ? value.toFixed(2) : value} ${conversions.density.unit}`, "Density"];
                    if (name === "speed") return [`${typeof value === 'number' ? value.toFixed(1) : value} ${conversions.speed.unit}`, "Speed"];
                    return [value, name];
                  }}
                />
                <Scatter 
                  dataKey="density" 
                  fill="#3B82F6" 
                  name="Historical data points"
                />
                <Scatter 
                  dataKey="speed" 
                  fill="#EF4444" 
                  name="Current simulation state"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        
        {/* Stabilized Operating Point Display */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Stabilized Operating Point:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Density:</span>
              <span className={`font-mono ${stabilizedValues.density?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.density?.value?.toFixed(3) || 'N/A'} {conversions.density.unit}
                {stabilizedValues.density?.isStabilized && ' ✓'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className={`font-mono ${stabilizedValues.speed?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.speed?.value?.toFixed(1) || 'N/A'} {conversions.speed.unit}
                {stabilizedValues.speed?.isStabilized && ' ✓'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✓ indicates stabilized values. Higher density typically leads to lower speeds.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeedDensityChart;
