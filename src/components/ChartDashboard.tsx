import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SpeedDensityChart from "./SpeedDensityChart";
import PercentageOfCarsByLaneChart from "./PercentageOfCarsByLaneChart";
import DensityThroughputChart from "./DensityThroughputChart";
import LaneThroughputChart from "./LaneThroughputChart";
import PackFormationChart from "./PackFormationChart";
import AveragePackLengthChart from "./AveragePackLengthChart";
import PacksPerLaneChart from "./PacksPerLaneChart";
import SpeedDensityPerLaneChart from "./SpeedDensityPerLaneChart";
import DensityPerLaneComparisonChart from "./DensityPerLaneComparisonChart";
import PackDensityByTypeChart from "./PackDensityByTypeChart";

import { Car, SimulationParams } from "@/utils/trafficSimulation";
import { UnitSystem } from "@/utils/unitConversion";

interface ChartDashboardProps {
  // Core data
  cars: Car[];
  elapsedTime: number;
  laneLength: number;
  params: SimulationParams;
  trafficRule: 'american' | 'european';
  unitSystem?: UnitSystem;

  // Chart-specific data histories
  speedDensityHistory: any[];
  densityOfCarPacksHistory: any[];
  percentageByLaneHistory: any[];
  densityThroughputHistory: any[];
  laneThroughputHistory: any[];
  laneUtilizationHistory: any[];
  packHistory: any[];
  packLengthHistory: any[];
  packsPerLaneHistory: any[];

  // Pack formation controls
  showPackFormation: boolean;
  previousRunsData?: any[];
  previousRunsPackLengthData?: any[];
  onSaveCurrentRun?: () => void;
  onTogglePreviousRuns?: () => void;
  showPreviousRuns?: boolean;
}

