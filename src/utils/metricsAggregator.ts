import { Car, Pack, SimulationParams } from './trafficSimulation';
import {
  DensityThroughputItem,
  SpeedDensityItem,
  PackHistoryItem,
  PackLengthHistoryItem,
  PackFormationHistoryItem,
  DensityOfCarPacksDataPoint,
  PercentageOfCarsByLaneDataPoint,
  LaneUtilizationHistoryItem,
  LaneThroughputDataPoint,
} from '@/stores/metricsStore';

export interface AggregatedMetricsSnapshot {
  densityItem: DensityThroughputItem;
  speedDensityItem: SpeedDensityItem;
  packItem: PackHistoryItem;
  packLengthItem: PackLengthHistoryItem;
  packFormationItem: PackFormationHistoryItem;
  packsPerLanePoint: any;
  densityOfPacksPoint: DensityOfCarPacksDataPoint;
  percentagePoint: PercentageOfCarsByLaneDataPoint;
  laneDist: LaneUtilizationHistoryItem;
  laneTP: LaneThroughputDataPoint;
}

/**
 * Pure aggregation function executed inside the Web Worker once every interval (e.g. 1.0s).
 * Offloads heavy reductions, standard deviations, and array calculations off the React UI thread.
 */
export function computeMetricsSnapshot(
  cars: Car[],
  time: number,
  laneLength: number,
  packs: Pack[],
  params: SimulationParams,
  trafficRule: 'american' | 'european'
): AggregatedMetricsSnapshot {
  const numLanes = params.numLanes || 3;
  const currentLaneLength = laneLength || 1;
  const totalCars = cars.length;

  const totalDensity = totalCars / currentLaneLength;
  const totalAvgSpeed =
    totalCars > 0 ? cars.reduce((sum, car) => sum + car.speed, 0) / totalCars : 0;
  const totalThroughput = totalAvgSpeed * totalDensity;

  const laneThroughputs: number[] = [];
  const laneDensities: number[] = [];
  const laneSpeeds: number[] = [];

  for (let i = 0; i < numLanes; i++) {
    const laneCars = cars.filter((car) => car.lane === i);
    const laneCarCount = laneCars.length;
    if (laneCarCount === 0) {
      laneThroughputs.push(0);
      laneDensities.push(0);
      laneSpeeds.push(0);
      continue;
    }
    const laneAvgSpeed = laneCars.reduce((sum, car) => sum + car.speed, 0) / laneCarCount;
    const laneDensity = laneCarCount / currentLaneLength;
    laneThroughputs.push(parseFloat((laneAvgSpeed * laneDensity).toFixed(2)));
    laneDensities.push(parseFloat(laneDensity.toFixed(4)));
    laneSpeeds.push(parseFloat(laneAvgSpeed.toFixed(2)));
  }

  const densityItem: DensityThroughputItem = {
    density: parseFloat(totalDensity.toFixed(4)),
    throughput: parseFloat(totalThroughput.toFixed(2)),
    time: parseFloat(time.toFixed(1)),
    laneThroughputs,
    laneDensities,
    laneSpeeds,
  };

  const speedDensityItem: SpeedDensityItem = {
    time: parseFloat(time.toFixed(1)),
    speed: parseFloat(totalAvgSpeed.toFixed(2)),
    density: parseFloat(totalDensity.toFixed(4)),
    trafficRule,
    numLanes,
    trafficDensity: params.trafficDensity,
    speedLimit: params.speedLimit,
    vehicleTypeDensity: params.vehicleTypeDensity,
    driverTypeDensity: params.driverTypeDensity,
    uniformDriverBehavior: params.uniformDriverBehavior || false,
  };

  const smallPacks = packs.filter((p) => p.cars.length < 5).length;
  const mediumPacks = packs.filter((p) => p.cars.length >= 5 && p.cars.length <= 10).length;
  const largePacks = packs.filter((p) => p.cars.length > 10).length;
  const averagePackLength =
    packs.length > 0 ? packs.reduce((sum, p) => sum + p.cars.length, 0) / packs.length : 0;

  const packItem: PackHistoryItem = {
    time: parseFloat(time.toFixed(1)),
    packCount: packs.length,
    smallPacks,
    mediumPacks,
    largePacks,
  };

  const packLengthItem: PackLengthHistoryItem = {
    time: parseFloat(time.toFixed(1)),
    averageLength: parseFloat(averagePackLength.toFixed(2)),
  };

  const speedVariance =
    totalCars > 0
      ? cars.reduce((sum, car) => sum + Math.pow(car.speed - totalAvgSpeed, 2), 0) / totalCars
      : 0;

  const packFormationItem: PackFormationHistoryItem = {
    density: parseFloat(totalDensity.toFixed(4)),
    speedStdDev: parseFloat(Math.sqrt(speedVariance).toFixed(2)),
    packCount: packs.length,
    time: parseFloat(time.toFixed(1)),
  };

  const lanePackCounts = new Array(numLanes).fill(0);
  packs.forEach((pack) => {
    if (pack.cars.length > 0) {
      lanePackCounts[pack.cars[0].lane]++;
    }
  });

  const packsPerLanePoint: any = { time: parseFloat(time.toFixed(1)) };
  lanePackCounts.forEach((count, i) => {
    packsPerLanePoint[`lane${i}`] = count;
  });

  const densityOfPacksPoint: any = {
    time: parseFloat(time.toFixed(1)),
    overallDensity: parseFloat(totalDensity.toFixed(2)),
    averagePackSize: packs.length > 0 ? parseFloat((totalCars / packs.length).toFixed(1)) : 0,
  };
  const percentagePoint: any = { time: parseFloat(time.toFixed(1)) };
  const laneDist: any = { time: parseFloat(time.toFixed(1)) };
  const laneTP: any = { time: parseFloat(time.toFixed(1)) };

  for (let i = 0; i < numLanes; i++) {
    const laneCars = cars.filter((c) => c.lane === i);
    const density = laneCars.length / currentLaneLength;
    densityOfPacksPoint[`lane${i}Density`] = parseFloat(density.toFixed(2));
    const pct = totalCars > 0 ? parseFloat(((laneCars.length / totalCars) * 100).toFixed(1)) : 0;
    percentagePoint[`lane${i}`] = pct;
    laneDist[`lane${i}`] = pct;
    if (laneCars.length > 0) {
      const speed = laneCars.reduce((s, c) => s + c.speed, 0) / laneCars.length;
      laneTP[`lane${i}`] = parseFloat((speed * density).toFixed(2));
    } else {
      laneTP[`lane${i}`] = 0;
    }
  }

  return {
    densityItem,
    speedDensityItem,
    packItem,
    packLengthItem,
    packFormationItem,
    packsPerLanePoint,
    densityOfPacksPoint,
    percentagePoint,
    laneDist,
    laneTP,
  };
}
