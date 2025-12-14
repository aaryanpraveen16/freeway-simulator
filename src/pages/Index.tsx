import React, { useState, useEffect, useCallback, useRef } from "react";
import TrafficTrack from "@/components/TrafficTrack";
import ControlPanel from "@/components/ControlPanel";
import StickyControlBar from "@/components/StickyControlBar";
import StatsDisplay from "@/components/StatsDisplay";
import CarStatsCard from "@/components/CarStatsCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ChartDashboard from "@/components/ChartDashboard";
import PackFormationChart, { PackHistoryItem } from "@/components/PackFormationChart";
import AveragePackLengthChart, { PackLengthHistoryItem } from "@/components/AveragePackLengthChart";
import PackDensityChart, { calculatePackDensityMetrics, PackDensityItem } from "@/components/PackDensityChart";
import DensityThroughputChart from "@/components/DensityThroughputChart";
import LaneThroughputChart from "@/components/LaneThroughputChart";
import LaneUtilizationChart from "@/components/LaneUtilizationChart";
import SpeedByLaneChart from "@/components/SpeedByLaneChart";
import PercentageOfCarsByLaneChart from "@/components/PercentageOfCarsByLaneChart";
import {
  initializeSimulation,
  updateSimulation,
  defaultParams,
  identifyPacks,
  type SimulationParams,
  type Car
} from "@/utils/trafficSimulation";
import { simulationService, SavedSimulation } from "@/services/simulationService";
import { useToast } from "@/hooks/use-toast";
import { UnitSystem } from "@/utils/unitConversion";
import { SaveSimulationDialog } from "@/components/SaveSimulationDialog";
import { calculateStabilizedValue, extractDataValues } from "@/utils/stabilizedValueCalculator";

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

interface PackFormationDataPoint {
  density: number;
  speedStdDev: number;
  packCount: number;
  time: number;
}

interface LaneUtilizationDataPoint {
  time: number;
  [key: string]: number; // Dynamic lane keys like "lane0", "lane1", etc.
}

