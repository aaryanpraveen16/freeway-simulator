import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { UnitSystem } from "@/utils/unitConversion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LaneThroughputDataPoint {
  time: number;
  lane0?: number;
  lane1?: number;
  lane2?: number;
  lane3?: number;
  [key: string]: number | undefined;
}

interface LaneThroughputChartProps {
  dataHistory: LaneThroughputDataPoint[];
  numLanes: number;
  unitSystem?: UnitSystem;
}

const LaneThroughputChart: React.FC<LaneThroughputChartProps> = ({
  dataHistory,
  numLanes,
  unitSystem = 'metric',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Define colors for each lane
  const laneColors = [
    "hsl(217, 91%, 60%)",    // Blue for Lane 1
    "hsl(142, 71%, 45%)",    // Green for Lane 2
    "hsl(262, 83%, 58%)",    // Purple for Lane 3
    "hsl(38, 92%, 50%)",     // Amber for Lane 4
  ];

  const chartData = useMemo(() => {
    return dataHistory.map(point => ({
      time: parseFloat(point.time.toFixed(2)),
      ...Object.fromEntries(
        Array.from({ length: numLanes }, (_, i) => [
          `lane${i}`,
          point[`lane${i}`] !== undefined ? parseFloat(point[`lane${i}`]!.toFixed(2)) : 0
        ])
      )
    }));
  }, [dataHistory, numLanes]);

  // Calculate average throughput for each lane
  const averageThroughput = useMemo(() => {
    if (dataHistory.length === 0) return Array(numLanes).fill(0);
    
    const sums = Array(numLanes).fill(0);
    dataHistory.forEach(point => {
      for (let i = 0; i < numLanes; i++) {
        sums[i] += point[`lane${i}`] || 0;
      }
    });
    
    return sums.map(sum => parseFloat((sum / dataHistory.length).toFixed(2)));
  }, [dataHistory, numLanes]);

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
      downloadLink.download = "lane-throughput-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Chart exported",
        description: "Lane throughput chart has been exported successfully",
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
            <CardTitle className="text-lg">Lane Throughput Over Time</CardTitle>
            <p className="text-sm text-muted-foreground">
              Individual lane throughput comparison
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
            config={Object.fromEntries(
              Array.from({ length: numLanes }, (_, i) => [
                `lane${i}`,
                {
                  label: `Lane ${i + 1}`,
                  color: laneColors[i % laneColors.length]
                }
              ])
            )}
          >
            <LineChart
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
                tickFormatter={(value) => value.toFixed(0)}
              />
              <YAxis
                name="Throughput"
                label={{ 
                  value: "Throughput (cars/hr)", 
                  angle: -90, 
                  position: "insideLeft",
                  style: { fontWeight: 500 }
                }}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip 
                formatter={(value, name) => {
                  const laneMatch = String(name).match(/lane(\d+)/);
                  if (laneMatch) {
                    return [
                      `${Math.round(Number(value))} cars/hr`,
                      `Lane ${parseInt(laneMatch[1]) + 1}`
                    ];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => `Time: ${Number(label).toFixed(2)} seconds`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '8px 12px',
                  fontSize: '14px'
                }}
              />
              <Legend 
                verticalAlign="top"
                height={36}
                formatter={(value) => {
                  const laneMatch = String(value).match(/lane(\d+)/);
                  if (laneMatch) {
                    return `Lane ${parseInt(laneMatch[1]) + 1}`;
                  }
                  return value;
                }}
              />
              {Array.from({ length: numLanes }, (_, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={`lane${i}`}
                  stroke={laneColors[i % laneColors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
        
        {/* Average Throughput Display */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Average Throughput by Lane:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {Array.from({ length: numLanes }, (_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: laneColors[i % laneColors.length] }}
                  />
                  <span>Lane {i + 1}:</span>
                </div>
                <span className="font-mono text-green-600">
                  {averageThroughput[i] > 0 ? 
                    `${Math.round(averageThroughput[i])} cars/h` : 
                    'N/A'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Shows average throughput for each lane across the entire simulation.
          </p>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Higher throughput indicates more efficient traffic flow</p>
          <p>• Compare lanes to identify bottlenecks or imbalances</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LaneThroughputChart;
