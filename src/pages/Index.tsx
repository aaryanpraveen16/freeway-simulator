
import React, { useState, useEffect, useCallback, useRef } from "react";
import TrafficTrack from "@/components/TrafficTrack";
import ControlPanel from "@/components/ControlPanel";
import StatsDisplay from "@/components/StatsDisplay";
import SimulationInfo from "@/components/SimulationInfo";
import { 
  initializeSimulation, 
  updateSimulation, 
  defaultParams,
  type SimulationParams,
  type Car
} from "@/utils/trafficSimulation";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [cars, setCars] = useState<Car[]>([]);
  const [laneLength, setLaneLength] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Initialize simulation
  const initSimulation = useCallback(() => {
    const { cars, laneLength } = initializeSimulation(params);
    setCars(cars);
    setLaneLength(laneLength);
    setElapsedTime(0);
    
    toast({
      title: "Simulation initialized",
      description: `${params.numCars} cars placed on a ${Math.round(laneLength)} ft track`,
    });
  }, [params, toast]);

  // Update simulation parameters
  const handleUpdateParams = useCallback((newParams: Partial<SimulationParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  // Toggle simulation running state
  const toggleSimulation = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Reset simulation
  const handleReset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastTimestampRef.current = null;
    setIsRunning(false);
    initSimulation();
  }, [initSimulation]);

  // Animation loop
  const animationLoop = useCallback((timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(animationLoop);
      return;
    }

    const deltaTime = (timestamp - lastTimestampRef.current) / 1000; // in seconds
    lastTimestampRef.current = timestamp;

    setElapsedTime((prevTime) => prevTime + deltaTime);
    setCars((prevCars) => updateSimulation(prevCars, laneLength, params, elapsedTime));

    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, [laneLength, params, elapsedTime]);

  // Effect to initialize simulation on mount
  useEffect(() => {
    initSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to handle starting/stopping the animation loop
  useEffect(() => {
    if (isRunning) {
      lastTimestampRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animationLoop);
      
      toast({
        title: "Simulation started",
        description: "Traffic flow is now being calculated in real-time",
      });
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      
      if (elapsedTime > 0) {
        toast({
          title: "Simulation paused",
          description: "The traffic flow calculation has been paused",
        });
      }
    }

    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, animationLoop, elapsedTime, toast]);

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
      </div>
    </div>
  );
};

export default Index;
