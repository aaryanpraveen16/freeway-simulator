import {
    updateSimulation,
    identifyPacks,
    Car,
    Pack,
    SimulationParams
} from './trafficSimulation';

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

// Local refs for interval tracking
let lastPackRecordTime: number = 0;

function runSimulationStep() {
    if (!isRunning || !params) return;

    const now = performance.now();
    if (lastTimestamp === 0) {
        lastTimestamp = now;
        setTimeout(runSimulationStep, 16); // ~60fps
        return;
    }

    const rawDeltaTime = (now - lastTimestamp) / 1000;
    const deltaTime = rawDeltaTime * simulationSpeed;
    lastTimestamp = now;

    currentTime += deltaTime;

    // 1. Run Physics
    const { cars: updatedCars, events } = updateSimulation(
        cars,
        laneLength,
        params,
        currentTime,
        trafficRule,
        simulationSpeed,
        stoppedCars,
        showNotifications,
        rawDeltaTime
    );

    // 2. Identify Packs (needed for UI visualization and stats)
    const currentPacks = identifyPacks(updatedCars, laneLength, params.tDist);
    cars = updatedCars;

    // 3. Run Statistics (Heavy stuff)
    const statsData: any = {
        time: currentTime,
        cars: updatedCars,
        packs: currentPacks,
        events: events,
    };

    // Throttle chart data recording to 1.0s to prevent UI lag as history grows
    if (currentTime - lastPackRecordTime >= 1.0) {
        statsData.metrics = {
            tick: true
        };
        lastPackRecordTime = currentTime;
    }

    // 3. Post Back to Main Thread
    self.postMessage({
        type: 'TICK',
        data: statsData
    });

    if (params.simulationDuration > 0 && currentTime >= params.simulationDuration) {
        isRunning = false;
        self.postMessage({ type: 'COMPLETED' });
        return;
    }

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
