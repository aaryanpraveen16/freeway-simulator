import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SavedSimulation } from '@/services/simulationService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUnitConversions } from "@/utils/unitConversion";
import SimulationParametersCollapsible from "./SimulationParametersCollapsible";

interface OverlayLaneThroughputDensityChartProps {
  selectedSimulations: SavedSimulation[];
  unitSystem?: 'metric' | 'imperial';
}

const OverlayLaneThroughputDensityChart: React.FC<OverlayLaneThroughputDensityChartProps> = ({
  selectedSimulations,
  unitSystem = 'metric',
}) => {
  const unitConversions = getUnitConversions(unitSystem);

  // Prepare data for the chart
  const chartData = useMemo(() => {
    const data: any[] = [];

    selectedSimulations.forEach((sim) => {
      if (!sim.finalStats.perLaneThroughputs) {
        return;
      }

      const numLanes = sim.params.numLanes || sim.finalStats.perLaneThroughputs.length;
      const freewayLength = sim.params.freewayLength || 1; // Standardized default 1km
      const totalCars = sim.finalStats.totalCars || 0;
      const trafficRule = sim.trafficRule || 'american';
      const color = trafficRule === 'american' ? '#ff4d4f' : '#1890ff';

      // Create a data point for each lane
      for (let laneIdx = 0; laneIdx < numLanes; laneIdx++) {
        const throughput = sim.finalStats.perLaneThroughputs[laneIdx] || 0;

        // Calculate density: assume equal distribution of cars across lanes
        // Density = cars per lane / freeway length
        const carsPerLane = totalCars / numLanes;
        const densityMetric = carsPerLane / freewayLength; // cars/km
        const density = unitConversions.density.toDisplay(densityMetric);

        if (throughput > 0 && density > 0) {
          data.push({
            simulationId: sim.id,
            simulationName: sim.name,
            simulationNumber: sim.simulationNumber,
            trafficRule: trafficRule,
            laneIndex: laneIdx,
            laneName: laneIdx === 0 ? 'Left' :
              laneIdx === numLanes - 1 ? 'Right' :
                `Lane ${laneIdx + 1}`,
            density: parseFloat(density.toFixed(3)),
            throughput: parseFloat(throughput.toFixed(2)),
            color: color
          });
        }
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
          <p className="text-muted-foreground">No lane throughput data available for selected simulations</p>
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
          <p className="text-sm font-semibold mt-1">{data.laneName}</p>
          <p className="text-sm">Density: {data.density.toFixed(3)} {unitConversions.density.unit}</p>
          <p className="text-sm">Throughput: {Math.round(data.throughput)} cars/hr</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lane-Specific Throughput vs Density</CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare throughput-density relationships for individual lanes across simulations
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
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
                  value: `Density (${unitConversions.density.unit})`,
                  position: 'insideBottom',
                  offset: -40,
                  style: { fontWeight: 500 }
                }}
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
              />
              <YAxis
                type="number"
                dataKey="throughput"
                name="Throughput"
                label={{
                  value: 'Throughput (cars/hr)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontWeight: 500 }
                }}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
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
                  r={6}
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
                  r={6}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <SimulationParametersCollapsible
          selectedSimulations={selectedSimulations}
          unitSystem={unitSystem}
        />
      </CardContent>
    </Card>
  );
};

export default OverlayLaneThroughputDensityChart;
