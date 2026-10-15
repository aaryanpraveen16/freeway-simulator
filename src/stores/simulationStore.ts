import { create } from 'zustand';
import {
  Car,
  Pack,
  SimulationParams,
  defaultParams,
  initializeSimulation,
  calculateStableDuration,
} from '@/utils/trafficSimulation';

export interface SimulationEvent {
  type: 'exit' | 'enter' | 'laneChange';
  carId: number;
  carName: string;
  position: number;
  speed: number;
  lane?: number;
}

export interface BatchSimulation {
  name?: string;
  duration: number;
  params: Partial<SimulationParams>;
  trafficRule?: 'american' | 'european';
  compareRegionalRules?: boolean;
}

interface SimulationState {
  params: SimulationParams;
  cars: Car[];
  laneLength: number;
  isRunning: boolean;
  elapsedTime: number;
  simulationSpeed: number;
  trafficRule: 'american' | 'european';
  stoppedCars: Set<number>;
  currentPacks: Pack[];
  laneChanges: number;

  // Batch Simulation
  batchQueue: BatchSimulation[];
  isBatchProcessing: boolean;
  isBatchPaused: boolean;

  // Worker instance reference
  worker: Worker | null;

  // Actions
  setWorker: (worker: Worker | null) => void;
  setCars: (cars: Car[]) => void;
  setElapsedTime: (time: number) => void;
  setCurrentPacks: (packs: Pack[]) => void;
  setLaneChanges: (updater: number | ((prev: number) => number)) => void;
  setSimulationSpeed: (speed: number) => void;
  setTrafficRule: (rule: 'american' | 'european') => void;
  setStoppedCars: (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setParams: (updater: SimulationParams | ((prev: SimulationParams) => SimulationParams)) => void;
  setIsRunning: (running: boolean) => void;
  setIsBatchPaused: (paused: boolean) => void;
  setIsBatchProcessing: (processing: boolean) => void;
  setBatchQueue: (updater: BatchSimulation[] | ((prev: BatchSimulation[]) => BatchSimulation[])) => void;

  // High level workflow actions
  startSimulation: () => void;
  stopSimulation: () => void;
  toggleSimulation: () => void;
  resetSimulation: (newParams?: SimulationParams) => void;
  stopCar: (carId: number) => void;
  resumeCar: (carId: number) => void;
  updateParams: (newParams: Partial<SimulationParams>) => void;
  addBatchSimulation: (simulations: BatchSimulation[]) => void;
  popBatchQueue: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  params: defaultParams,
  cars: [],
  laneLength: 0,
  isRunning: false,
  elapsedTime: 0,
  simulationSpeed: 1,
  trafficRule: 'american',
  stoppedCars: new Set(),
  currentPacks: [],
  laneChanges: 0,
  batchQueue: [],
  isBatchProcessing: false,
  isBatchPaused: false,
  worker: null,

  setWorker: (worker) => set({ worker }),
  setCars: (cars) => set({ cars }),
  setElapsedTime: (elapsedTime) => set({ elapsedTime }),
  setCurrentPacks: (currentPacks) => set({ currentPacks }),
  setLaneChanges: (updater) =>
    set((state) => ({ laneChanges: typeof updater === 'function' ? updater(state.laneChanges) : updater })),
  setSimulationSpeed: (simulationSpeed) => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'UPDATE_SPEED', data: { speed: simulationSpeed } });
    }
    set({ simulationSpeed });
  },
  setTrafficRule: (trafficRule) => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'UPDATE_TRAFFIC_RULE', data: { rule: trafficRule } });
    }
    set({ trafficRule });
  },
  setStoppedCars: (updater) => {
    const nextStopped = typeof updater === 'function' ? updater(get().stoppedCars) : updater;
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'UPDATE_STOPPED_CARS', data: { stoppedCars: nextStopped } });
    }
    set({ stoppedCars: nextStopped });
  },
  setParams: (updater) => {
    const nextParams = typeof updater === 'function' ? updater(get().params) : updater;
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'UPDATE_PARAMS', data: { params: nextParams } });
    }
    set({ params: nextParams });
  },
  setIsRunning: (isRunning) => set({ isRunning }),
  setIsBatchPaused: (isBatchPaused) => set({ isBatchPaused }),
  setIsBatchProcessing: (isBatchProcessing) => set({ isBatchProcessing }),
  setBatchQueue: (updater) =>
    set((state) => ({ batchQueue: typeof updater === 'function' ? updater(state.batchQueue) : updater })),

  startSimulation: () => {
    const { worker } = get();
    set({ isRunning: true });
    if (worker) {
      worker.postMessage({ type: 'START' });
    }
  },

  stopSimulation: () => {
    const { worker } = get();
    set({ isRunning: false });
    if (worker) {
      worker.postMessage({ type: 'STOP' });
    }
  },

  toggleSimulation: () => {
    const { isRunning, isBatchProcessing, startSimulation, stopSimulation } = get();
    if (isRunning) {
      stopSimulation();
      if (isBatchProcessing) {
        set({ isBatchPaused: true });
      }
    } else {
      startSimulation();
      if (isBatchProcessing) {
        set({ isBatchPaused: false });
      }
    }
  },

  resetSimulation: (customParams?: SimulationParams) => {
    const { worker, trafficRule, simulationSpeed } = get();
    const targetParams = customParams || get().params;

    const { cars: freshCars, laneLength: newLaneLength } = initializeSimulation(targetParams, false);

    set({
      params: targetParams,
      cars: freshCars,
      laneLength: newLaneLength,
      isRunning: false,
      elapsedTime: 0,
      laneChanges: 0,
      stoppedCars: new Set(),
      currentPacks: [],
      isBatchPaused: false,
    });

    if (worker) {
      worker.postMessage({
        type: 'INIT',
        data: {
          cars: freshCars,
          laneLength: newLaneLength,
          params: targetParams,
          trafficRule,
          simulationSpeed,
          showNotifications: false,
          stoppedCars: new Set(),
        },
      });
    }
  },

  stopCar: (carId: number) => {
    const { stoppedCars, worker } = get();
    const next = new Set([...stoppedCars, carId]);
    if (worker) {
      worker.postMessage({ type: 'UPDATE_STOPPED_CARS', data: { stoppedCars: next } });
    }
    set({ stoppedCars: next });
  },

  resumeCar: (carId: number) => {
    const { stoppedCars, worker } = get();
    const next = new Set(stoppedCars);
    next.delete(carId);
    if (worker) {
      worker.postMessage({ type: 'UPDATE_STOPPED_CARS', data: { stoppedCars: next } });
    }
    set({ stoppedCars: next });
  },

  updateParams: (newParams: Partial<SimulationParams>) => {
    const current = get().params;
    const updated = { ...current, ...newParams };
    if (updated.autoCalculateDuration && newParams.trafficDensity !== undefined) {
      updated.simulationDuration = calculateStableDuration(updated.trafficDensity);
    }
    if (newParams.simulationDuration !== undefined && newParams.autoCalculateDuration === undefined) {
      updated.autoCalculateDuration = false;
    }

    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'UPDATE_PARAMS', data: { params: updated } });
    }

    const nextState: Partial<SimulationState> = { params: updated };
    if (newParams.freewayLength !== undefined) {
      nextState.laneLength = newParams.freewayLength;
    }

    set(nextState as any);
  },

  addBatchSimulation: (simulations: BatchSimulation[]) => {
    set((state) => ({
      batchQueue: [...state.batchQueue, ...simulations],
      isBatchProcessing: true,
      isBatchPaused: false,
    }));
  },

  popBatchQueue: () => {
    set((state) => ({
      batchQueue: state.batchQueue.slice(1),
    }));
  },
}));
