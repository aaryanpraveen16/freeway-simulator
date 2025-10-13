import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SavedSimulation } from "@/services/indexedDBService";

interface DensityLaneDistributionChartProps {
  selectedSimulations: SavedSimulation[];
}

interface ChartDataPoint {
  density: number;
  [key: string]: number | undefined; // Dynamic keys for each lane and rule combination
}

// Color scheme for lanes
const LANE_COLORS = {
  american: [
    '#ef4444', // Red 500
    '#b91c1c', // Red 700
    '#7f1d1d', // Red 900
  ],
  european: [
    '#3b82f6', // Blue 500
    '#1d4ed8', // Blue 700
    '#1e3a8a', // Blue 900
  ]
};

const DensityLaneDistributionChart: React.FC<DensityLaneDistributionChartProps> = ({
  selectedSimulations,
}) => {
  // Process simulation data into chart format
  const { chartData, lineKeys, debugInfo } = useMemo(() => {
    // Debug info to help diagnose issues
    const debugInfo = {
      totalSimulations: selectedSimulations.length,
      simulationsWithData: 0,
      dataPointsFound: 0,
      sampleData: {} as any,
      error: ''
    };

    try {
      // Group simulations by traffic rule
      const simulationsByRule: Record<string, SavedSimulation[]> = {
        american: [],
        european: []
      };

      selectedSimulations.forEach(sim => {
        const rule = (sim.trafficRule || 'european').toLowerCase();
        if (rule === 'american' || rule === 'european') {
          simulationsByRule[rule].push(sim);
        }
      });

      // Process data points for each rule
      const allDataPoints: Record<string, ChartDataPoint> = {};
      const lineKeysSet = new Set<string>();
      let hasData = false;

      Object.entries(simulationsByRule).forEach(([rule, sims]) => {
        if (sims.length === 0) return;

        // For each simulation in this rule group
        sims.forEach((sim, simIndex) => {
          // Try to find lane history data in different possible locations
          const laneHistory = 
            (sim.chartData?.percentageByLaneHistory as any[]) || [];

          if (laneHistory.length === 0) return;
          
          debugInfo.simulationsWithData++;
          
          // Get the last data point for stabilized values
          const lastDataPoint = laneHistory[laneHistory.length - 1];
          
          // Try to find density in different possible locations
          const density = 
            lastDataPoint.density || 
            lastDataPoint.trafficDensity ||
            sim.params?.trafficDensity ||
            0;
            
          if (density === undefined || density === null) {
            debugInfo.error = 'No density data found';
            return;
          }

          const densityRounded = parseFloat(density.toFixed(2));
          const densityKey = densityRounded.toString();

          // Initialize data point if it doesn't exist
          if (!allDataPoints[densityKey]) {
            allDataPoints[densityKey] = { density: densityRounded };
          }

          // Find all lane data in the last data point
          const laneEntries = Object.entries(lastDataPoint)
            .filter(([key]) => key.startsWith('lane') && lastDataPoint[key] !== undefined);
            
          if (laneEntries.length === 0) {
            debugInfo.error = 'No lane data found in lastDataPoint';
            return;
          }

          // Add data for each lane
          laneEntries.forEach(([laneKey, value]) => {
            const dataKey = `${rule}_${laneKey}`;
            const laneNumber = parseInt(laneKey.replace('lane', '')) + 1; // Convert to 1-based
            
            allDataPoints[densityKey][dataKey] = value as number;
            const ruleType = rule as 'american' | 'european';
            const laneIndex = (laneNumber - 1) % 3; // Ensure we don't go out of bounds
            lineKeysSet.add(JSON.stringify({
              key: dataKey,
              name: `${ruleType === 'american' ? 'American' : 'European'} - Lane ${laneNumber}`,
              color: LANE_COLORS[ruleType][laneIndex]
            }));
            
            debugInfo.dataPointsFound++;
            hasData = true;
            
            // Save sample data for debugging
            if (simIndex === 0 && Object.keys(debugInfo.sampleData).length < 3) {
              debugInfo.sampleData[dataKey] = {
                value,
                density: densityRounded,
                rule,
                lane: laneKey
              };
            }
          });
        });
      });

      // Convert to array and sort by density
      const sortedData = Object.values(allDataPoints)
        .sort((a, b) => a.density - b.density);

      return {
        chartData: hasData ? sortedData : [],
        lineKeys: Array.from(lineKeysSet).map(str => JSON.parse(str)),
        debugInfo: {
          ...debugInfo,
          hasData,
          dataPointsCount: sortedData.length,
          lineKeysCount: lineKeysSet.size
        }
      };
    } catch (error) {
      console.error('Error processing simulation data:', error);
      return {
        chartData: [],
        lineKeys: [],
        debugInfo: {
          ...debugInfo,
          error: error instanceof Error ? error.message : 'Unknown error',
          hasData: false
        }
      };
    }
  }, [selectedSimulations]);

  // Debug output
  console.log('DensityLaneDistributionChart debug:', {
    selectedSimulationsCount: selectedSimulations.length,
    chartDataLength: chartData.length,
    lineKeys,
    debugInfo
  });

  if (chartData.length === 0 || lineKeys.length === 0) {
    // Create a more helpful error message
    const errorMessage = debugInfo?.error 
      ? `Error: ${debugInfo.error}`
      : 'No valid lane distribution data found in the selected simulations. ' +
        'Please ensure your simulations have completed and contain lane distribution data.';

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Lane Distribution by Density</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex flex-col items-center justify-center gap-4 p-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">{errorMessage}</p>
            {debugInfo && (
              <div className="text-xs text-muted-foreground mt-4 text-left bg-muted p-3 rounded">
                <p><strong>Debug Info:</strong></p>
                <p>• Total simulations: {debugInfo.totalSimulations}</p>
                <p>• Simulations with data: {debugInfo.simulationsWithData}</p>
                <p>• Data points found: {debugInfo.dataPointsFound}</p>
                {Object.keys(debugInfo.sampleData).length > 0 && (
                  <div className="mt-2">
                    <p><strong>Sample Data Found:</strong></p>
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(debugInfo.sampleData, null, 2)}
                    </pre>
                  </div>
                )}
                {debugInfo.error && (
                  <p className="text-red-500 mt-2">Error: {debugInfo.error}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Lane Distribution by Traffic Density</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="density"
              label={{ value: 'Traffic Density (veh/km)', position: 'insideBottomRight', offset: -5 }}
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
              formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
              labelFormatter={(density) => `Density: ${density} veh/km`}
            />
            
            {lineKeys.map(({ key, name, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={name}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DensityLaneDistributionChart;
