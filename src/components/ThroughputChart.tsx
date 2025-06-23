import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ThroughputDataPoint {
  trafficDensity: number;
  american1Lane?: number;
  european1Lane?: number;
  american2Lane?: number;
  european2Lane?: number;
  american3Lane?: number;
  european3Lane?: number;
}

interface ThroughputChartProps {
  data: ThroughputDataPoint[];
}

const lineColors = {
  american1Lane: "hsl(var(--chart-1))", // Blue
  european1Lane: "hsl(var(--chart-2))", // Red
  american2Lane: "hsl(var(--chart-1-darker))", // Darker Blue
  european2Lane: "hsl(var(--chart-2-darker))", // Darker Red
  american3Lane: "hsl(var(--chart-1-darkest))", // Darkest Blue
  european3Lane: "hsl(var(--chart-2-darkest))", // Darkest Red
};

// Define line styles (e.g., solid for American, dashed for European)
const lineStrokes = {
  american: "solid",
  european: "dashed",
};

const ThroughputChart: React.FC<ThroughputChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available for Throughput Chart.</p>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3 style={{ textAlign: 'center', fontWeight: 'bold' }}>Throughput vs Traffic Density</h3>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 20, // Increased bottom margin for legend
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="trafficDensity"
            type="number"
            label={{ value: 'Traffic Density (cars/mile/lane)', position: 'insideBottom', offset: -10 }}
            domain={['auto', 'auto']}
            tickCount={6} // Adjust as needed
          />
          <YAxis
            label={{ value: 'Throughput (cars/hour)', angle: -90, position: 'insideLeft' }}
            domain={['auto', 'auto']}
          />
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />

          {/* American Rule Lines */}
          {data[0]?.american1Lane !== undefined && (
            <Line
              type="monotone"
              dataKey="american1Lane"
              name="American 1-Lane"
              stroke={lineColors.american1Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.american === "dashed" ? "5 5" : undefined}
            />
          )}
          {data[0]?.american2Lane !== undefined && (
            <Line
              type="monotone"
              dataKey="american2Lane"
              name="American 2-Lane"
              stroke={lineColors.american2Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.american === "dashed" ? "5 5" : undefined}
            />
          )}
          {data[0]?.american3Lane !== undefined && (
            <Line
              type="monotone"
              dataKey="american3Lane"
              name="American 3-Lane"
              stroke={lineColors.american3Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.american === "dashed" ? "5 5" : undefined}
            />
          )}

          {/* European Rule Lines */}
          {data[0]?.european1Lane !== undefined && (
            <Line
              type="monotone"
              dataKey="european1Lane"
              name="European 1-Lane"
              stroke={lineColors.european1Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.european === "dashed" ? "5 5" : undefined}
            />
          )}
          {data[0]?.european2Lane !== undefined && (
            <Line
              type="monotone"
              dataKey="european2Lane"
              name="European 2-Lane"
              stroke={lineColors.european2Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.european === "dashed" ? "5 5" : undefined}
            />
          )}
          {data[0]?.european3Lane !== undefined && (
            <Line
              type="monotone"
              dataKey="european3Lane"
              name="European 3-Lane"
              stroke={lineColors.european3Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.european === "dashed" ? "5 5" : undefined}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ThroughputChart;
