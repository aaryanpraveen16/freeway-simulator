import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { SavedSimulation } from "@/services/indexedDBService";

interface OverlayPackFormationChartProps {
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

const OverlayPackFormationChart: React.FC<OverlayPackFormationChartProps> = ({
  selectedSimulations
}) => {
  const { chartData, colors, simulationNames } = useMemo(() => {
    if (selectedSimulations.length === 0) return { chartData: [], colors: [], simulationNames: [] };
    
    const colors = generateColors(selectedSimulations.length);
    const simulationNames: string[] = [];
    
    // Get all unique time points across selected simulations
    const allTimePoints = new Set<number>();
    selectedSimulations.forEach(sim => {
      const simName = sim.name || `Simulation ${selectedSimulations.indexOf(sim) + 1}`;
      simulationNames.push(simName);
      
        if (sim.chartData?.packHistory) {
          sim.chartData.packHistory.forEach(point => allTimePoints.add(point.time));
        }
    });

    const sortedTimePoints = Array.from(allTimePoints).sort((a, b) => a - b);
    
    // Generate pack formation comparison data
    const chartData = sortedTimePoints.map(time => {
      const dataPoint: any = { time };
      
      selectedSimulations.forEach((sim, index) => {
        if (sim.chartData?.packHistory) {
          const packPoint = sim.chartData.packHistory.find(p => p.time === time);
          if (packPoint) {
            dataPoint[`sim${index}_packCount`] = packPoint.packCount;
          }
        }
      });
      
      return dataPoint;
    }).filter(point => Object.keys(point).length > 1);
    
    return {
      chartData,
      colors,
      simulationNames
    };
  }, [selectedSimulations]);

  if (selectedSimulations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pack Formation Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select simulations to compare their pack formation patterns over time
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pack Formation Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No pack formation data available for selected simulations
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create chart config properly
  const chartConfig: Record<string, any> = {};
  selectedSimulations.forEach((sim, index) => {
    const key = `sim${index}_packCount`;
    chartConfig[key] = {
      label: simulationNames[index],
      color: colors[index]
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">Time: {label}s</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{simulationNames[index]}:</span> {entry.value} packs
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pack Formation Comparison</CardTitle>
        <div className="text-sm text-muted-foreground">
          Number of car packs across {selectedSimulations.length} simulation{selectedSimulations.length !== 1 ? 's' : ''}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[400px]" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                label={{
                  value: 'Time (seconds)',
                  position: 'insideBottom',
                  offset: -10,
                  style: { textAnchor: 'middle', fontWeight: 500 }
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: 'Number of Packs',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontWeight: 500 }
                }}
              />
              <ChartTooltip content={<CustomTooltip />} />
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
              
              {selectedSimulations.map((_, index) => (
                <Line
                  key={`sim${index}_packCount`}
                  dataKey={`sim${index}_packCount`}
                  stroke={colors[index]}
                  strokeWidth={3}
                  dot={false}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <p className="font-medium">Understanding the Chart:</p>
          <p>• Each line shows the number of car packs formed over time</p>
          <p>• More packs typically indicate higher congestion and clustering</p>
          <p>• Compare how different traffic scenarios affect pack formation</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverlayPackFormationChart;