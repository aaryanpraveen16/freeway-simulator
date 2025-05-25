import React, { useState, useEffect, useCallback, useRef } from "react";
import TrafficTrack from "@/components/TrafficTrack";
import ControlPanel from "@/components/ControlPanel";
import StatsDisplay from "@/components/StatsDisplay";
import CarStatsCard from "@/components/CarStatsCard";
import SimulationInfo from "@/components/SimulationInfo";
import Navbar from "@/components/Navbar";
import PackFormationChart, { identifyPacks, PackHistoryItem } from "@/components/PackFormationChart";
import AveragePackLengthChart, { calculateAveragePackLength, PackLengthHistoryItem } from "@/components/AveragePackLengthChart";
import PackDensityChart, { calculatePackDensityMetrics, PackDensityItem } from "@/components/PackDensityChart";
import { 
  initializeSimulation, 
  updateSimulation, 
  defaultParams,
  type SimulationParams,
  type Car
} from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCcw } from "lucide-react";

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
    initSimulation();
  }, [initSimulation]);

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
      
      lastPackRecordTimeRef.current = time;
    }
    
    // Update pack density data less frequently
    if (time - lastDensityUpdateTimeRef.current >= 2) {
      const densityData = calculatePackDensityMetrics(newCars, currentLaneLength);
      setPackDensityData(densityData);
      lastDensityUpdateTimeRef.current = time;
    }
  }, []);

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

    const deltaTime = ((timestamp - lastTimestampRef.current) / 1000) * simulationSpeed; // in seconds
    lastTimestampRef.current = timestamp;

    const newElapsedTime = elapsedTime + deltaTime;
    setElapsedTime(newElapsedTime);
    
    const { cars: updatedCars, events } = updateSimulation(cars, laneLength, params, elapsedTime);
    setCars(updatedCars);
    
    // Handle car exit and enter events
    if (events.length > 0) {
      handleSimulationEvents(events);
    }
    
    recordPackData(updatedCars, newElapsedTime, laneLength);

    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, [laneLength, params, elapsedTime, cars, recordPackData, handleSimulationEvents, simulationSpeed]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Freeway Simulator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A real-time simulation of traffic flow in a closed loop, demonstrating how 
            traffic jams can emerge from the dynamics of car following behavior.
          </p>
        </header>

        {/* Play/Pause button below header */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={toggleSimulation}
            variant={isRunning ? "destructive" : "default"}
            className="flex items-center gap-2"
            size="lg"
          >
            {isRunning ? (
              <>
                <Pause size={20} />
                Pause
              </>
            ) : (
              <>
                <Play size={20} />
                Start
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center gap-2 ml-4"
            size="lg"
          >
            <RotateCcw size={20} />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <TrafficTrack cars={cars} laneLength={laneLength} numLanes={params.numLanes} />
            </div>
            
            <CarStatsCard cars={cars} laneLength={laneLength} />
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SimulationInfo />
            </div>
          </div>
          
          <div className="space-y-6">
            <StatsDisplay 
              cars={cars} 
              laneLength={laneLength} 
              elapsedTime={elapsedTime} 
            />
            
            <ControlPanel
              isRunning={isRunning}
              onToggleSimulation={toggleSimulation}
              onReset={handleReset}
              params={params}
              onUpdateParams={handleUpdateParams}
              setSimulationSpeed={setSimulationSpeed}
            />
          </div>
        </div>
        
        {/* Charts in vertical layout with descriptions */}
        <div className="mt-8 space-y-12">
          <div className="flex gap-4 items-start">
            <div className="flex-grow">
              <PackFormationChart 
                packHistory={packHistory} 
                previousRunsData={showPreviousRuns ? getPreviousRunsPackHistories() : []}
                onSaveCurrentRun={handleSaveCurrentRun}
                onTogglePreviousRuns={savedRuns.length > 0 ? togglePreviousRuns : undefined}
                showPreviousRuns={showPreviousRuns}
              />
            </div>
            <div className="w-1/4 p-4 bg-slate-50 rounded-lg shadow-sm text-sm text-slate-600">
              <h4 className="font-semibold text-slate-700 mb-1">Pack Formation</h4>
              <p>Tracks the number of distinct traffic packs over time. Helps identify when and how traffic jams form or dissipate.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-grow">
              <AveragePackLengthChart 
                packLengthHistory={packLengthHistory} 
                previousRunsData={showPreviousRuns ? getPreviousRunsPackLengthHistories() : []}
                onSaveCurrentRun={handleSaveCurrentRun}
                onTogglePreviousRuns={savedRuns.length > 0 ? togglePreviousRuns : undefined}
                showPreviousRuns={showPreviousRuns}
              />
            </div>
            <div className="w-1/4 p-4 bg-slate-50 rounded-lg shadow-sm text-sm text-slate-600">
              <h4 className="font-semibold text-slate-700 mb-1">Average Pack Length</h4>
              <p>Shows the average length of traffic packs over time (in cars). Longer average pack lengths can indicate more severe congestion.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-grow">
              <PackDensityChart packDensityData={packDensityData} />
            </div>
            <div className="w-1/4 p-4 bg-slate-50 rounded-lg shadow-sm text-sm text-slate-600">
              <h4 className="font-semibold text-slate-700 mb-1">Pack Density Analysis</h4>
              <p>Visualizes car count, density (cars per 100ft of pack length), and average speed for each currently identified traffic pack.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