interface SpeedByLaneDataPoint {
  time: number;
  overallAvgSpeed: number;
  [key: string]: number;
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

const Index = () => {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [cars, setCars] = useState<Car[]>([]);
  const [laneLength, setLaneLength] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [packHistory, setPackHistory] = useState<PackHistoryItem[]>([]);
  const [packLengthHistory, setPackLengthHistory] = useState<PackLengthHistoryItem[]>([]);
  const [packDensityData, setPackDensityData] = useState<PackDensityItem[]>([]);
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
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [saveDialogDefaultName, setSaveDialogDefaultName] = useState<string>("");

  // Chart history state variables - moved here to be declared before use
  const [densityThroughputHistory, setDensityThroughputHistory] = useState<any[]>([]);
  const [laneThroughputHistory, setLaneThroughputHistory] = useState<LaneThroughputDataPoint[]>([]);
  const [packFormationHistory, setPackFormationHistory] = useState<any[]>([]);
  const [laneUtilizationHistory, setLaneUtilizationHistory] = useState<any[]>([]);
  const [speedDensityHistory, setSpeedDensityHistory] = useState<any[]>([]);
  const [densityOfCarPacksHistory, setDensityOfCarPacksHistory] = useState<DensityOfCarPacksDataPoint[]>([]);
  const [percentageByLaneHistory, setPercentageByLaneHistory] = useState<PercentageOfCarsByLaneDataPoint[]>([]);
  const [packsPerLaneHistory, setPacksPerLaneHistory] = useState<any[]>([]);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastPackRecordTimeRef = useRef<number>(0);
  const lastDensityUpdateTimeRef = useRef<number>(0);
  const { toast } = useToast();

  const [shouldSave, setShouldSave] = useState(false);
  const speedDensityHistoryRef = useRef<any[]>([]);
  const densityThroughputHistoryRef = useRef<any[]>([]);
  const packFormationHistoryRef = useRef<any[]>([]);
  const laneUtilizationHistoryRef = useRef<any[]>([]);
  const laneThroughputHistoryRef = useRef<any[]>([]);
  const densityOfCarPacksHistoryRef = useRef<any[]>([]);
  const percentageByLaneHistoryRef = useRef<any[]>([]);
  const packLengthHistoryRef = useRef<any[]>([]);
  const packHistoryRef = useRef<any[]>([]);
  const showPackFormationRef = useRef<boolean>(false);
  const carsRef = useRef<Car[]>([]);
  const laneChangesRef = useRef<number>(0);
  // const batchControllerRef = useRef<{
  //   active: boolean;
  //   originalParams: SimulationParams | null;
  //   originalSimulationSpeed: number | null;
  //   targetSimTime: number | null;
  //   currentName: string | null;
  //   next: (() => void) | null;
  // }>({ active: false, originalParams: null, originalSimulationSpeed: null, targetSimTime: null, currentName: null, next: null });
  // const paramsRef = useRef<SimulationParams>(defaultParams);
  const paramsRef = useRef<SimulationParams>(defaultParams);
  
  // Load saved runs from localStorage on component mount
  useEffect(() => {
    try {
      const savedRunsJson = localStorage.getItem('freewaySimulator_savedRuns');
      if (savedRunsJson) {
        const parsed = JSON.parse(savedRunsJson);
        if (Array.isArray(parsed)) {
          setSavedRuns(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading saved runs:", error);
    }
  }, []);

  const saveRunToLocalStorage = useCallback((runs: SimulationRun[]) => {
    try {
      localStorage.setItem('freewaySimulator_savedRuns', JSON.stringify(runs));
    } catch (error) {
      console.error("Error saving runs:", error);
      if (showNotifications) {
        toast({
          title: "Save Failed",
          description: "Could not save simulation runs.",
          variant: "destructive",
        });
      }
    }
  }, [toast, showNotifications]);

  const handleSaveCurrentRun = useCallback(() => {
    if (packHistory.length === 0) {
      if (showNotifications) {
        toast({
          title: "Nothing to Save",
          description: "Run the simulation first to generate data.",
          variant: "default",
        });
      }
      return;
    }

    const newRun: SimulationRun = {
      id: `run-${Date.now()}`,
      packHistory: packHistory.map(item => ({ ...item })),
      packLengthHistory: packLengthHistory.map(item => ({ ...item })),
      params: { ...params },
      timestamp: Date.now(),
      duration: elapsedTime
    };

    setSavedRuns(prev => {
      const updatedRuns = [...prev, newRun].slice(-5); // Keep only the 5 most recent runs
      saveRunToLocalStorage(updatedRuns);
      return updatedRuns;
    });

    if (showNotifications) {
      toast({
        title: "Run Saved",
        description: "Current simulation run has been saved.",
        duration: 3000,
      });
    }
  }, [packHistory, packLengthHistory, params, saveRunToLocalStorage, toast, showNotifications]);

  const togglePreviousRuns = useCallback(() => {
    setShowPreviousRuns(prev => !prev);
  }, []);

  const initSimulation = useCallback(() => {
    const { cars, laneLength } = initializeSimulation(params, showNotifications);
    setCars(cars);
    carsRef.current = cars;
    setLaneLength(laneLength);
    setElapsedTime(0);
    setPackHistory([]);
    setPackLengthHistory([]);
    setPackDensityData([]);
    setSpeedDensityHistory([]);
    setDensityOfCarPacksHistory([]);
    setPercentageByLaneHistory([]);
    setPacksPerLaneHistory([]);
    lastPackRecordTimeRef.current = 0;
    lastDensityUpdateTimeRef.current = 0;
  }, [params]);

  const resetSimulation = useCallback((params: SimulationParams) => {
    console.log('Resetting simulation with params:', params);

    // Stop any running animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    lastTimestampRef.current = null;
    setIsRunning(false);

    // Clear all data
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
    setPackDensityData([]);

    // Reset timers
    lastPackRecordTimeRef.current = 0;
    lastDensityUpdateTimeRef.current = 0;

    // Reinitialize simulation with new parameters
    const { cars, laneLength } = initializeSimulation(params, showNotifications);
    setCars(cars);
    carsRef.current = cars;
    setLaneLength(laneLength);

    console.log('Simulation reset complete');
  }, []);

  const handleUpdateParams = useCallback((newParams: Partial<SimulationParams>) => {
    console.log('Updating params with:', newParams);

    // Update the params state using a callback to ensure we have the latest state
    setParams(prevParams => {
      const mergedParams = { ...prevParams, ...newParams };

      // Always reset the simulation when parameters change
      console.log('Parameters changed, resetting simulation');
      resetSimulation(mergedParams);

      return mergedParams;
    });
  }, [resetSimulation]);


  const toggleSimulation = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastTimestampRef.current = null;
    setIsRunning(false);
    setStoppedCars(new Set()); // Clear stopped cars on reset
    setDensityThroughputHistory([]);
    setPackFormationHistory([]);
    setLaneUtilizationHistory([]);
    setSpeedDensityHistory([]);
    setDensityOfCarPacksHistory([]);
    setPercentageByLaneHistory([]);
    setPacksPerLaneHistory([]);
    setLaneChanges(0);
    initSimulation();
  }, [initSimulation]);

  const handleStopCar = useCallback((carId: number) => {
    setStoppedCars(prev => new Set([...prev, carId]));
    if (showNotifications) {
      toast({
        title: "Car Stopped",
        description: `Car ${carId + 1} has been stopped for testing`,
        duration: 2000,
      });
    }
  }, [toast, showNotifications]);

  const handleResumeCar = useCallback((carId: number) => {
    setStoppedCars(prev => {
      const newSet = new Set(prev);
      newSet.delete(carId);
      return newSet;
    });
    if (showNotifications) {
      toast({
        title: "Car Resumed",
        description: `Car ${carId + 1} has resumed movement`,
        duration: 2000,
      });
    }
  }, [toast, showNotifications]);

  const recordPackData = useCallback((newCars: Car[], time: number, currentLaneLength: number) => {
    // Only record data every 0.5 seconds to avoid chart clutter
    if (time - lastPackRecordTimeRef.current >= 0.5) {
      const numLanes = params.numLanes || 3;

      // Calculate total metrics - match StatsDisplay calculation
      const totalDensity = newCars.length / currentLaneLength; // cars per km (matches StatsDisplay)
      const totalAvgSpeed = newCars.length > 0
        ? newCars.reduce((sum, car) => sum + car.speed, 0) / newCars.length
        : 0; // km/h
      const totalThroughput = totalAvgSpeed * totalDensity; // cars/hour

      // Calculate per-lane metrics for density throughput
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
        const throughput = laneAvgSpeed * laneDensity;

        laneThroughputs.push(parseFloat(throughput.toFixed(2)));
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
        if (newHistory.length > 100) {
          return newHistory.slice(-100);
        }
        return newHistory;
      });

      setDensityThroughputHistory(prev => {
        const newHistory = [...prev, {
          density: parseFloat(totalDensity.toFixed(4)),
          throughput: parseFloat(totalThroughput.toFixed(2)),
          time: parseFloat(time.toFixed(1)),
          laneThroughputs,
          laneDensities
        }];
        densityThroughputHistoryRef.current = newHistory;
        if (newHistory.length > 100) {
          densityThroughputHistoryRef.current = newHistory.slice(-100);
        }
        return densityThroughputHistoryRef.current;
      });


      // Calculate overall average speed first
      const overallAvgSpeed = totalAvgSpeed;

      // Record speed-density data
      setSpeedDensityHistory(prev => {
        const newHistory = [...prev, {
          time: parseFloat(time.toFixed(1)),
          speed: parseFloat(overallAvgSpeed.toFixed(2)),
          density: parseFloat(totalDensity.toFixed(4)),
          trafficRule: trafficRule,
          numLanes: numLanes,
          trafficDensity: params.trafficDensity,
          speedLimit: params.speedLimit,
          vehicleTypeDensity: params.vehicleTypeDensity,
          driverTypeDensity: params.driverTypeDensity,
          uniformDriverBehavior: params.uniformDriverBehavior || false
        }];

        if (newHistory.length > 100) {
          return newHistory.slice(-100);
        }
        return newHistory;
      });

      setSpeedDensityHistory(prev => {
        const newHistory = [...prev, {
          time: parseFloat(time.toFixed(1)),
          speed: parseFloat(overallAvgSpeed.toFixed(2)),
          density: parseFloat(totalDensity.toFixed(4)),
          trafficRule: trafficRule,
          numLanes: numLanes,
          trafficDensity: params.trafficDensity,
          speedLimit: params.speedLimit,
          vehicleTypeDensity: params.vehicleTypeDensity,
          driverTypeDensity: params.driverTypeDensity,
          uniformDriverBehavior: params.uniformDriverBehavior || false
        }];
        speedDensityHistoryRef.current = newHistory;
        if (newHistory.length > 100) {
          speedDensityHistoryRef.current = newHistory.slice(-100);
        }
        return speedDensityHistoryRef.current;
      });
      
      const speedVariance = newCars.length > 0 
        ? newCars.reduce((sum, car) => sum + Math.pow(car.speed - overallAvgSpeed, 2), 0) / newCars.length 
        : 0;
      const speedStdDev = Math.sqrt(speedVariance);

      // Identify packs using centralized logic
      const packs = identifyPacks(newCars, currentLaneLength, params.tDist);
      const packCount = packs.length;

      // Classify packs by size
      const smallPacks = packs.filter(p => p.cars.length < 5).length;
      const mediumPacks = packs.filter(p => p.cars.length >= 5 && p.cars.length <= 10).length;
      const largePacks = packs.filter(p => p.cars.length > 10).length;

      // Calculate average pack length
      const averagePackLength = packCount > 0
        ? packs.reduce((sum, pack) => sum + pack.cars.length, 0) / packCount
        : 0;

      // Update Pack Formation Chart History
      setPackHistory(prev => {
        const newHistory = [...prev, {
          time: parseFloat(time.toFixed(1)),
          packCount: packCount,
          smallPacks: smallPacks,
          mediumPacks: mediumPacks,
          largePacks: largePacks
        }];
        if (newHistory.length > 100) {
          return newHistory.slice(-100);
        }
        return newHistory;
      });

      setPackHistory(prev => {
        const newHistory = [...prev, {
          time: parseFloat(time.toFixed(1)),
          packCount: packCount
        }];
        packHistoryRef.current = newHistory;
        if (newHistory.length > 100) {
          packHistoryRef.current = newHistory.slice(-100);
        }
        return packHistoryRef.current;
      });

      // Update Average Pack Length Chart History
      // Update Average Pack Length Chart History
      setPackLengthHistory(prev => {
        const newHistory = [...prev, {
          time: parseFloat(time.toFixed(1)),
          averageLength: parseFloat(averagePackLength.toFixed(2))
        }];
        if (newHistory.length > 100) {
          return newHistory.slice(-100);
        }
        return newHistory;
      });

      setPackLengthHistory(prev => {
        const newHistory = [...prev, {
          time: parseFloat(time.toFixed(1)),
          averageLength: parseFloat(averagePackLength.toFixed(2))
        }];

        packLengthHistoryRef.current = newHistory
        if (newHistory.length > 50) {
          packLengthHistoryRef.current = newHistory.slice(-50);
        }
        return packLengthHistoryRef.current;
      });
      
      // Update Packs Per Lane History
      setPacksPerLaneHistory(prev => {
        const packsPerLane: any = { time: parseFloat(time.toFixed(1)) };

        // Initialize all lanes to 0
        for (let lane = 0; lane < (params.numLanes || 3); lane++) {
          packsPerLane[`lane${lane}`] = 0;
        }

        // Identify all packs first (same logic as Pack Formation chart)
        // This ensures consistency: Sum(Lanes) == Total Packs
        const allPacks = identifyPacks(newCars, currentLaneLength, params.tDist);

        // Assign each pack to a dominant lane
        for (const pack of allPacks) {
          const laneCounts: { [key: number]: number } = {};

          // Count cars in each lane for this pack
          pack.cars.forEach(car => {
            laneCounts[car.lane] = (laneCounts[car.lane] || 0) + 1;
          });

          // Find the max count
          let maxCount = 0;
          for (const count of Object.values(laneCounts)) {
            if (count > maxCount) maxCount = count;
          }

          // Find all lanes that have the max count (candidates for dominant lane)
          const candidateLanes: number[] = [];
          for (const [laneStr, count] of Object.entries(laneCounts)) {
            if (count === maxCount) {
              candidateLanes.push(parseInt(laneStr));
            }
          }

          let dominantLane = candidateLanes[0];

          // If there is a tie, use the leader's lane as the tie-breaker
          if (candidateLanes.length > 1) {
            // The last car in the sorted array is the leader (highest position)
            const leaderCar = pack.cars[pack.cars.length - 1];
            if (candidateLanes.includes(leaderCar.lane)) {
              dominantLane = leaderCar.lane;
            }
          }

          // Increment the pack count for the dominant lane
          packsPerLane[`lane${dominantLane}`]++;
        }

        // Debug logging
        if (time > 0 && time < 2) {
          console.log('Packs Per Lane at time', time, ':', packsPerLane);
          console.log('Total packs identified:', allPacks.length);
        }

        const newHistory = [...prev, packsPerLane];
        if (newHistory.length > 100) {
          return newHistory.slice(-100);
        }
        return newHistory;
      });

      setPackFormationHistory(prev => {
        const newHistory = [...prev, {
          density: parseFloat(totalDensity.toFixed(2)),
          speedStdDev: parseFloat(speedStdDev.toFixed(2)),
          packCount: packCount,
          time: parseFloat(time.toFixed(1))
        }];
        if (newHistory.length > 100) {
          return newHistory.slice(-100);
        }
        return newHistory;
      });

      setPackFormationHistory(prev => {
        const newHistory = [...prev, {
          density: parseFloat(totalDensity.toFixed(2)),
          speedStdDev: parseFloat(speedStdDev.toFixed(2)),
          packCount: packCount,
          time: parseFloat(time.toFixed(1))
        }];
        packFormationHistoryRef.current = newHistory;
        if (newHistory.length > 100) {
          packFormationHistoryRef.current = newHistory.slice(-100);
        }
        return packFormationHistoryRef.current;
      });

      // Record density of car packs data
      const densityPacksPoint: DensityOfCarPacksDataPoint = {
        time: parseFloat(time.toFixed(1)),
        overallDensity: parseFloat(totalDensity.toFixed(2)),
        averagePackSize: 0
      };

      // Calculate per-lane densities for visualization
      for (let i = 0; i < numLanes; i++) {
        const carsInLane = newCars.filter(car => car.lane === i);
        // Per-lane density in cars per mile (for visualization only)
        const laneDensity = carsInLane.length / currentLaneLength;
        densityPacksPoint[`lane${i}Density`] = parseFloat(laneDensity.toFixed(2));
      }

      densityPacksPoint.averagePackSize = packCount > 0 ? parseFloat((newCars.length / packCount).toFixed(1)) : 0;

      setDensityOfCarPacksHistory(prev => {
        const newHistory = [...prev, densityPacksPoint];
        if (newHistory.length > 50) {
          return newHistory.slice(-50);
        }
        return newHistory;
      });

      setDensityOfCarPacksHistory(prev => {
        const newHistory = [...prev, densityPacksPoint];
        densityOfCarPacksHistoryRef.current = newHistory;
        if (newHistory.length > 50) {
          densityOfCarPacksHistoryRef.current = newHistory.slice(-50);
        }
        return densityOfCarPacksHistoryRef.current;
      });

      // Record percentage by lane data
      const totalCars = newCars.length;
      const percentagePoint: PercentageOfCarsByLaneDataPoint = {
        time: parseFloat(time.toFixed(1))
      };

      for (let i = 0; i < numLanes; i++) {
        const carsInLane = newCars.filter(car => car.lane === i).length;
        const percentage = totalCars > 0 ? (carsInLane / totalCars) * 100 : 0;
        percentagePoint[`lane${i}`] = parseFloat(percentage.toFixed(1));
      }

      setPercentageByLaneHistory(prev => {
        const newHistory = [...prev, percentagePoint];
        if (newHistory.length > 50) {
          return newHistory.slice(-50);
        }
        return newHistory;
      });

      setPercentageByLaneHistory(prev => {
        const newHistory = [...prev, percentagePoint];
        percentageByLaneHistoryRef.current = newHistory;
        if (newHistory.length > 50) {
          percentageByLaneHistoryRef.current = newHistory.slice(-50);
        }
        return percentageByLaneHistoryRef.current;
      });
    
      // Record lane utilization data as percentages
      const laneDistribution: { [key: string]: number } = {};

      for (let i = 0; i < numLanes; i++) {
        laneDistribution[`lane${i}`] = 0;
      }

      newCars.forEach(car => {
        const laneKey = `lane${car.lane}`;
        laneDistribution[laneKey] = (laneDistribution[laneKey] || 0) + 1;
      });

      // Convert to percentages
      for (let i = 0; i < numLanes; i++) {
        const laneKey = `lane${i}`;
        laneDistribution[laneKey] = totalCars > 0 ?
          parseFloat(((laneDistribution[laneKey] / totalCars) * 100).toFixed(1)) : 0;
      }

      setLaneUtilizationHistory(prev => {
        const newHistory = [...prev, {
          time: parseFloat(time.toFixed(1)),
          ...laneDistribution
        }];
        if (newHistory.length > 50) {
          return newHistory.slice(-50);
        }
        return newHistory;
      });

      setLaneUtilizationHistory(prev => {
        const newHistory = [...prev, {
          time: parseFloat(time.toFixed(1)),
          ...laneDistribution
        }];
        laneUtilizationHistoryRef.current = newHistory;
        if (newHistory.length > 50) {
          laneUtilizationHistoryRef.current = newHistory.slice(-50);
        }
        return laneUtilizationHistoryRef.current;
      });

      // Record lane throughput data
      const laneThroughputPoint: LaneThroughputDataPoint = {
        time: parseFloat(time.toFixed(1))
      };

      for (let i = 0; i < numLanes; i++) {
        const carsInLane = newCars.filter(car => car.lane === i);
        const carCount = carsInLane.length;

        if (carCount > 0) {
          const avgSpeed = carsInLane.reduce((sum, car) => sum + car.speed, 0) / carCount;
          const density = carCount / currentLaneLength; // cars/km
          const throughput = avgSpeed * density; // cars/hour for this lane
          laneThroughputPoint[`lane${i}`] = parseFloat(throughput.toFixed(2));
        } else {
          laneThroughputPoint[`lane${i}`] = 0;
        }
      }

      setLaneThroughputHistory(prev => {
        const newHistory = [...prev, laneThroughputPoint];
        if (newHistory.length > 50) {
          return newHistory.slice(-50);
        }
        return newHistory;
      });

      setLaneThroughputHistory(prev => {
        const newHistory = [...prev, laneThroughputPoint];
        laneThroughputHistoryRef.current = newHistory;
        if (newHistory.length > 50) {
          return newHistory.slice(-50);
        }
        return newHistory;
      });

      lastPackRecordTimeRef.current = time;
    }

    // Update pack density data less frequently
    if (time - lastDensityUpdateTimeRef.current >= 2) {
      const densityData = calculatePackDensityMetrics(newCars, currentLaneLength);
      setPackDensityData(densityData);
      lastDensityUpdateTimeRef.current = time;
      lastPackRecordTimeRef.current = time;
    }
  }, [params.numLanes, params.trafficDensity, params.speedLimit, params.vehicleTypeDensity, params.driverTypeDensity, params.uniformDriverBehavior, trafficRule]);