const ChartDashboard: React.FC<ChartDashboardProps> = ({
  cars,
  elapsedTime,
  laneLength,
  params,
  trafficRule,
  unitSystem = 'imperial',
  speedDensityHistory,
  densityOfCarPacksHistory,
  percentageByLaneHistory,
  densityThroughputHistory,
  laneThroughputHistory,
  laneUtilizationHistory,
  packHistory,
  packLengthHistory,
  packsPerLaneHistory,
  showPackFormation,
  previousRunsData = [],
  previousRunsPackLengthData = [],
  onSaveCurrentRun,
  onTogglePreviousRuns,
  showPreviousRuns = false
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Traffic Analysis Dashboard</h2>
        <p className="text-gray-600">Real-time visualization of traffic patterns and behavior</p>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="distribution">Traffic Distribution</TabsTrigger>
          <TabsTrigger value="packs">Pack Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Performance & Flow Analysis</CardTitle>
                  <CardDescription>Key metrics for traffic flow efficiency and throughput analysis</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    {trafficRule} Rules
                  </Badge>
                  <Badge variant="outline">
                    {params.numLanes} {params.numLanes === 1 ? 'Lane' : 'Lanes'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <SpeedDensityChart
                  cars={cars}
                  elapsedTime={elapsedTime}
                  dataHistory={speedDensityHistory}
                  numLanes={params.numLanes}
                  trafficRule={trafficRule}
                  laneLength={laneLength}
                  unitSystem={unitSystem}
                  simulationParams={params}
                />
                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                  <strong>Speed-Density Relationship:</strong> Shows the fundamental traffic engineering relationship.
                  As density increases, speed typically decreases due to congestion effects.
                </div>
              </div>

              <div className="space-y-4">
                <SpeedDensityPerLaneChart
                  dataHistory={densityThroughputHistory}
                  numLanes={params.numLanes}
                  unitSystem={unitSystem}
                />
                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                  <strong>Speed per Lane Over Time:</strong> Analysis of how speed varies over time for each lane individually.
                  Differences between lanes can indicate uneven flow or "fast lane" efficiency.
                </div>
              </div>

              <div className="space-y-4">
                <DensityThroughputChart
                  cars={cars}
                  laneLength={laneLength}
                  elapsedTime={elapsedTime}
                  dataHistory={densityThroughputHistory}
                  numLanes={params.numLanes}
                  trafficRule={trafficRule}
                  unitSystem={unitSystem}
                  simulationParams={params}
                />
                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                  <strong>Flow Efficiency:</strong> Relationship between traffic density and throughput.
                  Optimal flow occurs at moderate densities before congestion reduces throughput.
                </div>
              </div>

              <div className="space-y-4">
                <LaneThroughputChart
                  dataHistory={laneThroughputHistory}
                  numLanes={params.numLanes}
                  unitSystem={unitSystem}
                />
                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                  <strong>Lane-Specific Throughput:</strong> Compare throughput across individual lanes.
                  Imbalances may indicate lane preference or bottlenecks in specific lanes.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Traffic Distribution Analysis</CardTitle>
                  <CardDescription>How vehicles distribute across lanes over time</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    {trafficRule} Rules
                  </Badge>
                  <Badge variant="outline">
                    {params.numLanes} {params.numLanes === 1 ? 'Lane' : 'Lanes'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <PercentageOfCarsByLaneChart
                    cars={cars}
                    elapsedTime={elapsedTime}
                    dataHistory={percentageByLaneHistory}
                    numLanes={params.numLanes}
                    trafficRule={trafficRule}
                  />
                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                    <strong>Lane Distribution:</strong> Percentage of vehicles in each lane over time.
                    Shows lane preference patterns under {trafficRule} traffic rules.
                  </div>
                </div>

                <div className="space-y-4">
                  <DensityPerLaneComparisonChart
                    dataHistory={densityThroughputHistory}
                    numLanes={params.numLanes}
                    unitSystem={unitSystem}
                  />
                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                    <strong>Density per Lane Over Time:</strong> (Chart 2.3) Tracking how traffic load is distributed across lanes over the simulation duration.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packs" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Advanced Pack Formation Analysis</CardTitle>
                  <CardDescription>Deep dive into traffic pack formation, evolution, and comparison across simulation runs</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    {trafficRule} Rules
                  </Badge>
                  <Badge variant="outline">
                    {params.numLanes} {params.numLanes === 1 ? 'Lane' : 'Lanes'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <PackFormationChart
                    packHistory={packHistory}
                    previousRunsData={showPreviousRuns ? previousRunsData : []}
                    onSaveCurrentRun={onSaveCurrentRun}
                    onTogglePreviousRuns={onTogglePreviousRuns}
                    showPreviousRuns={showPreviousRuns}
                  />
                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                    <strong>Pack Formation:</strong> Tracks the number of distinct traffic packs over time.
                    More packs indicate fragmented traffic flow.
                  </div>
                </div>

                <div className="space-y-4">
                  <AveragePackLengthChart
                    packLengthHistory={packLengthHistory}
                    previousRunsData={showPreviousRuns ? previousRunsPackLengthData : []}
                    onSaveCurrentRun={onSaveCurrentRun}
                    onTogglePreviousRuns={onTogglePreviousRuns}
                    showPreviousRuns={showPreviousRuns}
                  />
                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                    <strong>Pack Length Evolution:</strong> Average length of traffic packs in number of cars.
                    Longer packs suggest sustained congestion patterns.
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <PacksPerLaneChart
                  packsPerLaneHistory={packsPerLaneHistory}
                  numLanes={params.numLanes || 3}
                />
                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                  <strong>Packs Per Lane:</strong> Shows the number of traffic packs in each individual lane over time.
                  Helps identify which lanes experience more pack formation and congestion.
                </div>

                <div className="mt-6 space-y-4">
                  <PackDensityByTypeChart
                    packHistory={packHistory}
                    densityHistory={densityThroughputHistory}
                    freewayLength={params.freewayLength || 10}
                    unitSystem={unitSystem}
                  />
                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                    <strong>Pack Density by Type vs Density:</strong> (Chart 2.4a) Breakdown of packs per km/mile by size category (Small, Medium, Large) vs Total Traffic Density.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartDashboard;
