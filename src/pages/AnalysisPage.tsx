import React, { useState, useEffect, useRef } from 'react';
import ChartsDashboard from '../components/ChartsDashboard';
import { initializeSimulation, updateSimulation, SimulationParams, Car, defaultParams } from '../utils/trafficSimulation';
import { Button } from '../components/ui/button'; // Assuming shadcn/ui button
import html2canvas from 'html2canvas';

// Define data types for chart props (can be imported or defined centrally later)
interface ThroughputDataPoint { trafficDensity: number; american1Lane?: number; european1Lane?: number; american2Lane?: number; european2Lane?: number; american3Lane?: number; european3Lane?: number; }
interface SimulationParametersData { freewayLength: number; speedLimitRatio: number | string; meanTripLength: number; tripLengthStdDev: number; meanDesiredSpeed: number; desiredSpeedStdDev: number; }
interface LanePercentageDataPoint { trafficDensity: number; american1LanePercent?: number; european1LanePercent?: number; american2LanePercent?: number; european2LanePercent?: number; american3LanePercent?: number; european3LanePercent?: number; }
interface SpeedDataPoint { trafficDensity: number; american1Lane_avgLaneSpeed?: number; american1Lane_avgFreewaySpeed?: number; european1Lane_avgLaneSpeed?: number; european1Lane_avgFreewaySpeed?: number; american2Lane_avgLaneSpeed?: number; american2Lane_avgFreewaySpeed?: number; european2Lane_avgLaneSpeed?: number; european2Lane_avgFreewaySpeed?: number; american3Lane_avgLaneSpeed?: number; american3Lane_avgFreewaySpeed?: number; european3Lane_avgLaneSpeed?: number; european3Lane_avgFreewaySpeed?: number; }
interface PackDataPoint { trafficDensity: number; packDensity?: number; avgPackSize?: number; }
interface PackByLaneDataPoint { trafficDensity: number; american1Lane_packDensity?: number; american1Lane_avgPackSize?: number; european1Lane_packDensity?: number; european1Lane_avgPackSize?: number; american2Lane_packDensity?: number; american2Lane_avgPackSize?: number; european2Lane_packDensity?: number; european2Lane_avgPackSize?: number; american3Lane_packDensity?: number; american3Lane_avgPackSize?: number; european3Lane_packDensity?: number; european3Lane_avgPackSize?: number; }

interface AllChartData {
  throughputData: ThroughputDataPoint[];
  simulationParams: SimulationParametersData;
  lanePercentageData: LanePercentageDataPoint[];
  speedByLaneData: SpeedDataPoint[];
  packDensityData: PackDataPoint[];
  packByLaneData: PackByLaneDataPoint[];
  speedLimitRatioForTitle: number | string;
}

const speedLimitRatios = [0.5, 0.75, 1.0, 1.5, "No Limit"];
const trafficDensitiesToSimulate = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]; // cars per mile (overall, to be divided by numLanes for per-lane density)
const simulationDurationSeconds = 3600; // 1 hour of simulation time for data collection
const numRunsPerScenario = 3; // For averaging results

// --- Helper: Define a Pack ---
const MAX_PACK_HEADWAY_SECONDS = 2.0; // Max headway to be considered in the same pack

