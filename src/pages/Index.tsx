import React, { useState, useEffect, useCallback, useRef } from "react";
import TrafficTrack from "@/components/TrafficTrack";
import ControlPanel from "@/components/ControlPanel";
import StickyControlBar from "@/components/StickyControlBar";
import StatsDisplay from "@/components/StatsDisplay";
import CarStatsCard from "@/components/CarStatsCard";
import SimulationInfo from "@/components/SimulationInfo";
import Navbar from "@/components/Navbar";
import ChartDashboard from "@/components/ChartDashboard";
import PackFormationChart, { identifyPacks, PackHistoryItem } from "@/components/PackFormationChart";
import AveragePackLengthChart, { calculateAveragePackLength, PackLengthHistoryItem } from "@/components/AveragePackLengthChart";
import PackDensityChart, { calculatePackDensityMetrics, PackDensityItem } from "@/components/PackDensityChart";
import DensityThroughputChart from "@/components/DensityThroughputChart";
import LaneUtilizationChart from "@/components/LaneUtilizationChart";
import SpeedByLaneChart from "@/components/SpeedByLaneChart";
import DensityOfCarPacksChart from "@/components/DensityOfCarPacksChart";
import PercentageOfCarsByLaneChart from "@/components/PercentageOfCarsByLaneChart";
import { 
  initializeSimulation, 
  updateSimulation, 
  defaultParams,
  type SimulationParams,
  type Car
} from "@/utils/trafficSimulation";
import { indexedDBService, SavedSimulation } from "@/services/indexedDBService";
import { useToast } from "@/hooks/use-toast";

interface SimulationEvent {
  type: 'exit' | 'enter' | 'laneChange';
  carId: number;
  carName: string;
  position: number;
  speed: number;
  lane?: number;
}

interface SimulationRun {
  id: string;
  packHistory: PackHistoryItem[];
  packLengthHistory: PackLengthHistoryItem[];
  params: SimulationParams;
  timestamp: number;
}

interface DensityThroughputDataPoint {
  density: number;
  throughput: number;
  time: number;
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
  
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastPackRecordTimeRef = useRef<number>(0);
  const lastDensityUpdateTimeRef = useRef<number>(0);
  const { toast } = useToast();

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
      toast({
        title: "Save Failed",
        description: "Could not save simulation runs.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSaveCurrentRun = useCallback(() => {
    if (packHistory.length === 0) {
      toast({
        title: "Nothing to Save",
        description: "Run the simulation first to generate data.",
        variant: "default",
      });
      return;
    }
    
    const newRun: SimulationRun = {
      id: `run-${Date.now()}`,
      packHistory: packHistory.map(item => ({ ...item })),
      packLengthHistory: packLengthHistory.map(item => ({ ...item })),
      params: { ...params },
      timestamp: Date.now()
    };
    
    setSavedRuns(prev => {
      const updatedRuns = [...prev, newRun].slice(-5); // Keep only the 5 most recent runs
      saveRunToLocalStorage(updatedRuns);
      return updatedRuns;
    });
    
    toast({
      title: "Run Saved",
      description: "Current simulation run has been saved.",
      duration: 3000,
    });
  }, [packHistory, packLengthHistory, params, saveRunToLocalStorage, toast]);

  const togglePreviousRuns = useCallback(() => {
    setShowPreviousRuns(prev => !prev);
  }, []);

  const initSimulation = useCallback(() => {
    const { cars, laneLength } = initializeSimulation(params);
    setCars(cars);
    setLaneLength(laneLength);
    setElapsedTime(0);
    setPackHistory([]);
    setPackLengthHistory([]);
    setPackDensityData([]);
    setSpeedByLaneHistory([]);
    setDensityOfCarPacksHistory([]);
    setPercentageByLaneHistory([]);
    lastPackRecordTimeRef.current = 0;
    lastDensityUpdateTimeRef.current = 0;
  }, [params]);

  const handleUpdateParams = useCallback((newParams: Partial<SimulationParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

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
    setSpeedByLaneHistory([]);
    setDensityOfCarPacksHistory([]);
    setPercentageByLaneHistory([]);
    initSimulation();
  }, [initSimulation]);

