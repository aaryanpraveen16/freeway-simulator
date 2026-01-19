import React, { useState, useEffect, useCallback, useRef } from "react";
import TrafficTrack from "@/components/TrafficTrack";
import ControlPanel from "@/components/ControlPanel";
import StickyControlBar from "@/components/StickyControlBar";
import StatsDisplay from "@/components/StatsDisplay";
import CarStatsCard from "@/components/CarStatsCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ChartDashboard from "@/components/ChartDashboard";
import { PackHistoryItem } from "@/components/PackFormationChart";
import { PackLengthHistoryItem } from "@/components/AveragePackLengthChart";
import {
  initializeSimulation,
  updateSimulation,
  defaultParams,
  identifyPacks,
  type SimulationParams,
  type Car,
  type Pack
} from "@/utils/trafficSimulation";
import { simulationService, SavedSimulation } from "@/services/simulationService";
import { useToast } from "@/hooks/use-toast";
import { UnitSystem } from "@/utils/unitConversion";
import { SaveSimulationDialog } from "@/components/SaveSimulationDialog";
import { calculateStabilizedValue, extractDataValues } from "@/utils/stabilizedValueCalculator";
import { useAuth, useUser } from "@clerk/clerk-react";

interface SimulationEvent {
  type: 'exit' | 'enter' | 'laneChange';
  carId: number;
  carName: string;
  position: number;
  speed: number;
  lane?: number;
}

interface BatchSimulation {
  name?: string;
  duration: number;
  params: Partial<SimulationParams>;
  // simulationSpeed?: number;
  // trafficRule?: 'american' | 'european';
}

interface LaneThroughputDataPoint {
  time: number;
  lane0?: number;
  lane1?: number;
  lane2?: number;
  lane3?: number;
  [key: string]: number | undefined;
}

interface SimulationRun {
  id: string;
  packHistory: PackHistoryItem[];
  packLengthHistory: PackLengthHistoryItem[];
  params: SimulationParams;
  timestamp: number;
  duration: number;
}

interface DensityThroughputItem {
  density: number;
  throughput: number;
  time: number;
  laneThroughputs: number[];
  laneDensities: number[];
  laneSpeeds: number[];
}

interface PackFormationHistoryItem {
  density: number;
  speedStdDev: number;
  packCount: number;
  time: number;
}

interface SpeedDensityItem {
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

interface DensityOfCarPacksDataPoint {
  time: number;
  overallDensity: number;
  averagePackSize: number;
  [key: string]: number;
}

interface PercentageOfCarsByLaneDataPoint {
  time: number;
  [key: string]: number;
}

interface LaneUtilizationHistoryItem {
  time: number;
  [key: string]: number;
}

const Index = () => {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [cars, setCars] = useState<Car[]>([]);
  const [laneLength, setLaneLength] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [packHistory, setPackHistory] = useState<PackHistoryItem[]>([]);
  const [packLengthHistory, setPackLengthHistory] = useState<PackLengthHistoryItem[]>([]);
  const [savedRuns, setSavedRuns] = useState<SimulationRun[]>([]);
  const [showPreviousRuns, setShowPreviousRuns] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [trafficRule, setTrafficRule] = useState<'american' | 'european'>('american');
  const [stoppedCars, setStoppedCars] = useState<Set<number>>(new Set());
  const [showPackFormation, setShowPackFormation] = useState<boolean>(true);
  const [laneChanges, setLaneChanges] = useState<number>(0);
  const [carSize, setCarSize] = useState<number>(24);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showFreewayUI, setShowFreewayUI] = useState<boolean>(true);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [saveDialogDefaultName, setSaveDialogDefaultName] = useState<string>("");