  const handleSimulationEvents = useCallback((events: SimulationEvent[]) => {
    events.forEach(event => {
      if (event.type === 'exit') {
        if (showNotifications) {
          toast({
            title: "Car Exited",
            description: `${event.carName} has completed its trip and exited the freeway.`,
            variant: "default",
          });
        }
      } else if (event.type === 'enter') {
        if (showNotifications) {
          toast({
            title: "Car Entered",
            description: `${event.carName} has entered the freeway at position ${(event.position / 5280).toFixed(2)} mi.`,
            variant: "default",
          });
        }
      } else if (event.type === 'laneChange') {
        setLaneChanges(prev => prev + 1);
        setLaneChanges(prev => {
          //prev + 1;
          laneChangesRef.current = prev + 1;
          return laneChangesRef.current;
        });
        if (showNotifications) {
          toast({
            title: "Lane Change",
            description: `${event.carName} has changed to lane ${event.lane! + 1}.`,
            variant: "default",
          });
        }
      }
    });
  }, [toast, showNotifications]);

  // Ref to hold latest state for the animation loop without triggering re-renders/re-effects
  const simulationRef = useRef({
    cars,
    laneLength,
    params,
    elapsedTime,
    trafficRule,
    simulationSpeed,
    stoppedCars,
    showNotifications,
    handleSimulationEvents,
    recordPackData
  });

