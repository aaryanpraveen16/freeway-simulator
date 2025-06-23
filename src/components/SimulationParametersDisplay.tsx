import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'; // Assuming shadcn/ui Card is used

interface SimulationParameterProps {
  label: string;
  value: string | number;
  unit?: string;
}

const ParameterItem: React.FC<SimulationParameterProps> = ({ label, value, unit }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
    <span style={{ marginRight: '10px' }}>{label}:</span>
    <span>{value}{unit ? ` ${unit}` : ''}</span>
  </div>
);

interface SimulationParametersDisplayProps {
  freewayLength: number;
  speedLimitRatio: number | string; // Can be 'No Limit'
  meanTripLength: number;
  tripLengthStdDev: number;
  meanDesiredSpeed: number;
  desiredSpeedStdDev: number;
}

const SimulationParametersDisplay: React.FC<SimulationParametersDisplayProps> = (params) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ fontWeight: 'bold', textAlign: 'center' }}>Simulation Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <ParameterItem label="Simulated Freeway Length" value={params.freewayLength} unit="miles" />
        <ParameterItem label="Speed-Limit to Mean-Desired-Speed Ratio" value={params.speedLimitRatio} />
        <ParameterItem label="Mean Trip Length" value={params.meanTripLength} unit="miles" />
        <ParameterItem label="Trip-Length Standard Deviation" value={params.tripLengthStdDev} unit="miles" />
        <ParameterItem label="Mean Desired Speed" value={params.meanDesiredSpeed} unit="mph" />
        <ParameterItem label="Desired-Speed Standard Deviation" value={params.desiredSpeedStdDev} unit="mph" />
      </CardContent>
    </Card>
  );
};

export default SimulationParametersDisplay;
