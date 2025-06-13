import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";

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
}

const DensityThroughputChart: React.FC<DensityThroughputChartProps> = ({
  cars,
  laneLength,
  elapsedTime,
  dataHistory
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentPoint = useMemo(() => {
    if (cars.length === 0) return null;
    
    const avgSpeed = cars.reduce((sum, car) => sum + car.speed, 0) / cars.length;
    const density = cars.length / laneLength; // cars per mile
    const throughput = avgSpeed * density; // cars per hour per mile
    
    return {
      density: parseFloat(density.toFixed(2)),
      throughput: parseFloat(throughput.toFixed(0)),
      time: parseFloat(elapsedTime.toFixed(1))
    };
  }, [cars, laneLength, elapsedTime]);

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
          <CardTitle className="text-lg">Density-Throughput Fundamental Diagram</CardTitle>
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
          Classic traffic engineering relationship between density and throughput
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={{
              throughput: {
                label: "Throughput (cars/hr/mi)",
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
                  value: "Traffic Density (cars/mile)", 
                  position: "insideBottom", 
                  offset: -40 
                }}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <YAxis
                dataKey="throughput"
                name="Throughput"
                label={{ 
                  value: "Throughput (cars/hr/mi)", 
                  angle: -90, 
                  position: "insideLeft" 
                }}
                domain={['dataMin - 100', 'dataMax + 100']}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}`, 
                  name === 'throughput' ? 'Throughput (cars/hr/mi)' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `Density: ${payload[0].payload.density} cars/mile`;
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
        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Blue dots: Historical data points</p>
          <p>• Red dot: Current simulation state</p>
          <p>• Optimal throughput typically occurs at moderate densities</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DensityThroughputChart;
