import React from 'react';
import ThroughputChart from './ThroughputChart';
import SimulationParametersDisplay from './SimulationParametersDisplay';
import LanePercentageChart from './LanePercentageChart';
import SpeedByLaneChart from './SpeedByLaneChart';
import AnalysisPanel5PackDensityChart from './AnalysisPanel5PackDensityChart'; // Renamed import
import PackDensityByLaneChart from './PackDensityByLaneChart';

// Define interfaces for the data props of each chart
// These should match the interfaces defined in the individual chart components

interface ThroughputDataPoint {
  trafficDensity: number;
  american1Lane?: number;
  european1Lane?: number;
  american2Lane?: number;
  european2Lane?: number;
  american3Lane?: number;
  european3Lane?: number;
}

interface SimulationParametersData {
  freewayLength: number;
  speedLimitRatio: number | string;
  meanTripLength: number;
  tripLengthStdDev: number;
  meanDesiredSpeed: number;
  desiredSpeedStdDev: number;
}

interface LanePercentageDataPoint {
  trafficDensity: number;
  american1LanePercent?: number;
  european1LanePercent?: number;
  american2LanePercent?: number;
  european2LanePercent?: number;
  american3LanePercent?: number;
  european3LanePercent?: number;
}

interface SpeedDataPoint {
  trafficDensity: number;
  american1Lane_avgLaneSpeed?: number;
  american1Lane_avgFreewaySpeed?: number;
  european1Lane_avgLaneSpeed?: number;
  european1Lane_avgFreewaySpeed?: number;
  american2Lane_avgLaneSpeed?: number;
  american2Lane_avgFreewaySpeed?: number;
  european2Lane_avgLaneSpeed?: number;
  european2Lane_avgFreewaySpeed?: number;
  american3Lane_avgLaneSpeed?: number;
  american3Lane_avgFreewaySpeed?: number;
  european3Lane_avgLaneSpeed?: number;
  european3Lane_avgFreewaySpeed?: number;
}

interface PackDataPoint {
  trafficDensity: number;
  packDensity?: number;
  avgPackSize?: number;
}

interface PackByLaneDataPoint {
  trafficDensity: number;
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

// Props for the dashboard
interface ChartsDashboardProps {
  throughputData: ThroughputDataPoint[];
  simulationParams: SimulationParametersData;
  lanePercentageData: LanePercentageDataPoint[];
  speedByLaneData: SpeedDataPoint[];
  packDensityData: PackDataPoint[];
  packByLaneData: PackByLaneDataPoint[];
  speedLimitRatioForTitle: number | string; // For the main title of the dashboard
}

const ChartsDashboard: React.FC<ChartsDashboardProps> = ({
  throughputData,
  simulationParams,
  lanePercentageData,
  speedByLaneData,
  packDensityData,
  packByLaneData,
  speedLimitRatioForTitle,
}) => {
  const gridCellStyle: React.CSSProperties = {
    padding: '10px',
    border: '1px solid hsl(var(--border))', // Using a common border color variable
    borderRadius: 'var(--radius)', // Using a common radius variable
    backgroundColor: 'hsl(var(--card))', // Using card background
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
        Traffic Simulation Analysis (Speed Limit Ratio: {speedLimitRatioForTitle})
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={gridCellStyle}>
          <ThroughputChart data={throughputData} />
        </div>
        <div style={gridCellStyle}>
          <SimulationParametersDisplay {...simulationParams} />
        </div>
        <div style={gridCellStyle}>
          <LanePercentageChart data={lanePercentageData} />
        </div>
        <div style={gridCellStyle}>
          <SpeedByLaneChart data={speedByLaneData} />
        </div>
        <div style={gridCellStyle}>
          <AnalysisPanel5PackDensityChart data={packDensityData} />
        </div>
        <div style={gridCellStyle}>
          <PackDensityByLaneChart data={packByLaneData} />
        </div>
      </div>
    </div>
  );
};

export default ChartsDashboard;
