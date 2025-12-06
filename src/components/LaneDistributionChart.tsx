import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SavedSimulation } from "@/services/simulationService";

interface LaneDistributionChartProps {
  selectedSimulations: SavedSimulation[];
}

interface ChartDataPoint {
  lane: number;
  percentage: number;
  trafficRule: 'american' | 'european';
  simulationName: string;
}

const LaneDistributionChart: React.FC<LaneDistributionChartProps> = ({
  selectedSimulations,
}) => {
  // Process simulation data into chart format
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];

    selectedSimulations.forEach((simulation) => {
      const trafficRule = simulation.trafficRule || 'european';
      const simName = simulation.name || 'Unnamed';

      // Get the last data point for stabilized values
      const lastDataPoint = simulation.chartData?.percentageByLaneHistory?.[simulation.chartData.percentageByLaneHistory.length - 1];
      if (!lastDataPoint) return;

      // Get the number of lanes from simulation params or count available lanes in data
      const numLanes = simulation.params?.numLanes ||
        Object.keys(lastDataPoint)
          .filter(key => key.startsWith('lane'))
          .length;

      // Calculate total percentage for normalization
      let totalPercentage = 0;
      const lanePercentages: number[] = [];

      for (let i = 0; i < numLanes; i++) {
        const laneKey = `lane${i}`;
        const percentage = lastDataPoint[laneKey] || 0;
        lanePercentages.push(percentage);
        totalPercentage += percentage;
      }

      // Add data points for each lane
      lanePercentages.forEach((percentage, index) => {
        // Normalize if total is not 100%
        const normalizedPercentage = totalPercentage > 0 ?
          (percentage / totalPercentage) * 100 : 0;

        data.push({
          lane: index + 1, // 1-based lane numbering
          percentage: parseFloat(normalizedPercentage.toFixed(1)),
          trafficRule,
          simulationName: simName,
        });
      });
    });

    return data;
  }, [selectedSimulations]);

  // Group data by lane and traffic rule for the chart
  const processedData = useMemo(() => {
    // Get all unique lanes
    const lanes = [...new Set(chartData.map(item => item.lane))].sort((a, b) => a - b);

    // Group by traffic rule
    const dataByRule: Record<string, { lane: number; percentage: number }[]> = {
      american: [],
      european: []
    };

    // Calculate average percentage for each lane and traffic rule
    lanes.forEach(lane => {
      const americanPoints = chartData.filter(
        item => item.lane === lane && item.trafficRule === 'american'
      );
      const europeanPoints = chartData.filter(
        item => item.lane === lane && item.trafficRule === 'european'
      );

      if (americanPoints.length > 0) {
        const avgAmerican = americanPoints.reduce(
          (sum, point) => sum + point.percentage, 0
        ) / americanPoints.length;
        dataByRule.american.push({
          lane,
          percentage: parseFloat(avgAmerican.toFixed(1))
        });
      }

      if (europeanPoints.length > 0) {
        const avgEuropean = europeanPoints.reduce(
          (sum, point) => sum + point.percentage, 0
        ) / europeanPoints.length;
        dataByRule.european.push({
          lane,
          percentage: parseFloat(avgEuropean.toFixed(1))
        });
      }
    });

    // Convert to array for the chart
    const result: any[] = [];

    // Add all data points for each lane
    lanes.forEach(lane => {
      const point: any = { lane: `Lane ${lane}` };

      const americanPoint = dataByRule.american.find(p => p.lane === lane);
      if (americanPoint) {
        point.american = americanPoint.percentage;
      }

      const europeanPoint = dataByRule.european.find(p => p.lane === lane);
      if (europeanPoint) {
        point.european = europeanPoint.percentage;
      }

      result.push(point);
    });

    return result;
  }, [chartData]);

  const hasAmericanData = chartData.some(d => d.trafficRule === 'american');
  const hasEuropeanData = chartData.some(d => d.trafficRule === 'european');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stabilized Lane Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="lane"
              label={{ value: 'Lane Number', position: 'insideBottomRight', offset: -5 }}
              tick={{ fill: '#666' }}
            />
            <YAxis
              label={{
                value: 'Percentage of Cars (%)',
                angle: -90,
                position: 'insideLeft',
                offset: 10
              }}
              domain={[0, 100]}
              tick={{ fill: '#666' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [`${value}%`, name]}
              labelFormatter={(label) => `Lane: ${label}`}
            />
            <Legend />

            {hasAmericanData && (
              <Line
                type="monotone"
                dataKey="american"
                name="American Rules"
                stroke="#ff4d4f"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
                connectNulls
              />
            )}

            {hasEuropeanData && (
              <Line
                type="monotone"
                dataKey="european"
                name="European Rules"
                stroke="#1890ff"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default LaneDistributionChart;
