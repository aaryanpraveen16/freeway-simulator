import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SavedSimulation } from "@/services/simulationService";
import SimulationParametersCollapsible from "./SimulationParametersCollapsible";

interface OverlaySpeedDensityChartProps {
  selectedSimulations: SavedSimulation[];
  unitSystem: 'metric' | 'imperial';
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

interface ChartDataPoint {
  density: number;
  speed: number;
  time: number;
  simulationIndex: number;
  simulationName: string;
  color: string;
  trafficRule: string;
}

const OverlaySpeedDensityChart: React.FC<OverlaySpeedDensityChartProps> = ({
  selectedSimulations,
  unitSystem
}) => {
  const unitLabel = unitSystem === 'metric' ? 'km/h' : 'mph';

  const { chartData, colors, simulationNames } = useMemo(() => {
    const colors = generateColors(selectedSimulations.length);
    const simulationNames: string[] = [];
    const allDataPoints: ChartDataPoint[] = [];

    selectedSimulations.forEach((simulation, index) => {
      const simName = simulation.name || `Simulation ${index + 1}`;
      simulationNames.push(simName);

      // Debug: Log available data keys for this simulation
      console.log(`Simulation ${index} (${simName}) has keys:`, {
        hasChartData: !!simulation.chartData,
        chartDataKeys: simulation.chartData ? Object.keys(simulation.chartData) : 'none',
        hasSpeedByLaneHistory: !!(simulation.chartData?.speedByLaneHistory),
        hasFinalStats: !!simulation.finalStats,
        finalStatsKeys: simulation.finalStats ? Object.keys(simulation.finalStats) : 'none'
      });

      // Try to get data from different possible locations
      let points: Array<{ density: number; speed: number; time: number }> = [];

      // Always use stabilized values from finalStats if available
      if (simulation.finalStats?.stabilizedDensity !== undefined &&
        simulation.finalStats?.stabilizedAverageSpeed !== undefined) {
        points = [{
          density: simulation.finalStats.stabilizedDensity,
          speed: simulation.finalStats.stabilizedAverageSpeed,
          time: 0
        }];
      }
      // Fallback to history data if no stabilized values
      else if (simulation.chartData?.speedByLaneHistory) {
        points = simulation.chartData.speedByLaneHistory.map((point: any) => ({
          density: point.density || 0,
          speed: point.speed || point.averageSpeed || 0,
          time: point.time || 0
        }));
      }

      // Add all points with metadata
      points.forEach(point => {
        allDataPoints.push({
          ...point,
          simulationIndex: index,
          simulationName: simName,
          color: simulation.trafficRule === 'american' ? '#ff4d4f' : '#1890ff',
          trafficRule: simulation.trafficRule || 'unknown'
        });
      });
    });

    // Debug: Log the first few data points
    console.log('First 3 data points:', allDataPoints.slice(0, 3));

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
          <CardTitle>Average Speed vs Density Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select simulations to compare their average speed vs density patterns
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
            <span className="font-medium">Average Speed:</span> {data.speed.toFixed(1)} {unitLabel}
          </p>
          <p className="text-sm text-gray-500">
            Traffic Rule: {data.trafficRule}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>Average Speed vs Density Comparison</CardTitle>
        <div className="text-sm text-muted-foreground">
          Comparing {selectedSimulations.length} simulation{selectedSimulations.length !== 1 ? 's' : ''}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[400px]" config={{}}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 40, bottom: 40, left: 60 }}
              onClick={(data) => console.log('Chart clicked:', data)}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                dataKey="density"
                name="Density"
                unit=" cars/km"
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
                label={{
                  value: `Density (cars/km)`,
                  position: 'bottom',
                  offset: 10,
                  style: { textAnchor: 'middle', fontWeight: 500 }
                }}
              />
              <YAxis
                type="number"
                dataKey="speed"
                name="Average Speed"
                unit={` ${unitLabel}`}
                tick={{ fontSize: 12 }}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                label={{
                  value: `Average Speed (${unitLabel})`,
                  angle: -90,
                  position: 'left',
                  offset: 10,
                  style: { textAnchor: 'middle', fontWeight: 500 }
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                formatter={(value: any, name: any, props: any) => {
                  if (name === 'speed') {
                    return [`${value.toFixed(1)} ${unitLabel}`, 'Speed'];
                  }
                  if (name === 'density') {
                    return [value.toFixed(2), 'Density (cars/km)'];
                  }
                  return [value, name];
                }}
              />

              {/* Create a separate Scatter for each simulation */}
              {selectedSimulations.map((_, index) => {
                const simulationData = chartData.filter(point => point.simulationIndex === index);
                return simulationData.length > 0 ? (
                  <Scatter
                    key={index}
                    name={simulationNames[index]}
                    data={simulationData}
                    fill={simulationData[0]?.trafficRule === 'american' ? '#ff4d4f' : '#1890ff'}
                    fillOpacity={0.7}
                    line={{
                      stroke: simulationData[0]?.trafficRule === 'american' ? '#ff4d4f' : '#1890ff',
                      strokeWidth: 2
                    }}
                    lineType="joint"
                    isAnimationActive={false}
                    shape="circle"
                  />
                ) : null;
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>



        <SimulationParametersCollapsible
          selectedSimulations={selectedSimulations}
          unitSystem={unitSystem}
        />
      </CardContent>
    </Card>
  );
};

export default OverlaySpeedDensityChart;