  // Update ref on every render
  useEffect(() => {
    simulationRef.current = {
      cars,
      laneLength,
      params,
      elapsedTime,
      trafficRule,
      simulationSpeed,
      stoppedCars,
      showNotifications,
      handleSimulationEvents,
      recordPackData
    };
  }, [cars, laneLength, params, elapsedTime, trafficRule, simulationSpeed, stoppedCars, showNotifications, handleSimulationEvents, recordPackData]);

  const animationLoop = useCallback((timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(animationLoop);
      return;
    }

    const state = simulationRef.current;

    // Check if simulation duration has been reached
    if (state.params.simulationDuration > 0 && state.elapsedTime >= state.params.simulationDuration) {
      setIsRunning(false);
      return;
    }

    // Calculate delta time and apply simulation speed multiplier
    const rawDeltaTime = (timestamp - lastTimestampRef.current) / 1000;
    const deltaTime = rawDeltaTime * state.simulationSpeed;
    lastTimestampRef.current = timestamp;

    const newElapsedTime = state.elapsedTime + deltaTime;
    setElapsedTime(newElapsedTime);

    // Pass the rawDeltaTime to updateSimulation, it will handle simulation speed internally
    const { cars: updatedCars, events } = updateSimulation(
      state.cars,
      state.laneLength,
      state.params,
      newElapsedTime,
      state.trafficRule,
      state.simulationSpeed,
      state.stoppedCars, // Pass stopped cars to simulation
      state.showNotifications,
      rawDeltaTime // Pass the actual time elapsed since last frame
    );
    setCars(updatedCars);
    carsRef.current = updatedCars;

    // Handle car exit and enter events
    if (events.length > 0) {
      state.handleSimulationEvents(events);
    }

    state.recordPackData(updatedCars, newElapsedTime, state.laneLength);

    // // If running a batch, stop when simulated elapsed time reaches the batch target
    // const batch = batchControllerRef.current;
    // if (batch.active && batch.targetSimTime !== null && newElapsedTime >= batch.targetSimTime) {
    //   // Stop the run and save results, then restore original state and continue
    //   batchControllerRef.current.active = false;
    //   setIsRunning(false);

    //   const saveName = batch.currentName || `Batch Run`;
    //   // Save using the batch-save path
    //   saveSimulationRef.current(saveName, true).then(() => {
    //     // Restore original application state
    //     if (batch.originalParams) {
    //       setParams(batch.originalParams);
    //       resetSimulation(batch.originalParams);
    //     }
    //     if (batch.originalSimulationSpeed !== null) {
    //       setSimulationSpeed(batch.originalSimulationSpeed);
    //     }

    //     // Continue to the next simulation in the batch
    //     if (batch.next) {
    //       setTimeout(() => batch.next && batch.next(), 200);
    //     }
    //   }).catch(err => {
    //     console.error('Error saving batch run:', err);
    //     if (batch.next) {
    //       setTimeout(() => batch.next && batch.next(), 200);
    //     }
    //   });

    //   return;
    // }

    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, []); // Empty dependency array - loop function never changes!

