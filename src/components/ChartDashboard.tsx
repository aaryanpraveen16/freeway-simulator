
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SpeedDensityChart from "./SpeedDensityChart";
import DensityOfCarPacksChart from "./DensityOfCarPacksChart";
import PercentageOfCarsByLaneChart from "./PercentageOfCarsByLaneChart";
import DensityThroughputChart from "./DensityThroughputChart";
import LaneUtilizationChart from "./LaneUtilizationChart";
import PackFormationChart from "./PackFormationChart";
import AveragePackLengthChart from "./AveragePackLengthChart";
import { Car } from "@/utils/trafficSimulation";
import { SimulationParams } from "@/utils/trafficSimulation";

interface ChartDashboardProps {
  // Core data
  cars: Car[];
  elapsedTime: number;
  laneLength: number;
  params: SimulationParams;
  trafficRule: 'american' | 'european';
  
  // Chart-specific data histories
  speedDensityHistory: any[];
  densityOfCarPacksHistory: any[];
  percentageByLaneHistory: any[];
  densityThroughputHistory: any[];
  laneUtilizationHistory: any[];
  packHistory: any[];
  packLengthHistory: any[];
  
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
  speedDensityHistory,
  densityOfCarPacksHistory,
  percentageByLaneHistory,
  densityThroughputHistory,
  laneUtilizationHistory,
  packHistory,
  packLengthHistory,
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="distribution">Traffic Distribution</TabsTrigger>
          <TabsTrigger value="behavior">Traffic Behavior</TabsTrigger>
          <TabsTrigger value="packs" disabled={!showPackFormation}>Pack Analysis</TabsTrigger>
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
            <CardContent>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <SpeedDensityChart 
                    cars={cars}
                    elapsedTime={elapsedTime}
                    dataHistory={speedDensityHistory}
                    numLanes={params.numLanes}
                    trafficRule={trafficRule}
                    laneLength={laneLength}
                  />
                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                    <strong>Speed-Density Relationship:</strong> Shows the fundamental traffic engineering relationship. 
                    As density increases, speed typically decreases due to congestion effects.
                  </div>
                </div>
                
                <div className="space-y-4">
                  <DensityThroughputChart 
                    cars={cars}
                    laneLength={laneLength}
                    elapsedTime={elapsedTime}
                    dataHistory={densityThroughputHistory}
                    numLanes={params.numLanes}
                  />
                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                    <strong>Flow Efficiency:</strong> Relationship between traffic density and throughput. 
                    Optimal flow occurs at moderate densities before congestion reduces throughput.
                  </div>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Traffic Behavior & Density</CardTitle>
                  <CardDescription>
                    Analysis of overall freeway density and pack formation patterns
                  </CardDescription>
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
                  <DensityOfCarPacksChart 
                    cars={cars}
                    elapsedTime={elapsedTime}
                    laneLength={laneLength}
                    dataHistory={densityOfCarPacksHistory}
                    numLanes={params.numLanes}
                    trafficRule={trafficRule}
                  />
                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                    <strong>Freeway Density Analysis:</strong> Shows overall traffic density (black line), 
                    average pack size (red dashed), and total number of packs (green dashed). 
                    Higher pack density indicates more clustering and potential congestion.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packs" className="space-y-6">
          {showPackFormation ? (
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center text-gray-500">
                  <p className="text-lg font-medium mb-2">Pack Formation Analysis Disabled</p>
                  <p className="text-sm">Enable "Show Pack Formation Charts" in the control bar to view this section</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartDashboard;