const AnalysisPage: React.FC = () => {
  const [allGeneratedData, setAllGeneratedData] = useState<Record<string, AllChartData>>({});
  const [currentRatioIndex, setCurrentRatioIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const generateDataForRatio = async (ratio: number | string): Promise<AllChartData> => {
    console.log(`Generating data for speed limit ratio: ${ratio}`);
    // This is a placeholder for the complex data generation logic.
    // It needs to iterate through rules (American/European), lanes (1,2,3), and densities.
    // For each combination, run the simulation, collect metrics, average over runs.

    const baseSpeedLimit = defaultParams.speedLimit; // e.g., 70 mph
    const currentSpeedLimit = typeof ratio === 'number' ? baseSpeedLimit * ratio : 1000; // Effectively no limit

    // Initialize data structures
    const throughputData: ThroughputDataPoint[] = [];
    const lanePercentageData: LanePercentageDataPoint[] = [];
    const speedByLaneData: SpeedDataPoint[] = [];
    const packDensityData: PackDataPoint[] = []; // Overall pack density
    const packByLaneData: PackByLaneDataPoint[] = []; // Pack density by lane/rule

    for (const overallDensity of trafficDensitiesToSimulate) {
      // These will hold aggregated results for the current density point across rules/lanes
      const currentDensityThroughput: any = { trafficDensity: overallDensity };
      const currentDensityLanePercent: any = { trafficDensity: overallDensity };
      const currentDensitySpeed: any = { trafficDensity: overallDensity };
      const currentDensityPackByLane: any = { trafficDensity: overallDensity };

      // For overall pack density (Panel 5) - needs aggregation across all scenarios at this density
      let totalPacksAtThisDensity = 0;
      let totalCarsInPacksAtThisDensity = 0;
      let totalFreewayLengthMilesRun = 0;


      for (const rule of ["american", "european"] as ("american" | "european")[]) {
        for (const numLanes of [1, 2, 3]) {
          const trafficDensityPerLane = overallDensity / numLanes;
          const seriesPrefix = `${rule}${numLanes}Lane`;

          // Store results for this specific series (rule, numLanes) over multiple runs
          let seriesThroughputSum = 0;
          let seriesLaneCarCounts: number[][] = Array(numLanes).fill(null).map(() => []); // For % by lane
          let seriesLaneSpeeds: number[][] = Array(numLanes).fill(null).map(() => []); // For avg speed in lane
          let seriesFreewaySpeeds: number[] = []; // For avg freeway speed
          let seriesPackCountsPerLane: number[][] = Array(numLanes).fill(null).map(() => []);
          let seriesCarsInPacksPerLane: number[][] = Array(numLanes).fill(null).map(() => []);


          for (let run = 0; run < numRunsPerScenario; run++) {
            let cars: Car[];
            let simParams: SimulationParams = {
              ...defaultParams,
              numLanes,
              trafficDensity: Array(numLanes).fill(trafficDensityPerLane),
              speedLimit: currentSpeedLimit,
              freewayLength: defaultParams.freewayLength || 10, // Ensure freewayLength
            };

            ({ cars } = initializeSimulation(simParams));
            let exitedCarsCount = 0;
            const simulationSteps = simulationDurationSeconds / simParams.dt;

            for (let step = 0; step < simulationSteps; step++) {
              const { cars: updatedCars, events } = updateSimulation(cars, simParams.freewayLength!, simParams, step * simParams.dt, rule);
              cars = updatedCars;
              exitedCarsCount += events.filter(e => e.type === 'exit').length;

              // Collect data at intervals or at the end
              if (step % 100 === 0) { // Sample data periodically
                const currentTotalCars = cars.length;
                if (currentTotalCars > 0) {
                    seriesFreewaySpeeds.push(cars.reduce((sum, car) => sum + car.speed, 0) / currentTotalCars);
                }
                for(let l=0; l<numLanes; l++) {
                    const carsInLane = cars.filter(c => c.lane === l);
                    if (carsInLane.length > 0) {
                        seriesLaneCarCounts[l].push(carsInLane.length / currentTotalCars * 100);
                        seriesLaneSpeeds[l].push(carsInLane.reduce((s,c) => s + c.speed, 0) / carsInLane.length);
                    } else {
                        seriesLaneCarCounts[l].push(0);
                        seriesLaneSpeeds[l].push(0);
                    }
                }
              }
            } // End simulation steps loop
            seriesThroughputSum += exitedCarsCount;
          } // End numRunsPerScenario loop

          // --- Aggregate results for the series ---
          const avgThroughput = seriesThroughputSum / numRunsPerScenario / (simulationDurationSeconds / 3600);
          currentDensityThroughput[`${seriesPrefix}`] = avgThroughput;

          // For Lane Percentage (Panel 3) - assuming avg % for the primary lane or avg of all lanes
          // This part needs refinement based on precise definition for Panel 3's 6 lines
          let avgLaneUtilForSeries = 0;
          if (seriesLaneCarCounts.flat().length > 0) {
            // Example: average utilization of the busiest lane, or just lane 0 for 1-lane
            const primaryLaneData = seriesLaneCarCounts[0]; // Simplification
            avgLaneUtilForSeries = primaryLaneData.reduce((s,v)=>s+v,0) / primaryLaneData.length;
          }
          currentDensityLanePercent[`${seriesPrefix}Percent`] = avgLaneUtilForSeries;

          // For Speed by Lane (Panel 4)
          let avgLaneSpeedForSeries = 0;
          const allLaneSpeedsForSeries = seriesLaneSpeeds.flat();
          if (allLaneSpeedsForSeries.length > 0) {
             avgLaneSpeedForSeries = allLaneSpeedsForSeries.reduce((s,v)=>s+v,0) / allLaneSpeedsForSeries.length;
          }
          currentDensitySpeed[`${seriesPrefix}_avgLaneSpeed`] = avgLaneSpeedForSeries;
          currentDensitySpeed[`${seriesPrefix}_avgFreewaySpeed`] = seriesFreewaySpeeds.length > 0 ? seriesFreewaySpeeds.reduce((s,v)=>s+v,0) / seriesFreewaySpeeds.length : 0;

          // TODO: Pack calculations for Panel 5 & 6 (complex, requires pack identification logic)

        } // End numLanes loop
      } // End rule loop

      throughputData.push(currentDensityThroughput);
      lanePercentageData.push(currentDensityLanePercent);
      speedByLaneData.push(currentDensitySpeed);
      // packByLaneData.push(...)
      // packDensityData.push(...) - This would be derived from overall pack calculations

    } // End trafficDensities loop

    // Placeholder for actual data - replace with generated data
    return {
      throughputData: throughputData,
      simulationParams: {
        freewayLength: defaultParams.freewayLength || 10,
        speedLimitRatio: ratio,
        meanTripLength: defaultParams.meanDistTripPlanned,
        tripLengthStdDev: defaultParams.sigmaDistTripPlanned,
        meanDesiredSpeed: defaultParams.meanSpeed,
        desiredSpeedStdDev: defaultParams.stdSpeed,
      },
      lanePercentageData: lanePercentageData,
      speedByLaneData: speedByLaneData,
      packDensityData: [{ trafficDensity: 0, packDensity: 0, avgPackSize: 0 }], // Dummy
      packByLaneData: [{ trafficDensity: 0 }], // Dummy
      speedLimitRatioForTitle: ratio,
    };
  };

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      const data: Record<string, AllChartData> = {};
      for (const ratio of speedLimitRatios) {
        data[String(ratio)] = await generateDataForRatio(ratio);
      }
      setAllGeneratedData(data);
      setIsLoading(false);
    };
    // loadAllData(); // Uncomment to load all data on mount
  }, []);

  const handleGenerateCurrentRatio = async () => {
    setIsLoading(true);
    const ratioKey = String(speedLimitRatios[currentRatioIndex]);
    if (!allGeneratedData[ratioKey]) { // Generate if not already generated
        const newData = await generateDataForRatio(speedLimitRatios[currentRatioIndex]);
        setAllGeneratedData(prev => ({...prev, [ratioKey]: newData}));
    }
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (dashboardRef.current) {
      html2canvas(dashboardRef.current, { useCORS: true, scale: 2 }).then(canvas => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const ratio = speedLimitRatios[currentRatioIndex];
        link.download = `charts_ratio_${String(ratio).replace('.', '_')}.png`;
        link.href = image;
        link.click();
      });
    }
  };

  const currentData = allGeneratedData[String(speedLimitRatios[currentRatioIndex])];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        <Button onClick={() => setCurrentRatioIndex(prev => Math.max(0, prev - 1))} disabled={currentRatioIndex === 0 || isLoading}>
          Previous Ratio
        </Button>
        <span>Speed Limit Ratio: {speedLimitRatios[currentRatioIndex]}</span>
        <Button onClick={() => setCurrentRatioIndex(prev => Math.min(speedLimitRatios.length - 1, prev + 1))} disabled={currentRatioIndex === speedLimitRatios.length - 1 || isLoading}>
          Next Ratio
        </Button>
        <Button onClick={handleGenerateCurrentRatio} disabled={isLoading || !!currentData}>
          {isLoading ? 'Generating...' : (currentData ? 'Data Loaded' : 'Generate Data for this Ratio')}
        </Button>
        <Button onClick={handleDownload} disabled={!currentData || isLoading}>
          Download as PNG
        </Button>
      </div>

      {isLoading && !currentData && <p style={{textAlign: 'center'}}>Loading data for ratio: {speedLimitRatios[currentRatioIndex]}...</p>}

      {currentData ? (
        <div ref={dashboardRef}>
          <ChartsDashboard {...currentData} />
        </div>
      ) : (
        !isLoading && <p style={{textAlign: 'center'}}>Click "Generate Data for this Ratio" to load charts.</p>
      )}
    </div>
  );
};

export default AnalysisPage;
