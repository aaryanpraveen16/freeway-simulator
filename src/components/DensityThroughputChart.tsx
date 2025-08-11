import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import SimulationParameters from "./SimulationParameters";
import { UnitSystem } from "@/utils/unitConversion";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
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
  trafficRule: 'american' | 'european';
  unitSystem?: UnitSystem;
  simulationParams: any;
}

const DensityThroughputChart: React.FC<DensityThroughputChartProps> = ({
  cars,
  laneLength,
  elapsedTime,
  dataHistory,
  numLanes,
  trafficRule,
  unitSystem = 'imperial',
  simulationParams
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const avgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    const density = cars.length / laneLength;
    const throughputPerLane = avgSpeed * density;
    const totalThroughput = throughputPerLane * (cars.length > 0 ? Math.max(...cars.map(c => c.lane)) + 1 : 1);
    
    return {
      time: parseFloat(elapsedTime.toFixed(2)),
      throughput: parseFloat(totalThroughput.toFixed(2)),
      density: parseFloat(density.toFixed(2))
    };
  }, [cars, laneLength, elapsedTime, numLanes]);

  const chartData = useMemo(() => {
    const historicalData = dataHistory.map(point => ({
      time: parseFloat(point.time.toFixed(2)),
      throughput: parseFloat(point.throughput.toFixed(2)),
      density: parseFloat(point.density.toFixed(2)),
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
          <div>
            <CardTitle className="text-lg">Density-Throughput Fundamental Diagram</CardTitle>
            <p className="text-sm text-muted-foreground">
              Relationship between time and freeway throughput
            </p>
          </div>
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
        <div className="h-[400px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={{
              throughput: {
                label: "Throughput (cars/hr)",
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
                dataKey="time"
                name="Time"
                label={{ 
                  value: "Time (seconds)", 
                  position: "insideBottom", 
                  offset: -40,
                  style: { fontWeight: 500 }
                }}
                domain={['dataMin - 10', 'dataMax + 10']}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <YAxis
                dataKey="throughput"
                name="Throughput"
                label={{ 
                  value: "Throughput (cars/hr)", 
                  angle: -90, 
                  position: "insideLeft",
                  style: { fontWeight: 500 }
                }}
                domain={['dataMin - 100', 'dataMax + 100']}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'throughput') {
                    return [
                      `${Math.round(Number(value)).toLocaleString()} cars/hour`,
                      'Throughput'
                    ];
                  } else if (name === 'density') {
                    return [
                      `${Number(value).toFixed(2)} cars/mile`,
                      'Density'
                    ];
                  } else if (name === 'time') {
                    return [
                      `${Number(value).toFixed(2)} seconds`,
                      'Time'
                    ];
                  }
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  if (!payload || payload.length === 0) return '';
                  const time = payload[0]?.payload?.time;
                  return time !== undefined ? `Time: ${time.toFixed(2)} seconds` : '';
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '8px 12px',
                  fontSize: '14px'
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
                {stabilizedValues.density?.value?.toFixed(3) || 'N/A'} cars/mile
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
            ✓ indicates stabilized operating conditions. This shows the steady-state flow characteristics.
          </p>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Blue dots: Historical data points</p>
          <p>• Red dot: Current simulation state</p>
          <p>• Optimal throughput typically occurs at moderate densities</p>
        </div>
        
        <SimulationParameters 
          params={simulationParams} 
          trafficRule={trafficRule}
          unitSystem={unitSystem}
        />
      </CardContent>
    </Card>
  );
};

export default DensityThroughputChart;
