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

interface DensityOfCarPacksDataPoint {
  time: number;
  overallDensity: number;
  averagePackSize: number;
  totalPacks: number;
}

interface DensityOfCarPacksChartProps {
  cars: Car[];
  elapsedTime: number;
  laneLength: number;
  dataHistory: DensityOfCarPacksDataPoint[];
  numLanes: number;
  trafficRule: 'american' | 'european';
  unitSystem: UnitSystem;
}

// Helper function to identify packs across all lanes
const identifyPacksInFreeway = (cars: Car[], laneLength: number) => {
  if (cars.length === 0) return { packCount: 0, totalPackSize: 0 };
  
  // Group cars by lane first
  const carsByLane: { [key: number]: Car[] } = {};
  cars.forEach(car => {
    if (!carsByLane[car.lane]) carsByLane[car.lane] = [];
    carsByLane[car.lane].push(car);
  });
  
  let totalPacks = 0;
  let totalPackSize = 0;
  
  // Identify packs in each lane
  Object.values(carsByLane).forEach(carsInLane => {
    const sortedCars = [...carsInLane].sort((a, b) => a.position - b.position);
    let packCount = 1;
    let currentPackSize = 1;
    
    for (let i = 1; i < sortedCars.length; i++) {
      const distance = Math.abs(sortedCars[i].position - sortedCars[i-1].position);
      const relativeDistance = distance / laneLength;
      
      // If cars are close together (within 0.02 of track length), they're in the same pack
      if (relativeDistance < 0.02) {
        currentPackSize++;
      } else {
        totalPackSize += currentPackSize;
        packCount++;
        currentPackSize = 1;
      }
    }
    
    totalPackSize += currentPackSize; // Add the last pack
    totalPacks += packCount;
  });
  
  return { packCount: totalPacks, totalPackSize };
};

const DensityOfCarPacksChart: React.FC<DensityOfCarPacksChartProps> = ({
  cars,
  elapsedTime,
  laneLength,
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
    
    // Overall freeway density (cars per mile)
    const overallDensity = cars.length / laneLength;
    
    // Calculate pack information for the entire freeway
    const { packCount, totalPackSize } = identifyPacksInFreeway(cars, laneLength);
    
    const point: DensityOfCarPacksDataPoint = {
      time: parseFloat(elapsedTime.toFixed(1)),
      overallDensity: parseFloat(conversions.density.toDisplay(overallDensity).toFixed(2)),
      totalPacks: packCount,
      averagePackSize: packCount > 0 ? parseFloat((totalPackSize / packCount).toFixed(1)) : 0
    };
    
    return point;
  }, [cars, elapsedTime, laneLength, numLanes, conversions]);

  const chartData = useMemo(() => {
    const data = [...dataHistory];
    if (currentPoint) {
      data.push(currentPoint);
    }
    return data.slice(-50); // Keep last 50 points
  }, [dataHistory, currentPoint]);

  // Calculate stabilized values
  const stabilizedValues = useMemo(() => {
    const densityData = extractDataValues(chartData, 'overallDensity');
    const packSizeData = extractDataValues(chartData, 'averagePackSize');
    const totalPacksData = extractDataValues(chartData, 'totalPacks');
    
    return {
      overallDensity: calculateStabilizedValue(densityData),
      averagePackSize: calculateStabilizedValue(packSizeData),
      totalPacks: calculateStabilizedValue(totalPacksData)
    };
  }, [chartData]);

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
      downloadLink.download = "density-of-car-packs-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Chart exported",
        description: "Density of car packs chart has been exported successfully",
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
          <CardTitle className="text-lg">Freeway Traffic Density</CardTitle>
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
          Overall freeway traffic density and pack formation ({trafficRule} rules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={{
              overallDensity: {
                label: "Traffic Density",
                color: "#000"
              },
              averagePackSize: {
                label: "Average Pack Size",
                color: "#dc2626"
              },
              totalPacks: {
                label: "Total Packs",
                color: "#059669"
              }
            }}
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                label={{ value: "Time (seconds)", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                label={{ value: `Density (${conversions.density.unit})`, angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Pack Size / Count", angle: 90, position: "insideRight" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              
              <Line
                yAxisId="left"
                dataKey="overallDensity"
                stroke="#000"
                strokeWidth={3}
                dot={false}
                name="Overall Density"
              />
              
              <Line
                yAxisId="right"
                dataKey="averagePackSize"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Avg Pack Size"
              />
              
              <Line
                yAxisId="right"
                dataKey="totalPacks"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Total Packs"
              />
            </LineChart>
          </ChartContainer>
        </div>
        
        {/* Stabilized Values Display */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Stabilized Values:</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Density:</span>
              <span className={`font-mono ${stabilizedValues.overallDensity?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.overallDensity?.value?.toFixed(2) || 'N/A'} {conversions.density.unit}
                {stabilizedValues.overallDensity?.isStabilized && ' ✓'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg Pack Size:</span>
              <span className={`font-mono ${stabilizedValues.averagePackSize?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.averagePackSize?.value?.toFixed(1) || 'N/A'} cars
                {stabilizedValues.averagePackSize?.isStabilized && ' ✓'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Packs:</span>
              <span className={`font-mono ${stabilizedValues.totalPacks?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                {stabilizedValues.totalPacks?.value?.toFixed(0) || 'N/A'} packs
                {stabilizedValues.totalPacks?.isStabilized && ' ✓'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ✓ indicates stabilized values. Green shows steady-state conditions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DensityOfCarPacksChart;
