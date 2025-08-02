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

interface DensityThroughputDataPoint {
  density: number;
  throughput: number;
  time: number;
}

interface DensityThroughputChartProps {
  cars: Car[];
  laneLength: number;
  elapsedTime: number;
  dataHistory: DensityThroughputDataPoint[];
  numLanes: number;
  unitSystem: UnitSystem;
}

const DensityThroughputChart: React.FC<DensityThroughputChartProps> = ({
  cars,
  laneLength,
  elapsedTime,
  dataHistory,
  numLanes,
  unitSystem
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const conversions = getUnitConversions(unitSystem);

  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const avgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    // Calculate overall density (cars per mile)
    const density = cars.length / laneLength; // cars per mile (internal)
    
    // Calculate freeway throughput (cars per hour per lane)
    const throughputPerLane = avgSpeed * density;
    const totalThroughput = throughputPerLane * (cars.length > 0 ? Math.max(...cars.map(c => c.lane)) + 1 : 1);
    
    return {
      density: parseFloat(conversions.density.toDisplay(density).toFixed(2)),
      throughput: Math.round(totalThroughput), // Throughput stays in cars/hr
      time: parseFloat(elapsedTime.toFixed(1))
    };
  }, [cars, laneLength, elapsedTime, numLanes, conversions]);

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

  // Calculate stabilized values for density and throughput
  const stabilizedValues = useMemo(() => {
    const densityData = extractDataValues(dataHistory, 'density');
    const throughputData = extractDataValues(dataHistory, 'throughput');
    
    return {
      density: calculateStabilizedValue(densityData),
      throughput: calculateStabilizedValue(throughputData)
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
      
      const allPaths = clonedSvg.querySelectorAll("path");
      allPaths.forEach(path => {
        const currentWidth = path.getAttribute("stroke-width") || "1";
        if (parseFloat(currentWidth) <= 1) {
          path.setAttribute("stroke-width", "2");
        }
      });
      
      const allCircles = clonedSvg.querySelectorAll("circle");
      allCircles.forEach(circle => {
        circle.setAttribute("r", "4");
        circle.setAttribute("stroke-width", "2");
      });
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(svgBlob);
      downloadLink.download = "density-throughput-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Chart exported",
        description: "Density-throughput chart has been exported successfully",
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
          <CardTitle className="text-lg">Density-Throughput Relationship</CardTitle>
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
          Relationship between traffic density and flow throughput
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
              throughput: {
                label: "Throughput",
                color: "#10B981"
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
                  dataKey="throughput"
                  name="Throughput"
                  label={{ value: "Throughput (cars/hr)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "density") return [`${typeof value === 'number' ? value.toFixed(2) : value} ${conversions.density.unit}`, "Density"];
                    if (name === "throughput") return [`${typeof value === 'number' ? value.toFixed(0) : value} cars/hr`, "Throughput"];
                    return [value, name];
                  }}
                />
                <Scatter 
                  dataKey="density" 
                  fill="#3B82F6" 
                  name="Historical data points"
                />
                <Scatter 
                  dataKey="throughput" 
                  fill="#10B981" 
                  name="Current simulation state"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        
        {/* Stabilized Values Display */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Stabilized Operating Point:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Density:</span>
              <span className={`font-mono ${stabilizedValues.density?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.density?.value?.toFixed(2) || 'N/A'} {conversions.density.unit}
                {stabilizedValues.density?.isStabilized && ' ✓'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Throughput:</span>
              <span className={`font-mono ${stabilizedValues.throughput?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.throughput?.value?.toFixed(0) || 'N/A'} cars/hr
                {stabilizedValues.throughput?.isStabilized && ' ✓'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✓ indicates stabilized values. Optimal flow occurs at moderate densities.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DensityThroughputChart;
