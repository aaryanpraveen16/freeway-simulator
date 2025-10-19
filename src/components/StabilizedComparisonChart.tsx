import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SavedSimulation } from '@/services/indexedDBService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUnitConversions } from "@/utils/unitConversion";

interface StabilizedComparisonChartProps {
  selectedSimulations: SavedSimulation[];
  unitSystem: 'metric' | 'imperial';
}

const StabilizedComparisonChart: React.FC<StabilizedComparisonChartProps> = ({
  selectedSimulations,
  unitSystem,
}) => {
  const unitConversions = getUnitConversions(unitSystem);

  // Prepare data for the chart
  const getStabilizedData = () => {
    console.log('Processing simulations:', selectedSimulations);
    
    return selectedSimulations.map(sim => {
      // Debug the simulation object structure
      console.log(`Simulation ${sim.id} (${sim.name})`, {
        hasFinalStats: !!sim.finalStats,
        finalStatsKeys: sim.finalStats ? Object.keys(sim.finalStats) : [],
        stabilizedDensity: sim.finalStats?.stabilizedDensity,
        stabilizedAverageSpeed: sim.finalStats?.stabilizedAverageSpeed,
        allFinalStats: sim.finalStats
      });
      
      // Try to get the values with fallbacks
      const density = sim.finalStats?.stabilizedDensity ?? 0;
      const avgSpeed = sim.finalStats?.stabilizedAverageSpeed ?? 0;
      
      console.log(`Extracted values - Density: ${density}, Speed: ${avgSpeed}`);
      
      return {
        id: sim.id,
        name: sim.name,
        simulationNumber: sim.simulationNumber,
        trafficRule: sim.trafficRule,
        density,
        avgSpeed: unitConversions.speed.toDisplay(avgSpeed),
        color: sim.trafficRule === 'american' ? '#ff4d4f' : '#1890ff'
      };
    });
  };

  const chartData = getStabilizedData();

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No simulation data available for comparison</p>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Density: {data.density.toFixed(2)} vehicles/km</p>
          <p className="text-sm">
            {label}: {payload[0].value.toFixed(2)} {label.includes('Speed') ? unitConversions.speed.unit : 'veh/h'}
          </p>
          <p className="text-xs text-muted-foreground">Simulation #{data.simulationNumber}</p>
          <p className="text-xs text-muted-foreground capitalize">{data.trafficRule} rules</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Speed vs Density</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="density" 
              name="Density" 
              label={{ value: 'Density (veh/km)', position: 'insideBottomRight', offset: -5 }} 
            />
            <YAxis 
              name="Average Speed" 
              label={{ value: `Average Speed (${unitConversions.speed.unit})`, angle: -90, position: 'insideLeft' }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {chartData.map((data) => (
              <Line
                key={`speed-${data.id}`}
                type="monotone"
                dataKey="avgSpeed"
                name={`${data.name} (${data.trafficRule})`}
                stroke={data.color}
                dot={{ r: 6 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StabilizedComparisonChart;
