import { create } from 'zustand';
import { PackHistoryItem } from '@/components/PackFormationChart';
import { PackLengthHistoryItem } from '@/components/AveragePackLengthChart';
import { SimulationParams, Car, Pack } from '@/utils/trafficSimulation';

export interface LaneThroughputDataPoint {
  time: number;
  lane0?: number;
  lane1?: number;
  lane2?: number;
  lane3?: number;
  [key: string]: number | undefined;
}

export interface DensityThroughputItem {
  density: number;
  throughput: number;
  time: number;
  laneThroughputs: number[];
  laneDensities: number[];
  laneSpeeds: number[];
}

export interface PackFormationHistoryItem {
  density: number;
  speedStdDev: number;
  packCount: number;
  time: number;
}

export interface SpeedDensityItem {
  time: number;
  speed: number;
  density: number;
  trafficRule: string;
  numLanes: number;
  trafficDensity: number;
  speedLimit: number;
  vehicleTypeDensity: any;
  driverTypeDensity: any;
  uniformDriverBehavior: boolean;
}

export interface DensityOfCarPacksDataPoint {
  time: number;
  overallDensity: number;
  averagePackSize: number;
  [key: string]: number;
}

export interface PercentageOfCarsByLaneDataPoint {
  time: number;
  [key: string]: number;
}

export interface LaneUtilizationHistoryItem {
  time: number;
  [key: string]: number;
}

export interface SimulationRun {
  id: string;
  packHistory: PackHistoryItem[];
  packLengthHistory: PackLengthHistoryItem[];
  params: SimulationParams;
  timestamp: number;
  duration: number;
}

const MAX_HISTORY_LENGTH = 300; // Keep last ~5 minutes (at 1.0s interval)

interface MetricsState {
  densityThroughputHistory: DensityThroughputItem[];
  laneThroughputHistory: LaneThroughputDataPoint[];
  packFormationHistory: PackFormationHistoryItem[];
  laneUtilizationHistory: LaneUtilizationHistoryItem[];
  speedDensityHistory: SpeedDensityItem[];
  densityOfCarPacksHistory: DensityOfCarPacksDataPoint[];
  percentageByLaneHistory: PercentageOfCarsByLaneDataPoint[];
  packsPerLaneHistory: any[];
  packHistory: PackHistoryItem[];
  packLengthHistory: PackLengthHistoryItem[];

  // Saved runs
  savedRuns: SimulationRun[];
  showPreviousRuns: boolean;

  // Actions
  recordMetrics: (
    newCars: Car[],
    time: number,
    currentLaneLength: number,
    packs: Pack[],
    params: SimulationParams,
    trafficRule: 'american' | 'european'
  ) => void;
  resetMetrics: () => void;
  setSavedRuns: (runs: SimulationRun[] | ((prev: SimulationRun[]) => SimulationRun[])) => void;
  setShowPreviousRuns: (show: boolean | ((prev: boolean) => boolean)) => void;
  togglePreviousRuns: () => void;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  densityThroughputHistory: [],
  laneThroughputHistory: [],
  packFormationHistory: [],
  laneUtilizationHistory: [],
  speedDensityHistory: [],
  densityOfCarPacksHistory: [],
  percentageByLaneHistory: [],
  packsPerLaneHistory: [],
  packHistory: [],
  packLengthHistory: [],
  savedRuns: [],
  showPreviousRuns: false,

  resetMetrics: () =>
    set({
      densityThroughputHistory: [],
      laneThroughputHistory: [],
      packFormationHistory: [],
      laneUtilizationHistory: [],
      speedDensityHistory: [],
      densityOfCarPacksHistory: [],
      percentageByLaneHistory: [],
      packsPerLaneHistory: [],
      packHistory: [],
      packLengthHistory: [],
    }),

  setShowPreviousRuns: (show) =>
    set((state) => ({ showPreviousRuns: typeof show === 'function' ? show(state.showPreviousRuns) : show })),

  togglePreviousRuns: () =>
    set((state) => ({ showPreviousRuns: !state.showPreviousRuns })),

  setSavedRuns: (runs) =>
    set((state) => ({ savedRuns: typeof runs === 'function' ? runs(state.savedRuns) : runs })),

  recordMetrics: (newCars, time, currentLaneLength, packs, params, trafficRule) => {
    const numLanes = params.numLanes || 3;
    const totalDensity = newCars.length / (currentLaneLength || 1);
    const totalAvgSpeed =
      newCars.length > 0 ? newCars.reduce((sum, car) => sum + car.speed, 0) / newCars.length : 0;
    const totalThroughput = totalAvgSpeed * totalDensity;

    const laneThroughputs: number[] = [];
    const laneDensities: number[] = [];
    const laneSpeeds: number[] = [];

    for (let i = 0; i < numLanes; i++) {
      const laneCars = newCars.filter((car) => car.lane === i);
      const laneCarCount = laneCars.length;
      if (laneCarCount === 0) {
        laneThroughputs.push(0);
        laneDensities.push(0);
        laneSpeeds.push(0);
        continue;
      }
      const laneAvgSpeed = laneCars.reduce((sum, car) => sum + car.speed, 0) / laneCarCount;
      const laneDensity = laneCarCount / (currentLaneLength || 1);
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
      newCars.length > 0
        ? newCars.reduce((sum, car) => sum + Math.pow(car.speed - totalAvgSpeed, 2), 0) / newCars.length
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

    const totalCars = newCars.length;
    const densityOfPacksPoint: any = {
      time: parseFloat(time.toFixed(1)),
      overallDensity: parseFloat(totalDensity.toFixed(2)),
      averagePackSize: packs.length > 0 ? parseFloat((totalCars / packs.length).toFixed(1)) : 0,
    };
    const percentagePoint: any = { time: parseFloat(time.toFixed(1)) };
    const laneDist: any = { time: parseFloat(time.toFixed(1)) };
    const laneTP: any = { time: parseFloat(time.toFixed(1)) };

    for (let i = 0; i < numLanes; i++) {
      const laneCars = newCars.filter((c) => c.lane === i);
      const density = laneCars.length / (currentLaneLength || 1);
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

    set((state) => ({
      densityThroughputHistory: [...state.densityThroughputHistory, densityItem].slice(-MAX_HISTORY_LENGTH),
      speedDensityHistory: [...state.speedDensityHistory, speedDensityItem].slice(-1000),
      packHistory: [...state.packHistory, packItem].slice(-1000),
      packLengthHistory: [...state.packLengthHistory, packLengthItem].slice(-1000),
      packFormationHistory: [...state.packFormationHistory, packFormationItem].slice(-MAX_HISTORY_LENGTH),
      packsPerLaneHistory: [...state.packsPerLaneHistory, packsPerLanePoint].slice(-MAX_HISTORY_LENGTH),
      densityOfCarPacksHistory: [...state.densityOfCarPacksHistory, densityOfPacksPoint].slice(-MAX_HISTORY_LENGTH),
      percentageByLaneHistory: [...state.percentageByLaneHistory, percentagePoint].slice(-MAX_HISTORY_LENGTH),
      laneUtilizationHistory: [...state.laneUtilizationHistory, laneDist].slice(-MAX_HISTORY_LENGTH),
      laneThroughputHistory: [...state.laneThroughputHistory, laneTP].slice(-MAX_HISTORY_LENGTH),
    }));
  },
}));