  const [densityThroughputHistory, setDensityThroughputHistory] = useState<DensityThroughputItem[]>([]);
  const [laneThroughputHistory, setLaneThroughputHistory] = useState<LaneThroughputDataPoint[]>([]);
  const [packFormationHistory, setPackFormationHistory] = useState<PackFormationHistoryItem[]>([]);
  const [laneUtilizationHistory, setLaneUtilizationHistory] = useState<LaneUtilizationHistoryItem[]>([]);
  const [speedDensityHistory, setSpeedDensityHistory] = useState<SpeedDensityItem[]>([]);
  const [densityOfCarPacksHistory, setDensityOfCarPacksHistory] = useState<DensityOfCarPacksDataPoint[]>([]);
  const [percentageByLaneHistory, setPercentageByLaneHistory] = useState<PercentageOfCarsByLaneDataPoint[]>([]);
  const [packsPerLaneHistory, setPacksPerLaneHistory] = useState<any[]>([]);
  const [currentPacks, setCurrentPacks] = useState<Pack[]>([]);
  const [batchQueue, setBatchQueue] = useState<BatchSimulation[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  const batchQueueRef = useRef<BatchSimulation[]>([]);

  const isBatchProcessingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const batchFolderRef = useRef<string | undefined>(undefined);
  const executeSaveRef = useRef<((name: string, folder?: string) => Promise<any>) | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const lastPackRecordTimeRef = useRef<number>(0);
  const { toast } = useToast();
  const { getToken, userId } = useAuth();
  const { user } = useUser();

  const paramsRef = useRef<SimulationParams>(params);
  const trafficRuleRef = useRef<'american' | 'european'>(trafficRule);
  const simulationSpeedRef = useRef<number>(simulationSpeed);
  const showNotificationsRef = useRef<boolean>(showNotifications);

  const handleSimulationEvents = useCallback((events: SimulationEvent[]) => {
    events.forEach(event => {
      if (showNotifications) {
        if (event.type === 'exit') {
          toast({ title: "Car Exited", description: `${event.carName} has completed its trip.`, variant: "default" });
        } else if (event.type === 'enter') {
          toast({ title: "Car Entered", description: `${event.carName} has entered the freeway.`, variant: "default" });
        } else if (event.type === 'laneChange') {
          setLaneChanges(prev => prev + 1);
          toast({ title: "Lane Change", description: `${event.carName} changed to lane ${event.lane! + 1}.`, variant: "default" });
        }
      } else if (event.type === 'laneChange') {
        setLaneChanges(prev => prev + 1);
      }
    });
  }, [toast, showNotifications]);

  // Optimize history length to prevent FPS drop over time
  const MAX_HISTORY_LENGTH = 300; // Keep last ~5 minutes (at 1.0s interval)

  const recordPackData = useCallback((newCars: Car[], time: number, currentLaneLength: number, packs: Pack[]) => {
    const numLanes = params.numLanes || 3;
    const totalDensity = newCars.length / currentLaneLength;
    const totalAvgSpeed = newCars.length > 0
      ? newCars.reduce((sum, car) => sum + car.speed, 0) / newCars.length
      : 0;
    const totalThroughput = totalAvgSpeed * totalDensity;

    const laneThroughputs: number[] = [];
    const laneDensities: number[] = [];
    const laneSpeeds: number[] = [];

    for (let i = 0; i < numLanes; i++) {
      const laneCars = newCars.filter(car => car.lane === i);
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

    setDensityThroughputHistory(prev => {
      const newHistory = [...prev, {
        density: parseFloat(totalDensity.toFixed(4)),
        throughput: parseFloat(totalThroughput.toFixed(2)),
        time: parseFloat(time.toFixed(1)),
        laneThroughputs,
        laneDensities,
        laneSpeeds
      }];
      return newHistory.length > MAX_HISTORY_LENGTH ? newHistory.slice(-MAX_HISTORY_LENGTH) : newHistory;
    });

    setSpeedDensityHistory(prev => {
      const newHistory = [...prev, {
        time: parseFloat(time.toFixed(1)),
        speed: parseFloat(totalAvgSpeed.toFixed(2)),
        density: parseFloat(totalDensity.toFixed(4)),
        trafficRule,
        numLanes,
        trafficDensity: params.trafficDensity,
        speedLimit: params.speedLimit,
        vehicleTypeDensity: params.vehicleTypeDensity,
        driverTypeDensity: params.driverTypeDensity,
        uniformDriverBehavior: params.uniformDriverBehavior || false
      }];
      return newHistory.length > 1000 ? newHistory.slice(-1000) : newHistory;
    });

    // We no longer calculate packs here, we use the ones passed from the worker
    // setCurrentPacks(packs); // Already set in onmessage for smoother UI
    const smallPacks = packs.filter(p => p.cars.length < 5).length;
    const mediumPacks = packs.filter(p => p.cars.length >= 5 && p.cars.length <= 10).length;
    const largePacks = packs.filter(p => p.cars.length > 10).length;
    const averagePackLength = packs.length > 0 ? packs.reduce((sum, p) => sum + p.cars.length, 0) / packs.length : 0;

    setPackHistory(prev => {
      const newHistory = [...prev, {
        time: parseFloat(time.toFixed(1)),
        packCount: packs.length,
        smallPacks,
        mediumPacks,
        largePacks
      }];
      return newHistory.length > 1000 ? newHistory.slice(-1000) : newHistory;
    });

    setPackLengthHistory(prev => {
      const newHistory = [...prev, {
        time: parseFloat(time.toFixed(1)),
        averageLength: parseFloat(averagePackLength.toFixed(2))
      }];
      return newHistory.length > 1000 ? newHistory.slice(-1000) : newHistory;
    });

    setPacksPerLaneHistory(prev => {
      const packsPerLane: any = { time: parseFloat(time.toFixed(1)) };
      for (let i = 0; i < numLanes; i++) packsPerLane[`lane${i}`] = 0;
      packs.forEach(pack => {
        const laneCounts: any = {};
        pack.cars.forEach(c => laneCounts[c.lane] = (laneCounts[c.lane] || 0) + 1);
        let max = 0, dominant = pack.cars[pack.cars.length - 1].lane;
        Object.entries(laneCounts).forEach(([l, c]: [any, any]) => {
          if (c > max) { max = c; dominant = parseInt(l); }
        });
        packsPerLane[`lane${dominant}`]++;
      });
      return [...prev, packsPerLane].slice(-1000);
    });

    const speedVariance = newCars.length > 0
      ? newCars.reduce((sum, car) => sum + Math.pow(car.speed - totalAvgSpeed, 2), 0) / newCars.length
      : 0;

    setPacksPerLaneHistory(prev => {
      const point: any = { time: parseFloat(time.toFixed(1)) };
      const lanePackCounts = new Array(numLanes).fill(0);

      packs.forEach(pack => {
        if (pack.cars.length > 0) {
          lanePackCounts[pack.cars[0].lane]++;
        }
      });

      lanePackCounts.forEach((count, i) => {
        point[`lane${i}`] = count;
      });

      return [...prev, point].slice(-MAX_HISTORY_LENGTH);
    });

    setPackFormationHistory(prev => {
      return [...prev, {
        density: parseFloat(totalDensity.toFixed(4)),
        speedStdDev: parseFloat(Math.sqrt(speedVariance).toFixed(2)),
        packCount: packs.length,
        time: parseFloat(time.toFixed(1))
      }].slice(-MAX_HISTORY_LENGTH);
    });

    const totalCars = newCars.length;
    const dataPoint: any = { time: parseFloat(time.toFixed(1)), overallDensity: parseFloat(totalDensity.toFixed(2)), averagePackSize: packs.length > 0 ? parseFloat((totalCars / packs.length).toFixed(1)) : 0 };
    const percentagePoint: any = { time: parseFloat(time.toFixed(1)) };
    const laneDist: any = { time: parseFloat(time.toFixed(1)) };
    const laneTP: any = { time: parseFloat(time.toFixed(1)) };

    for (let i = 0; i < numLanes; i++) {
      const laneCars = newCars.filter(c => c.lane === i);
      const density = laneCars.length / currentLaneLength;
      dataPoint[`lane${i}Density`] = parseFloat(density.toFixed(2));
      const pct = totalCars > 0 ? parseFloat(((laneCars.length / totalCars) * 100).toFixed(1)) : 0;
      percentagePoint[`lane${i}`] = pct;
      laneDist[`lane${i}`] = pct;
      if (laneCars.length > 0) {
        const speed = laneCars.reduce((s, c) => s + c.speed, 0) / laneCars.length;
        laneTP[`lane${i}`] = parseFloat((speed * density).toFixed(2));
      } else laneTP[`lane${i}`] = 0;
    }

    setDensityOfCarPacksHistory(prev => [...prev, dataPoint].slice(-MAX_HISTORY_LENGTH));
    setPercentageByLaneHistory(prev => [...prev, percentagePoint].slice(-MAX_HISTORY_LENGTH));
    setLaneUtilizationHistory(prev => [...prev, laneDist].slice(-MAX_HISTORY_LENGTH));
    setLaneThroughputHistory(prev => [...prev, laneTP].slice(-MAX_HISTORY_LENGTH));

    lastPackRecordTimeRef.current = time;
  }, [params, trafficRule]);

  // Stable refs for callbacks used in worker and batch logic
  const handleSimulationEventsRef = useRef<typeof handleSimulationEvents | null>(null);
  const recordPackDataRef = useRef<typeof recordPackData | null>(null);
  const laneLengthRef = useRef<number>(laneLength);

  useEffect(() => { handleSimulationEventsRef.current = handleSimulationEvents; }, [handleSimulationEvents]);
  useEffect(() => { recordPackDataRef.current = recordPackData; }, [recordPackData]);
  useEffect(() => { laneLengthRef.current = laneLength; }, [laneLength]);
  useEffect(() => { batchQueueRef.current = batchQueue; }, [batchQueue]);
  useEffect(() => { isBatchProcessingRef.current = isBatchProcessing; }, [isBatchProcessing]);

  const initSimulation = useCallback(() => {
    const { cars: freshCars, laneLength: newLaneLength } = initializeSimulation(params, showNotifications);
    setCars(freshCars);
    setLaneLength(newLaneLength);
    setElapsedTime(0);
    setPackHistory([]);
    setPackLengthHistory([]);
    setSpeedDensityHistory([]);
    setDensityOfCarPacksHistory([]);
    setPercentageByLaneHistory([]);
    setPacksPerLaneHistory([]);
    lastPackRecordTimeRef.current = 0;

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'INIT',
        data: {
          cars: freshCars,
          laneLength: newLaneLength,
          params,
          trafficRule,
          simulationSpeed,
          showNotifications
        }
      });
    }
  }, [params, trafficRule, simulationSpeed, showNotifications]);

  const resetSimulation = useCallback((newParams: SimulationParams) => {
    setIsRunning(false);
    setStoppedCars(new Set());
    setDensityThroughputHistory([]);
    setLaneThroughputHistory([]);
    setPackFormationHistory([]);
    setLaneUtilizationHistory([]);
    setSpeedDensityHistory([]);
    setDensityOfCarPacksHistory([]);
    setPercentageByLaneHistory([]);
    setPacksPerLaneHistory([]);
    setLaneChanges(0);
    setElapsedTime(0);
    setPackHistory([]);
    setPackLengthHistory([]);
    lastPackRecordTimeRef.current = 0;

    const { cars: freshCars, laneLength: newLaneLength } = initializeSimulation(newParams, showNotifications);
    setCars(freshCars);
    setLaneLength(newLaneLength);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'INIT',
        data: {
          cars: freshCars,
          laneLength: newLaneLength,
          params: newParams,
          trafficRule,
          simulationSpeed,
          showNotifications,
          stoppedCars: new Set()
        }
      });
    }
  }, [trafficRule, simulationSpeed, showNotifications]);

  // Handle URL parameters on mount
  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    if (searchParams.toString() === "") return;

    const urlParams: Partial<SimulationParams> = {};
    const booleanParams = ['uniformDriverBehavior'];
    const numberParams = [
      'numLanes', 'freewayLength', 'trafficDensity', 'simulationDuration',
      'meanSpeed', 'stdSpeed', 'aMax', 'bMax', 'tDist', 'sigmaDistTripPlanned',
      'meanDistTripPlanned', 'driverReactionTime', 'brakingReactionTime',
      'laneChangeCooldown', 'mobilSafeDecel', 'mobilSelfSafeDecel',
      'mobilPoliteness', 'mobilSpeedGainThreshold', 'mobilStoppedIncentive'
    ];

    searchParams.forEach((value, key) => {
      if (numberParams.includes(key)) (urlParams as any)[key] = parseFloat(value);
      else if (booleanParams.includes(key)) (urlParams as any)[key] = (value === 'true');
      else if (key === 'trafficRule' && (value === 'american' || value === 'european')) setTrafficRule(value as any);
      else if (key.startsWith('vehicleTypeDensity.')) {
        const type = key.split('.')[1] as 'car' | 'truck' | 'motorcycle';
        if (!urlParams.vehicleTypeDensity) urlParams.vehicleTypeDensity = { ...params.vehicleTypeDensity };
        urlParams.vehicleTypeDensity[type] = parseInt(value);
      }
    });

    if (Object.keys(urlParams).length > 0) {
      const newParams = { ...defaultParams, ...urlParams };
      setParams(newParams);
      resetSimulation(newParams);
      if (urlParams.simulationDuration && urlParams.simulationDuration > 0) {
        setTimeout(() => {
          setIsRunning(true);
          if (workerRef.current) workerRef.current.postMessage({ type: 'START' });
        }, 1000);
      }
    }
  }, []);

  // Initialize worker on mount
  useEffect(() => {
    const worker = new Worker(new URL('../utils/simulation.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === 'TICK') {
        setCars(data.cars);
        setElapsedTime(data.time);

        // Use packs from worker for the current display
        if (data.packs) {
          setCurrentPacks(data.packs);
        }

        if (data.events && data.events.length > 0 && handleSimulationEventsRef.current) {
          handleSimulationEventsRef.current(data.events);
        }

        // Throttled history recording
        if (data.metrics && recordPackDataRef.current) {
          recordPackDataRef.current(data.cars, data.time, laneLengthRef.current, data.packs || []);
        }
      } else if (type === 'COMPLETED') {
        setIsRunning(false);
        if (isBatchProcessingRef.current && batchQueueRef.current.length > 0) {
          const finishedSim = batchQueueRef.current[0];
          const name = finishedSim.name || `Batch Sim ${Date.now()}`;

          toast({ title: "Simulation Complete", description: `Saving "${name}" and starting next scenario...` });

          if (executeSaveRef.current) {
            executeSaveRef.current(name, batchFolderRef.current || "Batch Results").then(() => {
              // Remove the completed simulation from the queue
              setBatchQueue(prev => prev.slice(1));
            });
          }
        }
      }
    };

    // Initial setup using refs if they are already initialized, otherwise state
    const { cars: freshCars, laneLength: newLaneLength } = initializeSimulation(paramsRef.current, showNotificationsRef.current);
    setCars(freshCars);
    setLaneLength(newLaneLength);

    worker.postMessage({
      type: 'INIT',
      data: {
        cars: freshCars,
        laneLength: newLaneLength,
        params: paramsRef.current,
        trafficRule: trafficRuleRef.current,
        simulationSpeed: simulationSpeedRef.current,
        showNotifications: showNotificationsRef.current
      }
    });

    return () => worker.terminate();
  }, []); // Run ONLY once on mount

  // Sync state changes to worker
  useEffect(() => { if (workerRef.current) workerRef.current.postMessage({ type: 'UPDATE_PARAMS', data: { params } }); paramsRef.current = params; }, [params]);
  useEffect(() => { if (workerRef.current) workerRef.current.postMessage({ type: 'UPDATE_SPEED', data: { speed: simulationSpeed } }); simulationSpeedRef.current = simulationSpeed; }, [simulationSpeed]);
  useEffect(() => { if (workerRef.current) workerRef.current.postMessage({ type: 'UPDATE_TRAFFIC_RULE', data: { rule: trafficRule } }); trafficRuleRef.current = trafficRule; }, [trafficRule]);
  useEffect(() => { if (workerRef.current) workerRef.current.postMessage({ type: 'UPDATE_STOPPED_CARS', data: { stoppedCars } }); }, [stoppedCars]);
  useEffect(() => { if (workerRef.current) workerRef.current.postMessage({ type: 'UPDATE_SHOW_NOTIFICATIONS', data: { showNotifications } }); }, [showNotifications]);

  // Handle batch simulation progression
  useEffect(() => {
    if (isBatchProcessing && batchQueue.length > 0 && !isRunning && !isStartingRef.current) {
      console.log('Starting next batch item:', batchQueue[0]);
      isStartingRef.current = true;

      const currentSim = batchQueue[0];
      // Build parameters for the next run
      const newParams = { ...defaultParams, ...currentSim.params };
      if (currentSim.duration) newParams.simulationDuration = currentSim.duration;

      // Reset state and notify worker
      setParams(newParams);
      resetSimulation(newParams);

      // Small delay to ensure initialization is clean
      const timer = setTimeout(() => {
        setIsRunning(true);
        isStartingRef.current = false;
        if (workerRef.current) workerRef.current.postMessage({ type: 'START' });
      }, 1500); // Slightly longer delay for safety

      return () => {
        clearTimeout(timer);
        isStartingRef.current = false;
      };
    } else if (isBatchProcessing && batchQueue.length === 0 && !isRunning && !isStartingRef.current) {
      setIsBatchProcessing(false);
      toast({
        title: "Batch Complete",
        description: "All simulations in the batch have been successfully completed and saved.",
      });
    }
  }, [batchQueue, isBatchProcessing, isRunning, resetSimulation, toast]);

  const handleUpdateParams = useCallback((newParams: Partial<SimulationParams>, autoStart?: boolean) => {
    if (autoStart) {
      if (batchQueue.length === 0) {
        batchFolderRef.current = `Batch - ${new Date().toLocaleString()}`;
      }
      const singleBatch: BatchSimulation = {
        name: `Imported Sim ${new Date().toLocaleTimeString()}`,
        duration: newParams.simulationDuration || params.simulationDuration || 60,
        params: newParams
      };
      setBatchQueue(prev => [...prev, singleBatch]);
      setIsBatchProcessing(true);
    } else {
      setParams(prev => ({ ...prev, ...newParams }));
    }
  }, [params, batchQueue.length]);
  const handleReset = useCallback(() => { resetSimulation(params); }, [resetSimulation, params]);
  const toggleSimulation = useCallback(() => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    if (workerRef.current) workerRef.current.postMessage({ type: nextRunning ? 'START' : 'STOP' });
  }, [isRunning]);

  const handleStopCar = useCallback((carId: number) => {
    setStoppedCars(prev => new Set([...prev, carId]));
    if (showNotifications) toast({ title: "Car Stopped", description: `Car ${carId + 1} stopped for testing.` });
  }, [toast, showNotifications]);

  const handleResumeCar = useCallback((carId: number) => {
    setStoppedCars(prev => { const next = new Set(prev); next.delete(carId); return next; });
    if (showNotifications) toast({ title: "Car Resumed", description: `Car ${carId + 1} resumed movement.` });
  }, [toast, showNotifications]);

  const handleSaveCurrentRun = useCallback(() => {
    if (packHistory.length === 0) {
      if (showNotifications) toast({ title: "Nothing to Save", description: "Run the simulation first." });
      return;
    }
    const newRun: SimulationRun = { id: `run-${Date.now()}`, packHistory: [...packHistory], packLengthHistory: [...packLengthHistory], params: { ...params }, timestamp: Date.now(), duration: elapsedTime };
    setSavedRuns(prev => {
      const updated = [...prev, newRun].slice(-5);
      localStorage.setItem('freewaySimulator_savedRuns', JSON.stringify(updated));
      return updated;
    });
    if (showNotifications) toast({ title: "Run Saved", description: "Current run saved locally." });
  }, [packHistory, packLengthHistory, params, elapsedTime, toast, showNotifications]);

  const executeSave = useCallback(async (name: string, folder?: string) => {
    if (elapsedTime === 0 || cars.length === 0) return;
    try {
      const token = await getToken();
      const simulationNumber = await simulationService.getNextSimulationNumber(token || undefined);
      const speeds = cars.map(car => car.speed);
      const avgSpeed = speeds.length > 0 ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length : 0;
      const laneStats = [];
      for (let i = 0; i < (params.numLanes || 3); i++) {
        const lc = cars.filter(c => c.lane === i);
        if (lc.length === 0) { laneStats.push(0); continue; }
        laneStats.push(parseFloat(((lc.reduce((s, c) => s + c.speed, 0) / lc.length) * (lc.length / (params.freewayLength || 1))).toFixed(2)));
      }
      const densityHistory = extractDataValues(densityThroughputHistory, 'density');
      const speedHistory = extractDataValues(speedDensityHistory, 'speed');
      const throughputHistory = extractDataValues(densityThroughputHistory, 'throughput');

      const stabilizedDensity = calculateStabilizedValue(densityHistory).value;
      const stabilizedAverageSpeed = calculateStabilizedValue(speedHistory).value;
      const stabilizedThroughput = calculateStabilizedValue(throughputHistory).value;

      const savedDoc: SavedSimulation = {
        id: `simulation-${Date.now()}`,
        name,
        folder,
        timestamp: Date.now(),
        simulationNumber,
        params: { ...params },
        trafficRule,
        chartData: {
          speedByLaneHistory: [...speedDensityHistory],
          densityOfCarPacksHistory: [...densityOfCarPacksHistory],
          percentageByLaneHistory: [...percentageByLaneHistory],
          densityThroughputHistory: [...densityThroughputHistory],
          laneThroughputHistory: [...laneThroughputHistory],
          laneUtilizationHistory: [...laneUtilizationHistory],
          packHistory: [...packHistory],
          packLengthHistory: [...packLengthHistory],
          packsPerLaneHistory: [...packsPerLaneHistory]
        },
        duration: elapsedTime,
        finalStats: {
          totalCars: cars.length,
          averageSpeed: parseFloat(avgSpeed.toFixed(1)),
          maxSpeed: Math.max(...speeds, 0),
          minSpeed: Math.min(...speeds, 0),
          laneChanges,
          perLaneThroughputs: laneStats,
          stabilizedDensity,
          stabilizedAverageSpeed,
          stabilizedThroughput
        },
        createdBy: userId || undefined,
        creatorName: user?.fullName || undefined
      };
      const result = await simulationService.saveSimulation(savedDoc, token || undefined);
      if (showNotifications) toast({ title: "Simulation Saved", description: `"${name}" saved successfully.` });
      return result;
    } catch (e) {
      console.error('Save error:', e);
      const errorMessage = e instanceof Error ? e.message : '';
      if (errorMessage.includes('401')) {
        toast({
          title: "SignIn Required",
          description: "Please sign in using the button in the top right to save simulations.",
          variant: "destructive",
        });
      } else {
        if (showNotifications) toast({ title: "Save Failed", description: "Failed to save simulation to server.", variant: "destructive" });
      }
      return null;
    }
  }, [elapsedTime, cars, params, trafficRule, speedDensityHistory, densityOfCarPacksHistory, percentageByLaneHistory, densityThroughputHistory, laneThroughputHistory, laneUtilizationHistory, packHistory, packLengthHistory, packsPerLaneHistory, laneChanges, toast, showNotifications, getToken, userId, user?.fullName]);
  useEffect(() => { executeSaveRef.current = executeSave; }, [executeSave]);

  const onSaveClick = () => {
    if (!userId) {
      toast({
        title: "Sign In Required",
        description: "You must be signed in to save simulations to the cloud. Please use the Sign In button in the navigation bar.",
        variant: "destructive",
      });
      return;
    }
    setSaveDialogDefaultName(`Simulation ${new Date().toLocaleTimeString()}`);
    setShowSaveDialog(true);
  };
  const togglePreviousRuns = () => setShowPreviousRuns(p => !p);

  // Keep a ref to the latest handleSaveSimulation so the animation loop can call it
  // const saveSimulationRef = useRef(handleSaveSimulation);
  // useEffect(() => {
  //   saveSimulationRef.current = handleSaveSimulation;
  // }, [handleSaveSimulation]);

  // const handleBatchImport = useCallback((simulations: BatchSimulation[]) => {
  //   console.log('Starting batch import:', simulations);

  //   let currentIndex = 0;

  //   const runNextSimulation = () => {
  //     if (currentIndex >= simulations.length) {
  //       console.log('All batch simulations completed');
  //       if (showNotifications) {
  //         toast({
  //           title: "Batch Complete",
  //           description: `All ${simulations.length} simulations have been completed.`,
  //           variant: "default",
  //         });
  //       }
  //       return;
  //     }

  //     const simulation = simulations[currentIndex];
  //     console.log(`Starting simulation ${currentIndex + 1}/${simulations.length}:`, simulation);

  //     // Save original app state so we can restore it after the batch run
  //     batchControllerRef.current.originalParams = params;
  //     batchControllerRef.current.originalSimulationSpeed = simulationSpeed;
  

  //     // Update parameters and reset simulation
  //     const mergedParams = { ...params, ...simulation.params };
  //     paramsRef.current = mergedParams;
  //     setParams(mergedParams);
  //     resetSimulation(mergedParams);

  //     // Apply batch-specific simulation speed if provided
  //     if (simulation.simulationSpeed !== undefined) {
  //       setSimulationSpeed(simulation.simulationSpeed);
  //     }

  //     // Prepare batch controller and continuation
  //     const name = simulation.name || `Batch Sim ${currentIndex + 1}`;
  //     batchControllerRef.current.currentName = name;
  //     batchControllerRef.current.next = () => {
  //       currentIndex += 1;
  //       // slight pause between runs
  //       setTimeout(runNextSimulation, 1000);
  //     };

  //     // Set the target simulated end time and start the run after a short delay
  //     // allow React to apply state updates for speed/trafficRule
  //     setTimeout(() => {
  //       const currentSimTime = simulationRef.current.elapsedTime || 0;
  //       batchControllerRef.current.targetSimTime = currentSimTime + simulation.duration;
  //       batchControllerRef.current.active = true;
  //       setIsRunning(true);
  //     }, 50);
  //   };

  //   // expose the runner then start
  //   runNextSimulation();
  // }, [params, resetSimulation, handleSaveSimulation, toast]);

  const handleBatchImport = useCallback((simulations: BatchSimulation[]) => {
    if (batchQueue.length === 0) {
      batchFolderRef.current = `Batch - ${new Date().toLocaleString()}`;
    }
    toast({
      title: simulations.length > 1 ? "Batch Added" : "Simulation Added",
      description: `Queued ${simulations.length} simulations.`,
    });
    setBatchQueue(prev => [...prev, ...simulations]);
    setIsBatchProcessing(true);
  }, [toast, batchQueue.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar onSaveSimulation={onSaveClick} canSave={packHistory.length > 0} unitSystem={unitSystem} onUnitSystemChange={setUnitSystem} showNotifications={showNotifications} onNotificationsToggle={setShowNotifications} userId={userId} />
      <StickyControlBar isRunning={isRunning} onToggleSimulation={toggleSimulation} onReset={handleReset} setSimulationSpeed={setSimulationSpeed} showPackFormation={showPackFormation} onTogglePackFormation={setShowPackFormation} onSaveSimulation={onSaveClick} canSave={elapsedTime > 0 && cars.length > 0} userId={userId} />
      <SaveSimulationDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} onSave={executeSave} defaultName={saveDialogDefaultName} />
      <div className="w-full py-8 pt-16">
        {showFreewayUI ? (
          <div className="w-full mb-8">
            <TrafficTrack cars={cars} packs={currentPacks} laneLength={laneLength} numLanes={params.numLanes} stoppedCars={stoppedCars} onStopCar={handleStopCar} onResumeCar={handleResumeCar} carSize={carSize} unitSystem={unitSystem} currentTime={elapsedTime} />
          </div>
        ) : (
          <div className="w-full mb-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Performance Mode Active</h3>
              <p className="text-blue-700 max-w-md">Visualization is disabled. Simulation and charts are still running.</p>
              <button onClick={() => setShowFreewayUI(true)} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 underline transition-colors">Re-enable Visualization</button>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1"><StatsDisplay cars={cars} laneLength={laneLength} elapsedTime={elapsedTime} laneChanges={laneChanges} unitSystem={unitSystem} trafficDensity={params.trafficDensity} /></div>
            <div className="flex-1"><CarStatsCard cars={cars} laneLength={laneLength} params={params} showPackInfo={showPackFormation} unitSystem={unitSystem} /></div>
          </div>
          <div><ControlPanel params={params} onUpdateParams={handleUpdateParams} onBatchImport={handleBatchImport} trafficRule={trafficRule} onTrafficRuleChange={setTrafficRule} carSize={carSize} onCarSizeChange={setCarSize} unitSystem={unitSystem} onUnitSystemChange={setUnitSystem} showFreewayUI={showFreewayUI} onShowFreewayUIChange={setShowFreewayUI} /></div>
          <div><ChartDashboard laneLength={laneLength} params={params} trafficRule={trafficRule} unitSystem={unitSystem} speedDensityHistory={speedDensityHistory} densityOfCarPacksHistory={densityOfCarPacksHistory} percentageByLaneHistory={percentageByLaneHistory} densityThroughputHistory={densityThroughputHistory} laneThroughputHistory={laneThroughputHistory} laneUtilizationHistory={laneUtilizationHistory} packHistory={packHistory} packLengthHistory={packLengthHistory} packsPerLaneHistory={packsPerLaneHistory} showPackFormation={showPackFormation} previousRunsData={savedRuns.map(r => r.packHistory)} previousRunsPackLengthData={savedRuns.map(r => r.packLengthHistory)} onSaveCurrentRun={handleSaveCurrentRun} onTogglePreviousRuns={togglePreviousRuns} showPreviousRuns={showPreviousRuns} /></div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
