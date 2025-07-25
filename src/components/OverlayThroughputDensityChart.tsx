import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SavedSimulation } from "@/services/indexedDBService";

interface OverlayThroughputDensityChartProps {
  selectedSimulations: SavedSimulation[];
}

// Generate distinct colors for different simulations
const generateColors = (count: number): string[] => {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
  ];
  
  // If we need more colors than predefined, generate them
  if (count > colors.length) {
    for (let i = colors.length; i < count; i++) {
      const hue = (i * 137.508) % 360; // Golden angle approximation for good color distribution
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }
  }
  
  return colors.slice(0, count);
};

const OverlayThroughputDensityChart: React.FC<OverlayThroughputDensityChartProps> = ({
  selectedSimulations
}) => {
  const { chartData, colors, simulationNames } = useMemo(() => {
    const colors = generateColors(selectedSimulations.length);
    const simulationNames: string[] = [];
    const allDataPoints: any[] = [];
    
    selectedSimulations.forEach((simulation, index) => {
      const simName = simulation.name || `Simulation ${index + 1}`;
      simulationNames.push(simName);
      
      // Extract density-throughput data points
      const densityThroughputHistory = simulation.chartData?.densityThroughputHistory || [];
      
      densityThroughputHistory.forEach((point: any) => {
        allDataPoints.push({
          density: point.density,
          throughput: point.throughput,
          time: point.time,
          simulationIndex: index,
          simulationName: simName,
          color: colors[index]
        });
      });
    });
    
    return {
      chartData: allDataPoints,
      colors,
      simulationNames
    };
  }, [selectedSimulations]);

  if (selectedSimulations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Throughput vs Density Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select simulations to compare their throughput vs density patterns
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium" style={{ color: data.color }}>
            {data.simulationName}
          </p>
          <p className="text-sm">
            <span className="font-medium">Density:</span> {data.density.toFixed(2)} cars/mile
          </p>
          <p className="text-sm">
            <span className="font-medium">Throughput:</span> {Math.round(data.throughput).toLocaleString()} cars/hour
          </p>
          <p className="text-sm text-gray-500">
            Time: {data.time.toFixed(1)}s
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Throughput vs Density Comparison</CardTitle>
        <div className="text-sm text-muted-foreground">
          Comparing {selectedSimulations.length} simulation{selectedSimulations.length !== 1 ? 's' : ''}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[400px]" config={{}}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                dataKey="density"
                name="Density"
                unit=" cars/mile"
                tick={{ fontSize: 12 }}
                label={{
                  value: 'Density (cars/mile)',
                  position: 'insideBottom',
                  offset: -10,
                  style: { textAnchor: 'middle', fontWeight: 500 }
                }}
              />
              <YAxis
                type="number"
                dataKey="throughput"
                name="Throughput"
                unit=" cars/hour"
                tick={{ fontSize: 12 }}
                label={{
                  value: 'Throughput (cars/hour)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontWeight: 500 }
                }}
                tickFormatter={(value) => Math.round(value).toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={(props) => (
                  <div className="flex flex-wrap gap-4 justify-center mt-4">
                    {simulationNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors[index] }}
                        />
                        <span className="text-sm">{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              
              {/* Create a separate Scatter for each simulation */}
              {selectedSimulations.map((_, index) => (
                <Scatter
                  key={index}
                  data={chartData.filter(point => point.simulationIndex === index)}
                  fill={colors[index]}
                  opacity={0.7}
                  r={4}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <p className="font-medium">Understanding the Chart:</p>
          <p>• Each color represents a different simulation</p>
          <p>• Points show the relationship between traffic density and throughput over time</p>
          <p>• Optimal throughput typically occurs at moderate densities</p>
          <p>• Higher densities often lead to congestion and reduced throughput</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverlayThroughputDensityChart;