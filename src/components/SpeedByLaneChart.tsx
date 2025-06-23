import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SpeedDataPoint {
  trafficDensity: number;
  // For each combo, two values: avg speed in lane, avg freeway speed
  // Example for American 1-Lane:
  american1Lane_avgLaneSpeed?: number;
  american1Lane_avgFreewaySpeed?: number;
  european1Lane_avgLaneSpeed?: number;
  european1Lane_avgFreewaySpeed?: number;

  american2Lane_avgLaneSpeed?: number; // This would be average of lane 0 and lane 1 speeds for this rule
  american2Lane_avgFreewaySpeed?: number;
  european2Lane_avgLaneSpeed?: number;
  european2Lane_avgFreewaySpeed?: number;

  american3Lane_avgLaneSpeed?: number; // Average of lane 0, 1, 2 speeds for this rule
  american3Lane_avgFreewaySpeed?: number;
  european3Lane_avgLaneSpeed?: number;
  european3Lane_avgFreewaySpeed?: number;
}

interface SpeedByLaneChartProps {
  data: SpeedDataPoint[];
}

const baseColors = {
  american1Lane: "hsl(var(--chart-1))",
  european1Lane: "hsl(var(--chart-2))",
  american2Lane: "hsl(var(--chart-1-darker))",
  european2Lane: "hsl(var(--chart-2-darker))",
  american3Lane: "hsl(var(--chart-1-darkest))",
  european3Lane: "hsl(var(--chart-2-darkest))",
};

// Distinguish metrics with line style or marker
// For simplicity, using different dash styles for lane vs freeway speed
// Or, one could use solid for lane speed and dashed for freeway speed with same color base.
// Let's try solid for lane speed, dashed for freeway speed.

const SpeedByLaneChart: React.FC<SpeedByLaneChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available for Speed by Lane Chart.</p>;
  }

  const seriesKeys = [
    { rule: "american", lanes: 1, label: "American 1-Lane" },
    { rule: "european", lanes: 1, label: "European 1-Lane" },
    { rule: "american", lanes: 2, label: "American 2-Lane" },
    { rule: "european", lanes: 2, label: "European 2-Lane" },
    { rule: "american", lanes: 3, label: "American 3-Lane" },
    { rule: "european", lanes: 3, label: "European 3-Lane" },
  ];

  return (
    <div style={{ width: '100%', height: 350 }}> {/* Increased height for more lines */}
      <h3 style={{ textAlign: 'center', fontWeight: 'bold' }}>Speed by Lane vs Traffic Density</h3>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 40, // Adjusted for potentially longer legend
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="trafficDensity"
            type="number"
            label={{ value: 'Traffic Density (cars/mile/lane)', position: 'insideBottom', offset: -15 }}
            domain={['auto', 'auto']}
            tickCount={6}
          />
          <YAxis
            label={{ value: 'Speed (mph)', angle: -90, position: 'insideLeft' }}
            domain={['auto', 'auto']} // Or set a sensible range like [0, 100]
          />
          <Tooltip />
          <Legend verticalAlign="bottom" height={50} wrapperStyle={{overflowY: 'auto', maxHeight: 60}}/>

          {seriesKeys.map(series => {
            const baseKey = `${series.rule}${series.lanes}Lane`;
            const laneSpeedKey = `${baseKey}_avgLaneSpeed`;
            const freewaySpeedKey = `${baseKey}_avgFreewaySpeed`;
            // @ts-ignore
            const color = baseColors[baseKey];

            const lines = [];
            // @ts-ignore
            if (data[0]?.[laneSpeedKey] !== undefined) {
              lines.push(
                <Line
                  key={`${baseKey}_lane`}
                  type="monotone"
                  // @ts-ignore
                  dataKey={laneSpeedKey}
                  name={`${series.label} (Lane Avg)`}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  // strokeDasharray="solid" // Default is solid
                />
              );
            }
            // @ts-ignore
            if (data[0]?.[freewaySpeedKey] !== undefined) {
              lines.push(
                <Line
                  key={`${baseKey}_freeway`}
                  type="monotone"
                  // @ts-ignore
                  dataKey={freewaySpeedKey}
                  name={`${series.label} (Freeway Avg)`}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5" // Dashed for freeway speed
                />
              );
            }
            return lines;
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpeedByLaneChart;
