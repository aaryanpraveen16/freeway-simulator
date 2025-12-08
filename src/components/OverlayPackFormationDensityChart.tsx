import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SavedSimulation } from '@/services/simulationService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SimulationParametersCollapsible from "./SimulationParametersCollapsible";

interface OverlayPackFormationDensityChartProps {
  selectedSimulations: SavedSimulation[];
}

const OverlayPackFormationDensityChart: React.FC<OverlayPackFormationDensityChartProps> = ({
  selectedSimulations,
}) => {
  // Prepare data for the chart
  const chartData = useMemo(() => {
    const data: any[] = [];

    selectedSimulations.forEach((sim) => {
      if (!sim.chartData?.packHistory || sim.chartData.packHistory.length === 0) {
        return;
      }

      const trafficRule = sim.trafficRule || 'american';
      const color = trafficRule === 'american' ? '#ff4d4f' : '#1890ff';
      const freewayLength = sim.params.freewayLength || 10; // km
      const totalCars = sim.finalStats.totalCars || 0;

      // Calculate overall density for this simulation
      const density = totalCars / freewayLength; // cars/km

      // Get pack formation data - use the last few data points or average
      const packHistory = sim.chartData.packHistory;

      // Use the last 10 data points to get a stable pack count
      const recentPackData = packHistory.slice(-10);
      const avgPackCount = recentPackData.reduce((sum: number, item: any) => sum + (item.packCount || 0), 0) / recentPackData.length;

      if (density > 0 && avgPackCount >= 0) {
        data.push({
          simulationId: sim.id,
          simulationName: sim.name,
          simulationNumber: sim.simulationNumber,
          trafficRule: trafficRule,
          density: parseFloat(density.toFixed(3)),
          packCount: parseFloat(avgPackCount.toFixed(2)),
          color: color
        });
      }
    });

    return data;
  }, [selectedSimulations]);

  // Group data by traffic rule for separate scatter series
  const dataByTrafficRule = useMemo(() => {
    const grouped: { [key: string]: any[] } = {
      american: [],
      european: []
    };

    chartData.forEach(point => {
      if (grouped[point.trafficRule]) {
        grouped[point.trafficRule].push(point);
      }
    });

    return grouped;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No pack formation data available for selected simulations</p>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.simulationName} (#{data.simulationNumber})</p>
          <p className="text-sm capitalize">{data.trafficRule} rules</p>
          <p className="text-sm mt-1">Density: {data.density.toFixed(3)} cars/km</p>
          <p className="text-sm">Pack Count: {data.packCount.toFixed(1)} packs</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pack Formation vs Density</CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare how traffic density affects pack formation across simulations
        </p>
      </CardHeader>
      <CardContent className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="density"
              name="Density"
              label={{
                value: 'Density (cars/km)',
                position: 'insideBottom',
                offset: -40,
                style: { fontWeight: 500 }
              }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            <YAxis
              type="number"
              dataKey="packCount"
              name="Pack Count"
              label={{
                value: 'Number of Packs',
                angle: -90,
                position: 'insideLeft',
                style: { fontWeight: 500 }
              }}
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
            />

            {/* American rules scatter */}
            {dataByTrafficRule.american.length > 0 && (
              <Scatter
                name="American Rules"
                data={dataByTrafficRule.american}
                fill="#ff4d4f"
                fillOpacity={0.6}
                stroke="#ff4d4f"
                strokeWidth={2}
                r={8}
              />
            )}

            {/* European rules scatter */}
            {dataByTrafficRule.european.length > 0 && (
              <Scatter
                name="European Rules"
                data={dataByTrafficRule.european}
                fill="#1890ff"
                fillOpacity={0.6}
                stroke="#1890ff"
                strokeWidth={2}
                r={8}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>

        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>• Each point represents a simulation's average pack formation</p>
          <p>• <span className="text-red-500 font-semibold">Red</span>: American traffic rules (keep right, pass left)</p>
          <p>• <span className="text-blue-500 font-semibold">Blue</span>: European traffic rules (keep left, pass right)</p>
          <p>• Higher density typically leads to more pack formation as vehicles cluster together</p>
          <p>• Pack count is averaged from the last 10 data points for stability</p>
        </div>

        <SimulationParametersCollapsible
          selectedSimulations={selectedSimulations}
        />
      </CardContent>
    </Card>
  );
};

export default OverlayPackFormationDensityChart;
