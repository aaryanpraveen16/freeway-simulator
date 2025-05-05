
import React, { useState, useEffect, useCallback, useRef } from "react";
import TrafficTrack from "@/components/TrafficTrack";
import ControlPanel from "@/components/ControlPanel";
import StatsDisplay from "@/components/StatsDisplay";
import CarStatsCard from "@/components/CarStatsCard";
import SimulationInfo from "@/components/SimulationInfo";
import PackFormationChart, { identifyPacks } from "@/components/PackFormationChart";
import AveragePackLengthChart, { calculateAveragePackLength } from "@/components/AveragePackLengthChart";
import { 
  initializeSimulation, 
  updateSimulation, 
  defaultParams,
  type SimulationParams,
  type Car
} from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";

interface PackHistoryItem {
  time: number;
  packCount: number;
}

interface SimulationEvent {
  type: 'exit' | 'enter';
  carId: number;
  carName: string;
  position: number;
  speed: number;
}
interface PackLengthHistoryItem {
  time: number;
  averageLength: number;
}

const Index = () => {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [cars, setCars] = useState<Car[]>([]);
  const [laneLength, setLaneLength] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [packHistory, setPackHistory] = useState<PackHistoryItem[]>([]);
  const [packLengthHistory, setPackLengthHistory] = useState<PackLengthHistoryItem[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastPackRecordTimeRef = useRef<number>(0);
  const { toast } = useToast();

  const initSimulation = useCallback(() => {
    const { cars, laneLength } = initializeSimulation(params);
    setCars(cars);
    setLaneLength(laneLength);
    setElapsedTime(0);
    setPackHistory([]);
    setPackLengthHistory([]);
    lastPackRecordTimeRef.current = 0;
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
      const packCount = identifyPacks(newCars);
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
          description: `${event.carName} has entered the freeway at position ${Math.round(event.position)} ft.`,
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

    const deltaTime = (timestamp - lastTimestampRef.current) / 1000; // in seconds
    lastTimestampRef.current = timestamp;

    const newElapsedTime = elapsedTime + deltaTime;
    setElapsedTime(newElapsedTime);
    
    const { cars: updatedCars, events } = updateSimulation(cars, laneLength, params, elapsedTime);
    setCars(updatedCars);
    
    // Handle car exit and enter events
    if (events.length > 0) {
      handleSimulationEvents(events);
    }
    
    // recordPackData(updatedCars, newElapsedTime);
    recordPackData(updatedCars, newElapsedTime, laneLength);

    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, [laneLength, params, elapsedTime, cars, recordPackData, handleSimulationEvents]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto py-8 px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Traffic Flow Simulation
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A real-time simulation of traffic flow in a closed loop, demonstrating how 
            traffic jams can emerge from the dynamics of car following behavior.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <TrafficTrack cars={cars} laneLength={laneLength} />
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
            />
          </div>
        </div>
        
        {/* Charts in vertical layout */}
        <div className="mt-8 space-y-8">
          <PackFormationChart packHistory={packHistory} />
          <AveragePackLengthChart packLengthHistory={packLengthHistory} />
        </div>
      </div>
    </div>
  );
};

export default Index;
