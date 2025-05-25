import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { Car } from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";

// Helper function to inline styles for SVG export
const inlineStyles = (svgElement: SVGElement) => {
  const elements = Array.from(svgElement.querySelectorAll('*'));
  elements.forEach((element) => {
    if (!(element instanceof SVGElement)) return;

    const computedStyle = getComputedStyle(element);
    const stylePropertiesToApply: { [key: string]: string } = {};

    const relevantStyles = [
      'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
      'font-family', 'font-size', 'font-weight', 'font-style',
      'text-anchor', 'dominant-baseline', 'opacity'
    ];

    relevantStyles.forEach(property => {
      let value = computedStyle.getPropertyValue(property);
      const attributeValue = element.getAttribute(property);

      // Prioritize explicit SVG attributes for fill and stroke if they exist and are not 'none'
      if ((property === 'fill' || property === 'stroke') && attributeValue && attributeValue !== 'none') {
        value = attributeValue;
      }

      if (value && value !== 'none' && value !== '0px') {
        // If computed fill is black, but there's a more specific fill attribute (not black or none), prefer the attribute.
        // This primarily helps preserve colors of shapes like bars.
        if (property === 'fill' && (value.toLowerCase() === 'rgb(0, 0, 0)' || value.toLowerCase() === '#000000' || value.toLowerCase() === 'black')) {
          if (attributeValue && attributeValue.toLowerCase() !== 'rgb(0, 0, 0)' && attributeValue.toLowerCase() !== '#000000' && attributeValue.toLowerCase() !== 'black' && attributeValue !== 'none') {
            stylePropertiesToApply[property] = attributeValue;
            return; // Skip adding the computed black fill, attributeValue is already set as value to be used
          } else {
            // If attribute is also black or none, and it's not a text element, don't force black
            // Allow Recharts default fills for bars to remain if not explicitly black via attribute
             if(element.tagName.toLowerCase() !== 'text') return;
          }
        }
        stylePropertiesToApply[property] = value;
      }
    });

    if (element.tagName.toLowerCase() === 'text') {
      if (!stylePropertiesToApply['fill'] || stylePropertiesToApply['fill'] === 'rgb(0, 0, 0)' || stylePropertiesToApply['fill'] === 'none' || stylePropertiesToApply['fill'].startsWith('rgba(0, 0, 0, 0')) {
        const color = computedStyle.getPropertyValue('color');
        if (color && color !== 'rgb(0, 0, 0)' && color !== 'none') {
          stylePropertiesToApply['fill'] = color;
        } else {
          stylePropertiesToApply['fill'] = 'black';
        }
      }
      if (!stylePropertiesToApply['font-family'] || stylePropertiesToApply['font-family'] === 'serif') {
        stylePropertiesToApply['font-family'] = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      }
      if (!stylePropertiesToApply['font-size'] || stylePropertiesToApply['font-size'] === '16px') {
        stylePropertiesToApply['font-size'] = '12px';
      }
    }

    let styleString = '';
    for (const property in stylePropertiesToApply) {
      styleString += `${property}:${stylePropertiesToApply[property]};`;
    }

    if (styleString) {
      const existingStyle = element.getAttribute('style') || '';
      // Prevent adding duplicate style properties that might already be there from existingStyle
      const newStylesArray = styleString.split(';').filter(s => s);
      let finalStyle = existingStyle;
      newStylesArray.forEach(newStyle => {
        const propName = newStyle.split(':')[0];
        if (!existingStyle.includes(propName + ':')) {
          finalStyle += (finalStyle.endsWith(';') || !finalStyle ? '' : ';') + newStyle;
        }
      });
      element.setAttribute('style', finalStyle);
    }
  });
};

export interface PackDensityItem {
  packId: number;
  carCount: number;
  avgSpeed: number;
  density: number;
}

interface PackDensityChartProps {
  packDensityData: PackDensityItem[];
}

