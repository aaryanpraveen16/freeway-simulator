import {
    updateSimulation,
    identifyPacks,
    Car,
    Pack,
    SimulationParams,
    createPRNG
} from './trafficSimulation';
import { serializeCarsToBuffer } from './carBuffer';
import { computeMetricsSnapshot } from './metricsAggregator';

// Simulation state handled inside the worker
let cars: Car[] = [];
let laneLength: number = 16;
let params: SimulationParams | null = null;
let currentTime: number = 0;
let trafficRule: "american" | "european" = "american";
let simulationSpeed: number = 1;
let stoppedCars: Set<number> = new Set();
let showNotifications: boolean = false;
let isRunning: boolean = false;
let lastTimestamp: number = 0;
let rng: (() => number) = Math.random;

// Local refs for interval tracking
let lastPackRecordTime: number = 0;

function runSimulationStep() {
    if (!isRunning || !params) return;

    const now = performance.now();
    if (lastTimestamp === 0) {
        lastTimestamp = now;
        setTimeout(runSimulationStep, 16);
        return;
    }

    const isWarp = simulationSpeed > 10;
    const physicsDt = params.dt || 0.1;
    const rawDeltaTime = (now - lastTimestamp) / 1000;
    lastTimestamp = now;

    // Determine how many steps to run in this tick
    // In normal mode, we run 1 step based on the clock.
    // In Warp mode, we run enough steps to satisfy the simulationSpeed multiplier
    // regardless of how fast the computer actually is.
    let stepsToRun = 1;
    let effectiveDtPerStep = rawDeltaTime * simulationSpeed;

    if (isWarp) {
        // Each worker tick (16ms) should process simulationSpeed/60 seconds of simulation time
        const targetSimTime = simulationSpeed / 60;
        stepsToRun = Math.max(1, Math.ceil(targetSimTime / physicsDt));
        effectiveDtPerStep = physicsDt;
    }

    let batchEvents: any[] = [];
    let lastUpdatedCars = cars;
    let lastPacks = [];

    for (let i = 0; i < stepsToRun; i++) {
        currentTime += effectiveDtPerStep;

        // 1. Run Physics
        // IMPORTANT: In Warp Mode, each step is a discrete 1x speed update (batching handles the velocity)
        // If we pass simulationSpeed > 1 here, updateSimulation will double-apply it to the dt.
        const { cars: updatedCars, events } = updateSimulation(
            lastUpdatedCars,
            laneLength,
            params,
            currentTime,
            trafficRule,
            isWarp ? 1 : simulationSpeed,
            stoppedCars,
            showNotifications,
            isWarp ? effectiveDtPerStep : rawDeltaTime,
            rng
        );

        lastUpdatedCars = updatedCars;
        if (events.length > 0) {
            batchEvents = [...batchEvents, ...events];
        }

        // 2. Identify Packs (needed for UI visualization and stats)
        lastPacks = identifyPacks(lastUpdatedCars, laneLength, params.tDist);

        if (params.simulationDuration > 0 && currentTime >= params.simulationDuration) {
            isRunning = false;
            break;
        }
    }

    cars = lastUpdatedCars;

    // 3. Post Back to Main Thread with Zero-Copy Binary Buffer
    const carBuffer = serializeCarsToBuffer(cars);
    const statsData: any = {
        time: currentTime,
        carBuffer: carBuffer,
        packs: lastPacks,
        events: batchEvents,
    };

    // Throttle full rich car state and chart metrics aggregation to 1.0s to completely eliminate 60 FPS GC pressure
    if (currentTime - lastPackRecordTime >= 1.0) {
        statsData.cars = cars;
        statsData.metricsSnapshot = computeMetricsSnapshot(
            cars,
            currentTime,
            laneLength,
            lastPacks,
            params,
            trafficRule
        );
        lastPackRecordTime = currentTime;
    }

    // Transfer carBuffer's underlying ArrayBuffer with 0ms cloning overhead
    self.postMessage(
        {
            type: 'TICK',
            data: statsData
        },
        [carBuffer.buffer]
    );

    if (!isRunning) {
        self.postMessage({ type: 'COMPLETED' });
        return;
    }

    // Schedule next tick
    setTimeout(runSimulationStep, 16);
}

self.onmessage = (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'INIT':
            cars = data.cars;
            laneLength = data.laneLength;
            params = data.params;
            currentTime = data.currentTime || 0;
            trafficRule = data.trafficRule;
            simulationSpeed = data.simulationSpeed || 1;
            stoppedCars = data.stoppedCars || new Set();
            showNotifications = data.showNotifications || false;
            lastTimestamp = 0;
            lastPackRecordTime = 0;

            if (params.seed !== undefined) {
                rng = createPRNG(params.seed);
            } else {
                rng = Math.random;
            }
            break;

        case 'START':
            isRunning = true;
            lastTimestamp = 0;
            runSimulationStep();
            break;

        case 'STOP':
            isRunning = false;
            break;

        case 'UPDATE_PARAMS':
            params = { ...params, ...data.params };
            break;

        case 'UPDATE_SPEED':
            simulationSpeed = data.speed;
            break;

        case 'UPDATE_TRAFFIC_RULE':
            trafficRule = data.rule;
            break;

        case 'UPDATE_STOPPED_CARS':
            stoppedCars = data.stoppedCars;
            break;

        case 'UPDATE_SHOW_NOTIFICATIONS':
            showNotifications = data.showNotifications;
            break;
    }
};
