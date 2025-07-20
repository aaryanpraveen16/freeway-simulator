
import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
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
}

const SpeedDensityChart: React.FC<SpeedDensityChartProps> = ({
  cars,
  elapsedTime,
  dataHistory,
  numLanes,
  trafficRule,
  laneLength
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const avgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    // Calculate overall density (cars per mile)
    const density = cars.length / laneLength; // cars per mile (overall freeway density)
    
    return {
      density: parseFloat(density.toFixed(3)),
      speed: parseFloat(avgSpeed.toFixed(1)),
      time: parseFloat(elapsedTime.toFixed(1))
    };
  }, [cars, elapsedTime, laneLength, numLanes]);

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
              speed: {
                label: "Speed (mph)",
                color: "hsl(var(--primary))"
              },
              current: {
                label: "Current State",
                color: "hsl(var(--destructive))"
              }
            }}
          >
            <ScatterChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                bottom: 60,
                left: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="density"
                name="Density"
                label={{ 
                  value: "Traffic Density (cars/mile/lane)", 
                  position: "insideBottom", 
                  offset: -40 
                }}
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
              />
              <YAxis
                dataKey="speed"
                name="Speed"
                label={{ 
                  value: "Average Speed (mph)", 
                  angle: -90, 
                  position: "insideLeft" 
                }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}`, 
                  name === 'speed' ? 'Speed (mph)' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `Density: ${payload[0].payload.density} cars/mile/lane`;
                  }
                  return '';
                }}
              />
              <Scatter
                data={chartData.filter(d => d.type === 'historical')}
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                r={4}
              />
              <Scatter
                data={chartData.filter(d => d.type === 'current')}
                fill="hsl(var(--destructive))"
                r={8}
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
              />
            </ScatterChart>
          </ChartContainer>
        </div>
        
        {/* Stabilized Values Display */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Stabilized Operating Point:</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex justify-between">
              <span>Density:</span>
              <span className={`font-mono ${stabilizedValues.density?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.density?.value?.toFixed(3) || 'N/A'} cars/mile/lane
                {stabilizedValues.density?.isStabilized && ' ✓'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className={`font-mono ${stabilizedValues.speed?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.speed?.value?.toFixed(1) || 'N/A'} mph
                {stabilizedValues.speed?.isStabilized && ' ✓'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✓ indicates stabilized values. Higher density typically leads to lower speeds.
          </p>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Blue dots: Historical data points</p>
          <p>• Red dot: Current simulation state</p>
          <p>• Typical pattern: Speed decreases as density increases (congestion)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeedDensityChart;
