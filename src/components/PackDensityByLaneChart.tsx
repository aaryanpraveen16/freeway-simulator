import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, YAxisProps } from 'recharts';

interface PackByLaneDataPoint {
  trafficDensity: number;
  // For each combo, two values: pack density (# per mile) and average pack size per lane
  // Example for American 1-Lane:
  american1Lane_packDensity?: number;
  american1Lane_avgPackSize?: number;
  european1Lane_packDensity?: number;
  european1Lane_avgPackSize?: number;

  american2Lane_packDensity?: number;
  american2Lane_avgPackSize?: number;
  european2Lane_packDensity?: number;
  european2Lane_avgPackSize?: number;

  american3Lane_packDensity?: number;
  american3Lane_avgPackSize?: number;
  european3Lane_packDensity?: number;
  european3Lane_avgPackSize?: number;
}

interface PackDensityByLaneChartProps {
  data: PackByLaneDataPoint[];
}

const baseColors = {
  american1Lane: "hsl(var(--chart-1))",
  european1Lane: "hsl(var(--chart-2))",
  american2Lane: "hsl(var(--chart-1-darker))",
  european2Lane: "hsl(var(--chart-2-darker))",
  american3Lane: "hsl(var(--chart-1-darkest))",
  european3Lane: "hsl(var(--chart-2-darkest))",
};

const PackDensityByLaneChart: React.FC<PackDensityByLaneChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available for Pack Density by Lane Chart.</p>;
  }

  const seriesKeys = [
    { rule: "american", lanes: 1, label: "American 1-Lane" },
    { rule: "european", lanes: 1, label: "European 1-Lane" },
    { rule: "american", lanes: 2, label: "American 2-Lane" },
    { rule: "european", lanes: 2, label: "European 2-Lane" },
    { rule: "american", lanes: 3, label: "American 3-Lane" },
    { rule: "european", lanes: 3, label: "European 3-Lane" },
  ];

  // Check if we have avgPackSize data to determine if second YAxis is needed
  const hasAvgPackSizeData = seriesKeys.some(series => {
    const baseKey = `${series.rule}${series.lanes}Lane`;
    const avgPackSizeKey = `${baseKey}_avgPackSize`;
    // @ts-ignore
    return data[0]?.[avgPackSizeKey] !== undefined;
  });

  return (
    <div style={{ width: '100%', height: 350 }}> {/* Increased height for more lines/axes */}
      <h3 style={{ textAlign: 'center', fontWeight: 'bold' }}>Density of Car Packs by Lane vs Traffic Density</h3>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: hasAvgPackSizeData ? 40 : 30, // Adjust margin if second YAxis is present
            left: 20,
            bottom: 40,
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
            yAxisId="left"
            label={{ value: 'Pack Density (#/mile/lane)', angle: -90, position: 'insideLeft', offset: -10 }}
            domain={['auto', 'auto']}
          />
          {hasAvgPackSizeData && (
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Avg Pack Size/lane', angle: -90, position: 'insideRight', offset: -15 }}
              domain={['auto', 'auto']}
              strokeDasharray="5 5" // Visually distinguish axis line if needed
            />
          )}
          <Tooltip />
          <Legend verticalAlign="bottom" height={50} wrapperStyle={{overflowY: 'auto', maxHeight: 60}} />

          {seriesKeys.map(series => {
            const baseKey = `${series.rule}${series.lanes}Lane`;
            const packDensityKey = `${baseKey}_packDensity`;
            const avgPackSizeKey = `${baseKey}_avgPackSize`;
            // @ts-ignore
            const color = baseColors[baseKey];

            const lines = [];
            // @ts-ignore
            if (data[0]?.[packDensityKey] !== undefined) {
              lines.push(
                <Line
                  key={`${baseKey}_packDensity`}
                  yAxisId="left"
                  type="monotone"
                  // @ts-ignore
                  dataKey={packDensityKey}
                  name={`${series.label} (Pack Density)`}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              );
            }
            // @ts-ignore
            if (data[0]?.[avgPackSizeKey] !== undefined) {
              lines.push(
                <Line
                  key={`${baseKey}_avgPackSize`}
                  yAxisId={hasAvgPackSizeData ? "right" : "left"} // Use right axis if it exists
                  type="monotone"
                  // @ts-ignore
                  dataKey={avgPackSizeKey}
                  name={`${series.label} (Avg Pack Size)`}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5" // Dashed for avg pack size
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

export default PackDensityByLaneChart;