  const executeSave = useCallback(async (name: string, folder?: string) => {
    if (elapsedTime === 0 || cars.length === 0) {
      if (showNotifications) {
        toast({
          title: "Nothing to Save",
          description: "Run the simulation first to generate data.",
          variant: "default",
        });
      }
      return;
    }
    try {
      const simulationNumber = await simulationService.getNextSimulationNumber();
      const speeds = cars.map(car => car.speed);
      const avgSpeed = speeds.length > 0 ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length : 0;
      const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
      const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;

      // Calculate per-lane throughput
      const perLaneThroughputs = [];
      const numLanes = params.numLanes || 3;
      const laneLength = params.freewayLength || 1; // km
      

      if (!isBatch) {
        for (let lane = 0; lane < numLanes; lane++) {
        const laneCars = cars.filter(car => car.lane === lane);
        const carCount = laneCars.length;

        if (carCount === 0) {
          perLaneThroughputs.push(0);
          continue;
        }

        const avgSpeed = laneCars.reduce((sum, car) => sum + car.speed, 0) / carCount;
        const density = carCount / laneLength; // cars/km
        const throughput = avgSpeed * density; // cars/hour for this lane
        perLaneThroughputs.push(parseFloat(throughput.toFixed(2)));
      }
        const stabilizedDensity = densityOfCarPacksHistory.length > 0
        ? calculateStabilizedValue(extractDataValues(densityOfCarPacksHistory, 'overallDensity')).value
        : 0;

      const stabilizedSpeed = speedDensityHistory.length > 0
        ? calculateStabilizedValue(extractDataValues(speedDensityHistory, 'speed')).value
        : 0;

      const stabilizedThroughput = densityThroughputHistory.length > 0
        ? calculateStabilizedValue(extractDataValues(densityThroughputHistory, 'throughput')).value
        : 0;

      const savedSimulation: SavedSimulation = {
        id: `simulation-${Date.now()}`,
        name: name,
        folder: folder,
        timestamp: Date.now(),
        simulationNumber,
        params: { ...params },
        trafficRule: trafficRule,
        chartData: {
          speedByLaneHistory: [...speedDensityHistory],
          densityOfCarPacksHistory: [...densityOfCarPacksHistory],
          percentageByLaneHistory: [...percentageByLaneHistory],
          densityThroughputHistory: [...densityThroughputHistory],
          packHistory: [...packHistory],
          packLengthHistory: [...packLengthHistory],
        },
        duration: elapsedTime,
        finalStats: {
          totalCars: cars.length,
          averageSpeed: parseFloat(avgSpeed.toFixed(1)),
          maxSpeed: parseFloat(maxSpeed.toFixed(1)),
          minSpeed: parseFloat(minSpeed.toFixed(1)),
          laneChanges: laneChanges,
          perLaneThroughputs: perLaneThroughputs,
          // Add stabilized metrics
          stabilizedDensity: parseFloat(stabilizedDensity.toFixed(3)),
          stabilizedAverageSpeed: parseFloat(stabilizedSpeed.toFixed(1)),
          stabilizedThroughput: parseFloat(stabilizedThroughput.toFixed(1)),
        },
      };

      await simulationService.saveSimulation(savedSimulation);

      if (showNotifications) {
        toast({
          title: "Simulation Saved",
          description: `"${name}" has been saved successfully${folder ? ` in folder "${folder}"` : ''}.`,
          duration: 3000,
        });
      }
      else {

        const perLaneThroughputsBatch = [];
        const stabilizedDensity = densityOfCarPacksHistoryRef.current.length > 0
          ? calculateStabilizedValue(extractDataValues(densityOfCarPacksHistoryRef.current, 'overallDensity')).value
          : 0;

        const stabilizedSpeed = speedDensityHistoryRef.current.length > 0
          ? calculateStabilizedValue(extractDataValues(speedDensityHistoryRef.current, 'speed')).value
          : 0;

        const stabilizedThroughput = densityThroughputHistoryRef.current.length > 0
          ? calculateStabilizedValue(extractDataValues(densityThroughputHistoryRef.current, 'throughput')).value
          : 0;

        for (let lane = 0; lane < paramsRef.current.numLanes; lane++) {
          const laneCars = carsRef.current.filter(car => car.lane === lane);
          const carCount = laneCars.length;

          if (carCount === 0) {
            perLaneThroughputsBatch.push(0);
            continue;
          }

          debugger;
          const avgSpeed = laneCars.reduce((sum, car) => sum + car.speed, 0) / carCount;
          const density = carCount / laneLength; // cars/km
          const throughput = avgSpeed * density; // cars/hour for this lane
          perLaneThroughputsBatch.push(parseFloat(throughput.toFixed(2)));
        }
        console.log('perLaneThroughputsBatch:', perLaneThroughputsBatch);
        const speeds = carsRef.current.map(car => car.speed);
        const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
        const maxSpeed = Math.max(...speeds);
        const minSpeed = Math.min(...speeds);
        //console.clear();
        console.log("?????\n", paramsRef.current)
        const savedSimulation: SavedSimulation = {
          id: `simulation-${Date.now()}`,
          name: name,
          timestamp: Date.now(),
          simulationNumber,
          params: { ...paramsRef.current },
          trafficRule: trafficRule,
          chartData: {
            speedByLaneHistory: [...speedDensityHistoryRef.current],
            densityOfCarPacksHistory: [...densityOfCarPacksHistoryRef.current],
            percentageByLaneHistory: [...percentageByLaneHistoryRef.current],
            densityThroughputHistory: [...densityThroughputHistoryRef.current],
            packHistory: [...packHistoryRef.current],
            packLengthHistory: [...packLengthHistoryRef.current],
          },
          duration: elapsedTime,
          finalStats: {
            totalCars: carsRef.current.length,
            averageSpeed: parseFloat(avgSpeed.toFixed(1)),
            maxSpeed: parseFloat(maxSpeed.toFixed(1)),
            minSpeed: parseFloat(minSpeed.toFixed(1)),
            laneChanges: laneChangesRef.current,
            perLaneThroughputs: perLaneThroughputsBatch,
            // Add stabilized metrics
            stabilizedDensity: parseFloat(stabilizedDensity.toFixed(3)),
            stabilizedAverageSpeed: parseFloat(stabilizedSpeed.toFixed(1)),
            stabilizedThroughput: parseFloat(stabilizedThroughput.toFixed(1)),
          },
        };
        await indexedDBService.saveSimulation(savedSimulation);
      }

      console.log('Trying to Saving simulation: Deepansh');


      toast({
        title: "Simulation Saved",
        description: `"${name}" has been saved successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving simulation:', error);
      if (showNotifications) {
        toast({
          title: "Save Failed",
          description: "Could not save the simulation. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [elapsedTime, cars, params, trafficRule, speedDensityHistory, densityOfCarPacksHistory, percentageByLaneHistory, densityThroughputHistory, packHistory, packLengthHistory, laneChanges, toast, showNotifications]);

  const onSaveClick = useCallback(() => {
    setSaveDialogDefaultName(`Simulation ${new Date().toLocaleTimeString()}`);
    setShowSaveDialog(true);
  }, []);

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
    console.log('Starting batch import:', simulations);

    let currentIndex = 0;

    const runNextSimulation = () => {
      if (currentIndex >= simulations.length) {
        console.log('All batch simulations completed');
        if (showNotifications) {
          toast({
            title: "Batch Complete",
            description: `All ${simulations.length} simulations have been completed.`,
            variant: "default",
          });
        }
        return;
      }
      const simulation = simulations[currentIndex];
      console.log(`Starting simulation ${currentIndex + 1}/${simulations.length}:`, simulation);

      // Update parameters
      // debugger;
      // paramsRef.current = [];
      const mergedParams = { ...params, ...simulation.params };
      setParams(mergedParams);
      resetSimulation(mergedParams);
      paramsRef.current = mergedParams;
       console.log("?????\n", paramsRef.current)

      // Start the simulation
      setIsRunning(true);

      // Stop after the specified duration
      setTimeout(() => {
        setIsRunning(false);

        // Auto-save this simulation
        const name = simulation.name || `Batch Sim ${currentIndex + 1}`;
        executeSave(name, "Batch Experiments");

        if (showNotifications) {
          toast({
            title: "Simulation Complete",
            description: `"${name}" completed and saved.`,
            variant: "default",
          });
        }

        currentIndex++;

        // Wait a bit before starting the next simulation
        setTimeout(runNextSimulation, 5000);

      }, simulation.duration * 1000);
    };
    runNextSimulation();
  }, [params, resetSimulation, executeSave, toast]);

  useEffect(() => {
    initSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRunning) {
      lastTimestampRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, animationLoop]);

  const getPreviousRunsPackHistories = () => {
    return savedRuns.map(run => run.packHistory);
  };

  const getPreviousRunsPackLengthHistories = () => {
    return savedRuns.map(run => run.packLengthHistory);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar
        onSaveSimulation={onSaveClick}
        canSave={packHistory.length > 0}
        unitSystem={unitSystem}
        onUnitSystemChange={setUnitSystem}
        showNotifications={showNotifications}
        onNotificationsToggle={setShowNotifications}
      />

      {/* Sticky Control Bar */}
      <StickyControlBar
        isRunning={isRunning}
        onToggleSimulation={toggleSimulation}
        onReset={() => resetSimulation(params)}
        setSimulationSpeed={setSimulationSpeed}
        showPackFormation={showPackFormation}
        onTogglePackFormation={setShowPackFormation}
        onSaveSimulation={onSaveClick}
        canSave={elapsedTime > 0 && cars.length > 0}
      />

      <SaveSimulationDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={executeSave}
        defaultName={saveDialogDefaultName}
      />

      {/* Color Legend - moved down to avoid overlap */}
      {/* <div className="absolute top-44 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border p-3 z-10">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Car Colors</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-gray-600">Just entered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
            <span className="text-gray-600">In transit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">About to exit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-black"></div>
            <span className="text-gray-600">Stopped for testing</span>
          </div>
        </div>
      </div> */}


      <div className="container mx-auto px-4 py-8 pt-16">

        {/* Full width track */}
        <div className="mb-8">
          <div className="p-6">
            <TrafficTrack
              cars={cars}
              laneLength={laneLength}
              numLanes={params.numLanes}
              stoppedCars={stoppedCars}
              onStopCar={handleStopCar}
              onResumeCar={handleResumeCar}
              carSize={carSize}
              unitSystem={unitSystem}
            />
          </div>
        </div>

        {/* Stats and Lane Stats Row */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="flex-1">
            <StatsDisplay
              cars={cars}
              laneLength={laneLength}
              elapsedTime={elapsedTime}
              laneChanges={laneChanges}
              unitSystem={unitSystem}
              trafficDensity={params.trafficDensity}
            />
          </div>

          <div className="flex-1">
            <CarStatsCard cars={cars} laneLength={laneLength} params={params} showPackInfo={showPackFormation} unitSystem={unitSystem} />
          </div>
        </div>

        {/* Settings (Control Panel) */}
        <div className="mb-8">
          <ControlPanel
            params={params}
            onUpdateParams={handleUpdateParams}
            onBatchImport={handleBatchImport}
            trafficRule={trafficRule}
            onTrafficRuleChange={setTrafficRule}
            carSize={carSize}
            onCarSizeChange={setCarSize}
            unitSystem={unitSystem}
            onUnitSystemChange={setUnitSystem}
          />
        </div>

        {/* Simulation Stats (Charts) */}
        <div className="mb-8">
          <ChartDashboard
            cars={cars}
            elapsedTime={elapsedTime}
            laneLength={laneLength}
            params={params}
            trafficRule={trafficRule}
            unitSystem={unitSystem}
            speedDensityHistory={speedDensityHistory}
            densityOfCarPacksHistory={densityOfCarPacksHistory}
            percentageByLaneHistory={percentageByLaneHistory}
            densityThroughputHistory={densityThroughputHistory}
            laneThroughputHistory={laneThroughputHistory}
            laneUtilizationHistory={laneUtilizationHistory}
            packHistory={packHistory}
            packLengthHistory={packLengthHistory}
            packsPerLaneHistory={packsPerLaneHistory}
            showPackFormation={showPackFormation}
            previousRunsData={getPreviousRunsPackHistories()}
            previousRunsPackLengthData={getPreviousRunsPackLengthHistories()}
            onSaveCurrentRun={handleSaveCurrentRun}
            onTogglePreviousRuns={togglePreviousRuns}
            showPreviousRuns={showPreviousRuns}
          />
        </div>
      </div>


      <Footer />
    </div>
  );
};

export default Index;
