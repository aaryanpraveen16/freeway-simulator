import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LanePercentageDataPoint {
  trafficDensity: number;
  // Optional fields for each line based on rule and lane count
  american1Lane?: number; // e.g., % of cars in lane 0 for American 1-lane
  european1Lane?: number;
  american2Lane0?: number; // % of cars in lane 0 for American 2-lane
  american2Lane1?: number; // % of cars in lane 1 for American 2-lane
  european2Lane0?: number;
  european2Lane1?: number;
  american3Lane0?: number; // % of cars in lane 0 for American 3-lane
  american3Lane1?: number;
  american3Lane2?: number;
  european3Lane0?: number;
  european3Lane1?: number;
  european3Lane2?: number;
  // It might be better to structure this as an array of objects,
  // where each object has a 'name' (e.g., "American 1-Lane 0") and 'data' (array of percentages)
  // For now, sticking to the 6 lines as per Panel 1, assuming "Percent of cars in that lane" means the primary lane of travel
  // or an aggregate if multiple lanes are involved.
  // The request states "Same six lines as Panel 1", which implies one line per (Rule x Lane Count) combo.
  // This means the Y-axis value would be an *average* percentage across lanes for multi-lane setups,
  // or specifically for one lane if it's a 1-lane setup.
  // Re-interpreting: "Percent of cars in that lane" likely means we need to distinguish lines *per lane* for multi-lane scenarios.
  // This chart might need more lines than Panel 1 if it's truly "Percent of cars *by Lane*".
  // For now, I will assume it's 6 lines as stated, representing an average or characteristic percentage.
  // If "Percent of cars by Lane" means one line per specific lane (e.g. Lane 0, Lane 1, Lane 2 for a 3-lane road),
  // then the number of lines would be: (1+1) for 1-lane, (2+2) for 2-lane, (3+3) for 3-lane = 12 lines.
  // Given "Same six lines as Panel 1", I will proceed with 6 lines.
  // The Y-value would be the percentage of cars in the *primary* or *most utilized* lane for that configuration,
  // or an average across its lanes. This needs clarification.
  // For now, I'll use the same keys as ThroughputChart for simplicity of 6 lines.
  american1LanePercent?: number;
  european1LanePercent?: number;
  american2LanePercent?: number;
  european2LanePercent?: number;
  american3LanePercent?: number;
  european3LanePercent?: number;
}

interface LanePercentageChartProps {
  data: LanePercentageDataPoint[];
}

const lineColors = {
  american1Lane: "hsl(var(--chart-1))",
  european1Lane: "hsl(var(--chart-2))",
  american2Lane: "hsl(var(--chart-1-darker))",
  european2Lane: "hsl(var(--chart-2-darker))",
  american3Lane: "hsl(var(--chart-1-darkest))",
  european3Lane: "hsl(var(--chart-2-darkest))",
};

const lineStrokes = {
  american: "solid",
  european: "dashed",
};

const LanePercentageChart: React.FC<LanePercentageChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available for Lane Percentage Chart.</p>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3 style={{ textAlign: 'center', fontWeight: 'bold' }}>Percentage of Cars by Lane vs Traffic Density</h3>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
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
            label={{ value: '% of Cars in Lane', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]} // Percentage
            unit="%"
          />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Legend verticalAlign="bottom" height={36} />

          {data[0]?.american1LanePercent !== undefined && (
            <Line
              type="monotone"
              dataKey="american1LanePercent"
              name="American 1-Lane"
              stroke={lineColors.american1Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.american === "dashed" ? "5 5" : undefined}
            />
          )}
          {data[0]?.american2LanePercent !== undefined && (
            <Line
              type="monotone"
              dataKey="american2LanePercent"
              name="American 2-Lane"
              stroke={lineColors.american2Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.american === "dashed" ? "5 5" : undefined}
            />
          )}
          {data[0]?.american3LanePercent !== undefined && (
            <Line
              type="monotone"
              dataKey="american3LanePercent"
              name="American 3-Lane"
              stroke={lineColors.american3Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.american === "dashed" ? "5 5" : undefined}
            />
          )}

          {data[0]?.european1LanePercent !== undefined && (
            <Line
              type="monotone"
              dataKey="european1LanePercent"
              name="European 1-Lane"
              stroke={lineColors.european1Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.european === "dashed" ? "5 5" : undefined}
            />
          )}
          {data[0]?.european2LanePercent !== undefined && (
            <Line
              type="monotone"
              dataKey="european2LanePercent"
              name="European 2-Lane"
              stroke={lineColors.european2Lane}
              strokeWidth={2}
              dot={false}
              strokeDasharray={lineStrokes.european === "dashed" ? "5 5" : undefined}
            />
          )}
          {data[0]?.european3LanePercent !== undefined && (
            <Line
              type="monotone"
              dataKey="european3LanePercent"
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

export default LanePercentageChart;