  const handleStopCar = useCallback((carId: number) => {
    setStoppedCars(prev => new Set([...prev, carId]));
    toast({
      title: "Car Stopped",
      description: `Car ${carId + 1} has been stopped for testing`,
      duration: 2000,
    });
  }, [toast]);

  const handleResumeCar = useCallback((carId: number) => {
    setStoppedCars(prev => {
      const newSet = new Set(prev);
      newSet.delete(carId);
      return newSet;
    });
    toast({
      title: "Car Resumed",
      description: `Car ${carId + 1} has resumed normal driving`,
      duration: 2000,
    });
  }, [toast]);

  const recordPackData = useCallback((newCars: Car[], time: number, currentLaneLength: number) => {
    if (time - lastPackRecordTimeRef.current >= 0.5) {
      const packCount = identifyPacks(newCars, currentLaneLength);
      const averagePackLength = calculateAveragePackLength(newCars, currentLaneLength);
      
      setPackHistory(prev => {
        const newHistory = [...prev, { time: parseFloat(time.toFixed(1)), packCount }];
        if (newHistory.length > 50) {
          return newHistory.slice(-50);
        }
        return newHistory;
      });
      
      setPackLengthHistory(prev => {
        const newHistory = [...prev, { time: parseFloat(time.toFixed(1)), averageLength: averagePackLength }];
        if (newHistory.length > 50) {
          return newHistory.slice(-50);
        }
        return newHistory;
      });

      // Record density-throughput data
      if (newCars.length > 0) {
        const avgSpeed = newCars.reduce((sum, car) => sum + car.speed, 0) / newCars.length;
        const density = newCars.length / currentLaneLength;
        const throughput = avgSpeed * density;
        
        setDensityThroughputHistory(prev => {
          const newHistory = [...prev, {
            density: parseFloat(density.toFixed(2)),
            throughput: parseFloat(throughput.toFixed(0)),
            time: parseFloat(time.toFixed(1))
          }];
          if (newHistory.length > 100) {
            return newHistory.slice(-100);
          }
          return newHistory;
        });

        // Record pack formation data
        const speeds = newCars.map(car => car.speed);
        const speedVariance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length;
        const speedStdDev = Math.sqrt(speedVariance);
        
        setPackFormationHistory(prev => {
          const newHistory = [...prev, {
            density: parseFloat(density.toFixed(2)),
            speedStdDev: parseFloat(speedStdDev.toFixed(2)),
            packCount,
            time: parseFloat(time.toFixed(1))
          }];
          if (newHistory.length > 100) {
            return newHistory.slice(-100);
          }
          return newHistory;
        });

        // Record speed by lane data
        const overallAvgSpeed = avgSpeed;
        const speedByLanePoint: SpeedByLaneDataPoint = {
          time: parseFloat(time.toFixed(1)),
          overallAvgSpeed: parseFloat(overallAvgSpeed.toFixed(1))
        };
        
        for (let i = 0; i < params.numLanes; i++) {
          const carsInLane = newCars.filter(car => car.lane === i);
          const laneAvgSpeed = carsInLane.length > 0 
            ? carsInLane.reduce((sum, car) => sum + car.speed, 0) / carsInLane.length 
            : 0;
          speedByLanePoint[`lane${i}`] = parseFloat(laneAvgSpeed.toFixed(1));
        }
        
        setSpeedByLaneHistory(prev => {
          const newHistory = [...prev, speedByLanePoint];
          if (newHistory.length > 50) {
            return newHistory.slice(-50);
          }
          return newHistory;
        });

        // Record density of car packs data
        let totalPacks = 0;
        let totalPackSize = 0;
        const densityPacksPoint: DensityOfCarPacksDataPoint = {
          time: parseFloat(time.toFixed(1)),
          overallDensity: parseFloat(density.toFixed(2)),
          averagePackSize: 0
        };
        
        for (let i = 0; i < params.numLanes; i++) {
          const carsInLane = newCars.filter(car => car.lane === i);
          const laneDensity = carsInLane.length / currentLaneLength;
          densityPacksPoint[`lane${i}Density`] = parseFloat(laneDensity.toFixed(2));
          totalPacks += 1; // Simplified for now
        }
        
        densityPacksPoint.averagePackSize = packCount > 0 ? parseFloat((newCars.length / packCount).toFixed(1)) : 0;
        
        setDensityOfCarPacksHistory(prev => {
          const newHistory = [...prev, densityPacksPoint];
          if (newHistory.length > 50) {
            return newHistory.slice(-50);
          }
          return newHistory;
        });

        // Record percentage by lane data
        const totalCars = newCars.length;
        const percentagePoint: PercentageOfCarsByLaneDataPoint = {
          time: parseFloat(time.toFixed(1))
        };
        
        for (let i = 0; i < params.numLanes; i++) {
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
      }
      
      // Record lane utilization data as percentages
      const laneDistribution: { [key: string]: number } = {};
      const totalCars = newCars.length;
      
      for (let i = 0; i < params.numLanes; i++) {
        laneDistribution[`lane${i}`] = 0;
      }
      
      newCars.forEach(car => {
        const laneKey = `lane${car.lane}`;
        laneDistribution[laneKey] = (laneDistribution[laneKey] || 0) + 1;
      });
      
      // Convert to percentages
      for (let i = 0; i < params.numLanes; i++) {
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

      lastPackRecordTimeRef.current = time;
    }
    
    // Update pack density data less frequently
    if (time - lastDensityUpdateTimeRef.current >= 2) {
      const densityData = calculatePackDensityMetrics(newCars, currentLaneLength);
      setPackDensityData(densityData);
      lastDensityUpdateTimeRef.current = time;
    }
  }, [params.numLanes]);

  const handleSimulationEvents = useCallback((events: SimulationEvent[]) => {
    events.forEach(event => {
      if (event.type === 'exit') {
        toast({
          title: "Car Exited",
          description: `${event.carName} has completed its trip and exited the freeway.`,
          variant: "default",
        });
      } else if (event.type === 'enter') {
        toast({
          title: "Car Entered",
          description: `${event.carName} has entered the freeway at position ${(event.position / 5280).toFixed(2)} mi.`,
          variant: "default",
        });
      } else if (event.type === 'laneChange') {
        toast({
          title: "Lane Change",
          description: `${event.carName} has changed to lane ${event.lane! + 1}.`,
          variant: "default",
        });
      }
    });
  }, [toast]);

  const animationLoop = useCallback((timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(animationLoop);
      return;
    }

    // Calculate delta time and apply simulation speed multiplier
    const deltaTime = ((timestamp - lastTimestampRef.current) / 1000) * simulationSpeed;
    lastTimestampRef.current = timestamp;

    const newElapsedTime = elapsedTime + deltaTime;
    setElapsedTime(newElapsedTime);
    
    // Pass the original deltaTime to updateSimulation, it will handle simulation speed internally
    const { cars: updatedCars, events } = updateSimulation(
      cars, 
      laneLength, 
      params, 
      newElapsedTime, 
      trafficRule, 
      simulationSpeed,
      stoppedCars // Pass stopped cars to simulation
    );
    setCars(updatedCars);
    
    // Handle car exit and enter events
    if (events.length > 0) {
      handleSimulationEvents(events);
    }
    
    recordPackData(updatedCars, newElapsedTime, laneLength);

    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, [laneLength, params, elapsedTime, cars, recordPackData, handleSimulationEvents, simulationSpeed, trafficRule, stoppedCars]);

  const handleSaveSimulation = useCallback(async () => {
    if (elapsedTime === 0 || cars.length === 0) {
      toast({
        title: "Nothing to Save",
        description: "Run the simulation first to generate data.",
        variant: "default",
      });
      return;
    }

    try {
      const simulationNumber = await indexedDBService.getNextSimulationNumber();
      const speeds = cars.map(car => car.speed);
      const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
      const maxSpeed = Math.max(...speeds);
      const minSpeed = Math.min(...speeds);

      const savedSimulation: SavedSimulation = {
        id: `simulation-${Date.now()}`,
        name: `Traffic Simulation #${simulationNumber}`,
        timestamp: Date.now(),
        simulationNumber,
        params: { ...params },
        chartData: {
          speedByLaneHistory: [...speedByLaneHistory],
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
        },
      };

      await indexedDBService.saveSimulation(savedSimulation);
      
      toast({
        title: "Simulation Saved",
        description: `Simulation #${simulationNumber} has been saved successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving simulation:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the simulation. Please try again.",
        variant: "destructive",
      });
    }
  }, [elapsedTime, cars, params, speedByLaneHistory, densityOfCarPacksHistory, percentageByLaneHistory, densityThroughputHistory, packHistory, packLengthHistory, toast]);

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
  }, [isRunning, animationLoop, elapsedTime]);

  const getPreviousRunsPackHistories = () => {
    return savedRuns.map(run => run.packHistory);
  };
  
  const getPreviousRunsPackLengthHistories = () => {
    return savedRuns.map(run => run.packLengthHistory);
  };

  const [densityThroughputHistory, setDensityThroughputHistory] = useState<DensityThroughputDataPoint[]>([]);
  const [packFormationHistory, setPackFormationHistory] = useState<PackFormationDataPoint[]>([]);
  const [laneUtilizationHistory, setLaneUtilizationHistory] = useState<LaneUtilizationDataPoint[]>([]);
  const [speedByLaneHistory, setSpeedByLaneHistory] = useState<SpeedByLaneDataPoint[]>([]);
  const [densityOfCarPacksHistory, setDensityOfCarPacksHistory] = useState<DensityOfCarPacksDataPoint[]>([]);
  const [percentageByLaneHistory, setPercentageByLaneHistory] = useState<PercentageOfCarsByLaneDataPoint[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      {/* Sticky Control Bar */}
      <StickyControlBar
        isRunning={isRunning}
        onToggleSimulation={toggleSimulation}
        onReset={handleReset}
        setSimulationSpeed={setSimulationSpeed}
        showPackFormation={showPackFormation}
        onTogglePackFormation={setShowPackFormation}
        onSaveSimulation={handleSaveSimulation}
        canSave={elapsedTime > 0 && cars.length > 0}
      />
      
      {/* Color Legend - moved down to avoid overlap */}
      <div className="absolute top-44 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border p-3 z-10">
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
      </div>
      
      {/* Visual Overlap Disclaimer - moved down and to the right */}
      <div className="absolute top-44 right-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-3 z-10 max-w-xs">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> Cars may appear to overlap visually, but they maintain safe distances in the simulation logic.
        </p>
      </div>
      
      <div className="container mx-auto px-4 py-8 pt-16">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Freeway Simulator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A real-time simulation of traffic flow in a closed loop, demonstrating how 
            traffic jams can emerge from the dynamics of car following behavior.
          </p>
        </header>

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
            />
          </div>
        </div>

        {/* Stats and controls row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <StatsDisplay 
              cars={cars} 
              laneLength={laneLength} 
              elapsedTime={elapsedTime} 
            />
          </div>
          
          <div>
            <ControlPanel
              params={params}
              onUpdateParams={handleUpdateParams}
              trafficRule={trafficRule}
              onTrafficRuleChange={setTrafficRule}
            />
          </div>
        </div>

        {/* Additional info sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <CarStatsCard cars={cars} laneLength={laneLength} showPackInfo={showPackFormation} />
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <SimulationInfo />
          </div>
        </div>
        
        {/* New Chart Dashboard replacing individual charts */}
        <ChartDashboard
          cars={cars}
          elapsedTime={elapsedTime}
          laneLength={laneLength}
          params={params}
          trafficRule={trafficRule}
          speedByLaneHistory={speedByLaneHistory}
          densityOfCarPacksHistory={densityOfCarPacksHistory}
          percentageByLaneHistory={percentageByLaneHistory}
          densityThroughputHistory={densityThroughputHistory}
          laneUtilizationHistory={laneUtilizationHistory}
          packHistory={packHistory}
          packLengthHistory={packLengthHistory}
          showPackFormation={showPackFormation}
          previousRunsData={showPreviousRuns ? getPreviousRunsPackHistories() : []}
          previousRunsPackLengthData={showPreviousRuns ? getPreviousRunsPackLengthHistories() : []}
          onSaveCurrentRun={handleSaveCurrentRun}
          onTogglePreviousRuns={savedRuns.length > 0 ? togglePreviousRuns : undefined}
          showPreviousRuns={showPreviousRuns}
        />
      </div>
    </div>
  );
};

export default Index;
