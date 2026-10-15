import React, { useEffect, useCallback, useRef } from "react";
import TrafficTrack from "@/components/TrafficTrack";
import ControlPanel from "@/components/ControlPanel";
import StickyControlBar from "@/components/StickyControlBar";
import StatsDisplay from "@/components/StatsDisplay";
import CarStatsCard from "@/components/CarStatsCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ChartDashboard from "@/components/ChartDashboard";
import {
  initializeSimulation,
  defaultParams,
  calculateStableDuration,
  getCarColor,
  type SimulationParams,
} from "@/utils/trafficSimulation";
import { applyBufferToCars } from "@/utils/carBuffer";
import { simulationService, SavedSimulation } from "@/services/simulationService";
import { useToast } from "@/hooks/use-toast";
import { SaveSimulationDialog } from "@/components/SaveSimulationDialog";
import { calculateStabilizedValue, extractDataValues } from "@/utils/stabilizedValueCalculator";
import { useAuth, useUser } from "@clerk/clerk-react";

import { useSimulationStore, SimulationEvent, BatchSimulation } from "@/stores/simulationStore";
import { useMetricsStore, SimulationRun } from "@/stores/metricsStore";
import { useUIStore } from "@/stores/uiStore";

const Index = () => {
  // --- Simulation Store Selectors ---
  const params = useSimulationStore((s) => s.params);
  const cars = useSimulationStore((s) => s.cars);
  const laneLength = useSimulationStore((s) => s.laneLength);
  const isRunning = useSimulationStore((s) => s.isRunning);
  const elapsedTime = useSimulationStore((s) => s.elapsedTime);
  const simulationSpeed = useSimulationStore((s) => s.simulationSpeed);
  const trafficRule = useSimulationStore((s) => s.trafficRule);
  const stoppedCars = useSimulationStore((s) => s.stoppedCars);
  const currentPacks = useSimulationStore((s) => s.currentPacks);
  const laneChanges = useSimulationStore((s) => s.laneChanges);
  const batchQueue = useSimulationStore((s) => s.batchQueue);
  const isBatchProcessing = useSimulationStore((s) => s.isBatchProcessing);
  const isBatchPaused = useSimulationStore((s) => s.isBatchPaused);

  const setWorker = useSimulationStore((s) => s.setWorker);
  const setCars = useSimulationStore((s) => s.setCars);
  const setElapsedTime = useSimulationStore((s) => s.setElapsedTime);
  const setCurrentPacks = useSimulationStore((s) => s.setCurrentPacks);
  const setLaneChanges = useSimulationStore((s) => s.setLaneChanges);
  const setSimulationSpeed = useSimulationStore((s) => s.setSimulationSpeed);
  const setTrafficRule = useSimulationStore((s) => s.setTrafficRule);
  const setParams = useSimulationStore((s) => s.setParams);
  const setIsRunning = useSimulationStore((s) => s.setIsRunning);
  const setIsBatchPaused = useSimulationStore((s) => s.setIsBatchPaused);
  const setIsBatchProcessing = useSimulationStore((s) => s.setIsBatchProcessing);
  const setBatchQueue = useSimulationStore((s) => s.setBatchQueue);
  const toggleSimulation = useSimulationStore((s) => s.toggleSimulation);
  const resetSimulation = useSimulationStore((s) => s.resetSimulation);
  const stopCar = useSimulationStore((s) => s.stopCar);
  const resumeCar = useSimulationStore((s) => s.resumeCar);
  const updateParams = useSimulationStore((s) => s.updateParams);
  const addBatchSimulation = useSimulationStore((s) => s.addBatchSimulation);

  // --- Metrics Store Selectors ---
  const densityThroughputHistory = useMetricsStore((s) => s.densityThroughputHistory);
  const laneThroughputHistory = useMetricsStore((s) => s.laneThroughputHistory);
  const packFormationHistory = useMetricsStore((s) => s.packFormationHistory);
  const laneUtilizationHistory = useMetricsStore((s) => s.laneUtilizationHistory);
  const speedDensityHistory = useMetricsStore((s) => s.speedDensityHistory);
  const densityOfCarPacksHistory = useMetricsStore((s) => s.densityOfCarPacksHistory);
  const percentageByLaneHistory = useMetricsStore((s) => s.percentageByLaneHistory);
  const packsPerLaneHistory = useMetricsStore((s) => s.packsPerLaneHistory);
  const packHistory = useMetricsStore((s) => s.packHistory);
  const packLengthHistory = useMetricsStore((s) => s.packLengthHistory);
  const savedRuns = useMetricsStore((s) => s.savedRuns);
  const showPreviousRuns = useMetricsStore((s) => s.showPreviousRuns);

  const appendMetricsSnapshot = useMetricsStore((s) => s.appendMetricsSnapshot);
  const recordMetrics = useMetricsStore((s) => s.recordMetrics);
  const resetMetrics = useMetricsStore((s) => s.resetMetrics);
  const setSavedRuns = useMetricsStore((s) => s.setSavedRuns);
  const togglePreviousRuns = useMetricsStore((s) => s.togglePreviousRuns);

  // --- UI Store Selectors ---
  const showCharts = useUIStore((s) => s.showCharts);
  const showCarStats = useUIStore((s) => s.showCarStats);
  const showFreewayUI = useUIStore((s) => s.showFreewayUI);
  const showPackFormation = useUIStore((s) => s.showPackFormation);
  const unitSystem = useUIStore((s) => s.unitSystem);
  const carSize = useUIStore((s) => s.carSize);
  const showNotifications = useUIStore((s) => s.showNotifications);

  const setShowCharts = useUIStore((s) => s.setShowCharts);
  const setShowCarStats = useUIStore((s) => s.setShowCarStats);
  const setShowFreewayUI = useUIStore((s) => s.setShowFreewayUI);
  const setShowPackFormation = useUIStore((s) => s.setShowPackFormation);
  const setUnitSystem = useUIStore((s) => s.setUnitSystem);
  const setCarSize = useUIStore((s) => s.setCarSize);
  const setShowNotifications = useUIStore((s) => s.setShowNotifications);

  // Local dialog UI states
  const [showSaveDialog, setShowSaveDialog] = React.useState<boolean>(false);
  const [saveDialogDefaultName, setSaveDialogDefaultName] = React.useState<string>("");

  // Refs for background loops and worker synchronization
  const batchQueueRef = useRef<BatchSimulation[]>([]);
  const isBatchProcessingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const batchFolderRef = useRef<string | undefined>(undefined);
  const executeSaveRef = useRef<((name: string, folder?: string) => Promise<any>) | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const { toast } = useToast();
  const { getToken, userId } = useAuth();
  const { user } = useUser();

  const paramsRef = useRef<SimulationParams>(params);
  const trafficRuleRef = useRef<'american' | 'european'>(trafficRule);
  const simulationSpeedRef = useRef<number>(simulationSpeed);
  const showNotificationsRef = useRef<boolean>(showNotifications);
  const laneLengthRef = useRef<number>(laneLength);

  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { trafficRuleRef.current = trafficRule; }, [trafficRule]);
  useEffect(() => { simulationSpeedRef.current = simulationSpeed; }, [simulationSpeed]);
  useEffect(() => { showNotificationsRef.current = showNotifications; }, [showNotifications]);
  useEffect(() => { laneLengthRef.current = laneLength; }, [laneLength]);
  useEffect(() => { batchQueueRef.current = batchQueue; }, [batchQueue]);
  useEffect(() => { isBatchProcessingRef.current = isBatchProcessing; }, [isBatchProcessing]);

  const handleSimulationEvents = useCallback((events: SimulationEvent[]) => {
    events.forEach((event) => {
      if (showNotificationsRef.current) {
        if (event.type === 'exit') {
          toast({ title: "Car Exited", description: `${event.carName} has completed its trip.`, variant: "default" });
        } else if (event.type === 'enter') {
          toast({ title: "Car Entered", description: `${event.carName} has entered the freeway.`, variant: "default" });
        } else if (event.type === 'laneChange') {
          setLaneChanges((prev) => prev + 1);
          toast({ title: "Lane Change", description: `${event.carName} changed to lane ${event.lane! + 1}.`, variant: "default" });
        }
      } else if (event.type === 'laneChange') {
        setLaneChanges((prev) => prev + 1);
      }
    });
  }, [toast, setLaneChanges]);

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
      } else if (key === 'autoCalculateDuration') {
        urlParams.autoCalculateDuration = (value === 'true');
      }
    });

    if (Object.keys(urlParams).length > 0) {
      const newParams = { ...defaultParams, ...urlParams };
      if (newParams.autoCalculateDuration && urlParams.trafficDensity !== undefined) {
        newParams.simulationDuration = calculateStableDuration(newParams.trafficDensity);
      }

      setParams(newParams);
      resetSimulation(newParams);
      resetMetrics();

      if (urlParams.simulationDuration && urlParams.simulationDuration > 0) {
        setTimeout(() => {
          setIsRunning(true);
          if (workerRef.current) workerRef.current.postMessage({ type: 'START' });
        }, 1000);
      }
    }
  }, []);

  // Initialize Web Worker on mount
  useEffect(() => {
    const worker = new Worker(new URL('../utils/simulation.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    setWorker(worker);

    worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === 'TICK') {
        let updatedCarsList: typeof cars;
        if (data.carBuffer) {
          const currentCars = useSimulationStore.getState().cars;
          updatedCarsList = applyBufferToCars(data.carBuffer, currentCars, getCarColor);
          setCars(updatedCarsList);
        } else if (data.cars) {
          updatedCarsList = data.cars;
          setCars(data.cars);
        } else {
          updatedCarsList = useSimulationStore.getState().cars;
        }

        setElapsedTime(data.time);

        if (data.packs) {
          setCurrentPacks(data.packs);
        }

        if (data.events && data.events.length > 0) {
          handleSimulationEvents(data.events);
        }

        // Throttled history recording: offloaded to Web Worker!
        if (data.metricsSnapshot) {
          appendMetricsSnapshot(data.metricsSnapshot);
        } else if (data.metrics) {
          const carsForMetrics = data.cars || updatedCarsList;
          recordMetrics(
            carsForMetrics,
            data.time,
            laneLengthRef.current,
            data.packs || [],
            paramsRef.current,
            trafficRuleRef.current
          );
        }
      } else if (type === 'COMPLETED') {
        const batchQueueSnapshot = batchQueueRef.current;
        if (isBatchProcessingRef.current && batchQueueSnapshot.length > 0) {
          const finishedSim = batchQueueSnapshot[0];
          const name = finishedSim.name || `Batch Sim ${Date.now()}`;
          const folder = batchFolderRef.current || "Batch Results";

          toast({ title: "Simulation Complete", description: `Saving "${name}" and starting next scenario...` });

          setBatchQueue((prev) => prev.slice(1));
          setIsRunning(false);

          if (executeSaveRef.current) {
            executeSaveRef.current(name, folder).catch((err) => {
              console.error("Failed to save batch simulation:", err);
            });
          }
        } else {
          setIsRunning(false);
        }
      }
    };

    // Initial setup
    const { cars: freshCars, laneLength: newLaneLength } = initializeSimulation(
      paramsRef.current,
      showNotificationsRef.current
    );
    setCars(freshCars);
    useSimulationStore.setState({ laneLength: newLaneLength });

    worker.postMessage({
      type: 'INIT',
      data: {
        cars: freshCars,
        laneLength: newLaneLength,
        params: paramsRef.current,
        trafficRule: trafficRuleRef.current,
        simulationSpeed: simulationSpeedRef.current,
        showNotifications: showNotificationsRef.current,
      },
    });

    return () => {
      worker.terminate();
      setWorker(null);
    };
  }, []);

  // Handle batch simulation progression
  useEffect(() => {
    if (isBatchProcessing && batchQueue.length > 0 && !isRunning && !isStartingRef.current && !isBatchPaused) {
      isStartingRef.current = true;

      const currentSim = batchQueue[0];
      const newParams = { ...defaultParams, ...currentSim.params };

      if (newParams.autoCalculateDuration && newParams.trafficDensity) {
        newParams.simulationDuration = calculateStableDuration(newParams.trafficDensity);
      } else if (currentSim.duration) {
        newParams.simulationDuration = currentSim.duration;
      }

      setParams(newParams);
      if (currentSim.trafficRule) {
        setTrafficRule(currentSim.trafficRule);
      }
      resetSimulation(newParams);
      resetMetrics();

      const timer = setTimeout(() => {
        setIsRunning(true);
        isStartingRef.current = false;
        if (workerRef.current) workerRef.current.postMessage({ type: 'START' });
      }, 1500);

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
  }, [batchQueue, isBatchProcessing, isRunning, isBatchPaused, resetSimulation, resetMetrics, setParams, setTrafficRule, setIsRunning, setIsBatchProcessing, toast]);

  const handleUpdateParams = useCallback((newParams: Partial<SimulationParams>, autoStart?: boolean) => {
    if (autoStart) {
      if (batchQueue.length === 0) {
        batchFolderRef.current = `Batch - ${new Date().toLocaleString()}`;
      }
      const singleBatch: BatchSimulation = {
        name: `Imported Sim ${new Date().toLocaleTimeString()}`,
        duration: newParams.simulationDuration || params.simulationDuration || 60,
        params: newParams,
        trafficRule: (newParams as any).trafficRule || trafficRule,
      };
      addBatchSimulation([singleBatch]);
    } else {
      updateParams(newParams);
    }
  }, [params.simulationDuration, trafficRule, batchQueue.length, addBatchSimulation, updateParams]);

  const handleReset = useCallback(() => {
    resetSimulation(params);
    resetMetrics();
    setIsBatchPaused(false);
  }, [resetSimulation, resetMetrics, params, setIsBatchPaused]);

  const handleSaveCurrentRun = useCallback(() => {
    if (packHistory.length === 0) {
      if (showNotifications) toast({ title: "Nothing to Save", description: "Run the simulation first." });
      return;
    }
    const newRun: SimulationRun = {
      id: `run-${Date.now()}`,
      packHistory: [...packHistory],
      packLengthHistory: [...packLengthHistory],
      params: { ...params },
      timestamp: Date.now(),
      duration: elapsedTime,
    };
    setSavedRuns((prev) => {
      const updated = [...prev, newRun].slice(-5);
      localStorage.setItem('freewaySimulator_savedRuns', JSON.stringify(updated));
      return updated;
    });
    if (showNotifications) toast({ title: "Run Saved", description: "Current run saved locally." });
  }, [packHistory, packLengthHistory, params, elapsedTime, toast, showNotifications, setSavedRuns]);

  const executeSave = useCallback(async (name: string, folder?: string) => {
    if (elapsedTime === 0 || cars.length === 0) return;
    try {
      const token = await getToken();
      const simulationNumber = await simulationService.getNextSimulationNumber(token || undefined);
      const speeds = cars.map((car) => car.speed);
      const avgSpeed = speeds.length > 0 ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length : 0;
      const laneStats: number[] = [];
      for (let i = 0; i < (params.numLanes || 3); i++) {
        const lc = cars.filter((c) => c.lane === i);
        if (lc.length === 0) {
          laneStats.push(0);
          continue;
        }
        laneStats.push(
          parseFloat(
            ((lc.reduce((s, c) => s + c.speed, 0) / lc.length) * (lc.length / (params.freewayLength || 1))).toFixed(2)
          )
        );
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
          speedByLaneHistory: speedDensityHistory.filter((_, i) => i % 20 === 0),
          densityOfCarPacksHistory: densityOfCarPacksHistory.filter((_, i) => i % 20 === 0),
          percentageByLaneHistory: percentageByLaneHistory.filter((_, i) => i % 20 === 0),
          densityThroughputHistory: densityThroughputHistory.filter((_, i) => i % 20 === 0),
          laneThroughputHistory: laneThroughputHistory.filter((_, i) => i % 20 === 0),
          laneUtilizationHistory: laneUtilizationHistory.filter((_, i) => i % 20 === 0),
          packHistory: packHistory.filter((_, i) => i % 20 === 0),
          packLengthHistory: packLengthHistory.filter((_, i) => i % 20 === 0),
          packsPerLaneHistory: packsPerLaneHistory.filter((_, i) => i % 20 === 0),
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
          stabilizedThroughput,
        },
        createdBy: userId || undefined,
        creatorName: user?.fullName || undefined,
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
  }, [
    elapsedTime,
    cars,
    params,
    trafficRule,
    speedDensityHistory,
    densityOfCarPacksHistory,
    percentageByLaneHistory,
    densityThroughputHistory,
    laneThroughputHistory,
    laneUtilizationHistory,
    packHistory,
    packLengthHistory,
    packsPerLaneHistory,
    laneChanges,
    toast,
    showNotifications,
    getToken,
    userId,
    user?.fullName,
  ]);

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

  const handleBatchImport = useCallback((simulations: BatchSimulation[]) => {
    if (batchQueue.length === 0) {
      batchFolderRef.current = `Batch - ${new Date().toLocaleString()}`;
    }
    toast({
      title: simulations.length > 1 ? "Batch Added" : "Simulation Added",
      description: `Queued ${simulations.length} simulations.`,
    });
    addBatchSimulation(simulations);
  }, [toast, batchQueue.length, addBatchSimulation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar
        onSaveSimulation={onSaveClick}
        canSave={packHistory.length > 0}
        unitSystem={unitSystem}
        onUnitSystemChange={setUnitSystem}
        showNotifications={showNotifications}
        onNotificationsToggle={setShowNotifications}
        userId={userId}
      />
      <StickyControlBar
        isRunning={isRunning}
        onToggleSimulation={toggleSimulation}
        onReset={handleReset}
        setSimulationSpeed={setSimulationSpeed}
        onSaveSimulation={onSaveClick}
        canSave={elapsedTime > 0 && cars.length > 0}
        userId={userId}
      />
      <SaveSimulationDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={executeSave}
        defaultName={saveDialogDefaultName}
      />
      <div className="w-full py-8 pt-16">
        {showFreewayUI ? (
          <div className="w-full mb-8">
            <TrafficTrack
              cars={cars}
              packs={currentPacks}
              laneLength={laneLength}
              numLanes={params.numLanes}
              stoppedCars={stoppedCars}
              onStopCar={stopCar}
              onResumeCar={resumeCar}
              carSize={carSize}
              unitSystem={unitSystem}
              currentTime={elapsedTime}
            />
          </div>
        ) : (
          <div className="w-full mb-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Performance Mode Active</h3>
              <p className="text-blue-700 max-w-md">Visualization is disabled. Simulation and charts are still running.</p>
              <button
                onClick={() => setShowFreewayUI(true)}
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                Re-enable Visualization
              </button>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
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
            {showCarStats && (
              <div className="flex-1">
                <CarStatsCard
                  cars={cars}
                  laneLength={laneLength}
                  params={params}
                  showPackInfo={showPackFormation}
                  unitSystem={unitSystem}
                />
              </div>
            )}
          </div>
          <div>
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
              showFreewayUI={showFreewayUI}
              onShowFreewayUIChange={setShowFreewayUI}
              showCharts={showCharts}
              onShowChartsChange={setShowCharts}
              showPackInformation={showPackFormation}
              onShowPackInformationChange={setShowPackFormation}
              showCarStats={showCarStats}
              onShowCarStatsChange={setShowCarStats}
            />
          </div>
          {showCharts && (
            <div>
              <ChartDashboard
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
                previousRunsData={savedRuns.map((r) => r.packHistory)}
                previousRunsPackLengthData={savedRuns.map((r) => r.packLengthHistory)}
                onSaveCurrentRun={handleSaveCurrentRun}
                onTogglePreviousRuns={togglePreviousRuns}
                showPreviousRuns={showPreviousRuns}
              />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
