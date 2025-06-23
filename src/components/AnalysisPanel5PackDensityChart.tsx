import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, YAxisProps } from 'recharts';

interface PackDataPoint {
  trafficDensity: number;
  packDensity?: number;       // # packs per mile
  avgPackSize?: number;      // average pack size per mile
}

interface PackDensityChartProps {
  data: PackDataPoint[];
}

const PackDensityChart: React.FC<PackDensityChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available for Pack Density Chart.</p>;
  }

  // Determine domain for YAxis based on data to ensure both lines are visible
  const packDensityValues = data.map(p => p.packDensity).filter(v => v !== undefined) as number[];
  const avgPackSizeValues = data.map(p => p.avgPackSize).filter(v => v !== undefined) as number[];

  const yAxis1Domain: YAxisProps['domain'] = [0, 'auto'];
  const yAxis2Domain: YAxisProps['domain'] = [0, 'auto'];


  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3 style={{ textAlign: 'center', fontWeight: 'bold' }}>Density of Car Packs vs Traffic Density</h3>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 40, // Increased right margin for second YAxis
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="trafficDensity"
            type="number"
            label={{ value: 'Traffic Density (cars/mile/lane)', position: 'insideBottom', offset: -10 }}
            domain={['auto', 'auto']}
            tickCount={6}
          />
          <YAxis
            yAxisId="left"
            label={{ value: 'Pack Density (# packs/mile)', angle: -90, position: 'insideLeft', offset: -10 }}
            stroke="hsl(var(--chart-1))" // Color for pack density axis/line
            domain={yAxis1Domain}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Avg Pack Size', angle: -90, position: 'insideRight', offset: -15 }}
            stroke="hsl(var(--chart-2))" // Color for avg pack size axis/line
            domain={yAxis2Domain}
          />
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />

          {data[0]?.packDensity !== undefined && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="packDensity"
              name="Pack Density (#/mile)"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
            />
          )}
          {data[0]?.avgPackSize !== undefined && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgPackSize"
              name="Average Pack Size"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5" // Differentiate line style
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PackDensityChart;