const PackDensityChart: React.FC<PackDensityChartProps> = ({ packDensityData }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleExportImage = () => {
    if (!chartRef.current) return;
    
    try {
      const svgElement = chartRef.current.querySelector("svg");
      if (!svgElement) {
        throw new Error("SVG element not found");
      }
      
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;

      // Add a white background rectangle as the first child
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", clonedSvg.getAttribute("width") || "100%"); // Use actual width/height if available
      rect.setAttribute("height", clonedSvg.getAttribute("height") || "100%");
      rect.setAttribute("fill", "white");
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);
      
      // Apply inline styles to all elements within the cloned SVG
      inlineStyles(clonedSvg);
      
      // Serialize SVG to a string
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      
      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(svgBlob);
      downloadLink.download = "pack-density-chart.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Show success message
      toast({
        title: "Chart exported",
        description: "Pack density chart has been exported successfully",
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
          <CardTitle className="text-lg">Pack Density Analysis</CardTitle>
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
        <div className="h-[300px]" ref={chartRef}>
          <ChartContainer
            className="h-full"
            config={{
              carCount: {
                label: "Car Count",
                color: "#3B82F6"
              },
              density: {
                label: "Density",
                color: "#F97316"
              },
              avgSpeed: {
                label: "Avg Speed",
                color: "#14B8A6"
              }
            }}
          >
            <BarChart
              data={packDensityData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="packId" 
                name="Pack"
                label={{ value: "Pack Number", position: "insideBottomRight", offset: -10 }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                label={{ value: "Count", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Speed (mph)", angle: 90, position: "insideRight" }}
              />
              <Tooltip formatter={(value, name) => {
                if (name === "density") return [`${typeof value === 'number' ? value.toFixed(2) : value} cars/mi`, "Density"];
                if (name === "avgSpeed") return [`${typeof value === 'number' ? value.toFixed(1) : value} mph`, "Avg Speed"];
                return [`${value}`, name === "carCount" ? "Car Count" : name];
              }} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="carCount" 
                name="Car Count" 
                fill="#3B82F6"
              />
              <Bar 
                yAxisId="left"
                dataKey="density" 
                name="Density" 
                fill="#F97316"
              />
              <Bar 
                yAxisId="right"
                dataKey="avgSpeed" 
                name="Avg Speed" 
                fill="#14B8A6"
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate pack density metrics
export const calculatePackDensityMetrics = (cars: Car[], laneLength: number): PackDensityItem[] => {
  if (cars.length === 0) return [];
  
  // Sort cars by position
  const sortedCars = [...cars].sort((a, b) => a.position - b.position);
  
  let packId = 1;
  let packStartIdx = 0;
  let packs: {
    packId: number;
    cars: Car[];
    startPos: number;
    endPos: number;
  }[] = [];
  
  // Consistent and reasonable threshold for pack detection
  const totalGapThreshold = 0.01; // in miles (~53 ft)
  
  // First identify packs
  for (let i = 1; i < sortedCars.length; i++) {
    const car = sortedCars[i];
    const prevCar = sortedCars[i - 1];
    
    // Calculate gap between current car and previous car
    let gap = car.position - prevCar.position;
    
    // Adjust for track wraparound
    if (gap < 0) {
      gap += laneLength;
    }
    
    // Check for new pack based on gap
    if (gap > totalGapThreshold) {
      // End current pack
      let startPos = sortedCars[packStartIdx].position;
      let endPos = prevCar.position;
      
      packs.push({
        packId,
        cars: sortedCars.slice(packStartIdx, i),
        startPos,
        endPos: endPos < startPos ? endPos + laneLength : endPos // Handle wraparound
      });
      
      // Start new pack
      packId++;
      packStartIdx = i;
    }
  }
  
  // Don't forget the last pack
  packs.push({
    packId,
    cars: sortedCars.slice(packStartIdx),
    startPos: sortedCars[packStartIdx].position,
    endPos: sortedCars[sortedCars.length - 1].position
  });
  
  // Calculate metrics for each pack
  return packs.map(pack => {
    const carCount = pack.cars.length;
    const packLength = (pack.endPos - pack.startPos + laneLength) % laneLength;
    const density = packLength > 0 ? (carCount / packLength) : 0; // Cars per mile
    const avgSpeed = pack.cars.reduce((sum, car) => sum + car.speed, 0) / carCount;
    
    return {
      packId: pack.packId,
      carCount,
      avgSpeed,
      density
    };
  });
};

export default PackDensityChart;
