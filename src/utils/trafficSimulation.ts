// Constants and types for traffic simulation
export interface Car {
  id: number;
  name: string; // Add name property
  position: number; // position in the loop in meters (0 to laneLength)
  speed: number; // speed in km/h
  desiredSpeed: number; // desired speed in km/h
  color: string; // color for visualization
  virtualLength: number; // physical length + safe distance in meters
  physicalLength: number; // car's actual physical length in meters
  distTripPlanned: number; // planned trip distance in meters
  distanceTraveled: number; // distance traveled so far in meters
  lane: number; // lane index (required)
  driverType: "aggressive" | "normal" | "conservative"; // driver personality
  laneChangeProbability: number; // probability of changing lanes (0-1)
  laneStickiness: number; // tendency to stay in current lane (0-1)
  lastLaneChange?: number; // timestamp of last lane change
  vehicleType: "car" | "truck" | "motorcycle"; // vehicle type
  isOvertaking?: boolean; // flag to track if car is currently overtaking
  overtakeStartTime?: number; // timestamp when overtaking maneuver started
  lastLeaderSpeed?: number; // last observed speed of the car ahead
  reactionDelayEndTime?: number; // timestamp when reaction delay ends (for acceleration)
  laneChangeOpportunityDetectedTime?: number; // timestamp when lane change opportunity was first detected
  pendingLaneChange?: number | null; // target lane for pending lane change (null = no pending change)
  brakingReactionDelayEndTime?: number; // timestamp when braking reaction delay ends
  leaderWasBraking?: boolean; // track if leader was braking in previous frame
  previousLane?: number; // the lane the car was in before the current one
  laneStabilityCounter: number; // consecutive frames the current lane change was desired
  driverReactionTime: number; // per-car reaction time (seconds)
  laneChangeStabilityThreshold: number; // consecutive frames needed for lane change stabilization
  lastLaneChangeIncentive?: number; // store the last calculated MOBIL incentive
  slowDownStartTime?: number; // timestamp when car first dropped below desired speed
  leftLaneStruggleStartTime?: number; // timestamp when car started performing poorly in the left lane
  rightLaneOpportunityStartTime?: number; // timestamp when right lane became a viable option
  acceleration: number; // Current acceleration in m/s^2
  lastLeaderId?: number; // Track leader for reaction reset
}

/**
 * Parameters for the traffic simulation
 */
export interface SimulationParams {
  /**
   * Overall traffic density in cars per kilometer (across all lanes)
   */
  trafficDensity: number; // cars per kilometer
  vehicleTypeDensity: {
    car: number; // percentage of cars (0-100)
    truck: number; // percentage of trucks (0-100)
    motorcycle: number; // percentage of motorcycles (0-100)
  };
  driverTypeDensity: {
    aggressive: number; // percentage of aggressive drivers (0-100)
    normal: number; // percentage of normal drivers (0-100)
    conservative: number; // percentage of conservative drivers (0-100)
  };
  dt: number; // time step in seconds
  aMax: number; // max deceleration (m/s²)
  k: number; // speed adjustment sensitivity
  lengthCar: number; // physical car length in meters
  tDist: number; // time headway in seconds
  initialGap: number; // initial gap between cars in meters
  brakeTime: number; // time at which leader car starts braking
  brakeCarIndex: number; // index of the car to brake (default: 0 for first car)
  minSpeed: number; // minimum speed in km/h
  maxSpeed: number; // maximum speed in km/h
  meanSpeed: number; // mean desired speed in km/h
  stdSpeed: number; // standard deviation of desired speeds in km/h
  meanDistTripPlanned: number; // mean planned trip distance in km
  sigmaDistTripPlanned: number; // standard deviation of planned trip distances in km
  speedLimit: number; // in km/h
  freewayLength?: number; // length of the freeway in km
  numLanes?: number; // number of lanes
  rightLaneBias?: number; // bias for right lane
  accelerationThreshold?: number; // threshold for lane change
  laneChangeCooldown?: number; // min time between lane changes (seconds)
  simulationDuration?: number; // simulation duration in seconds (0 = unlimited)
  uniformDriverBehavior?: boolean;
  /** Gap between stopped cars in meters (default: 1.0) */
  stoppedCarsGap?: number; // if true, all drivers have same lane change probability (default false)
  /** Driver reaction time in seconds (default: 2.0) */
  driverReactionTime?: number; // time delay before reacting to lead car acceleration
  /** Braking reaction time in seconds (default: 1.0) - time to notice and react to brake lights */
  brakingReactionTime?: number; // time delay before reacting to lead car braking
  /** MOBIL: Maximum safe deceleration for the follower (m/s², default: -2.0) */
  mobilSafeDecel?: number;
  /** MOBIL: Maximum safe deceleration for the car itself (m/s², default: -3.0) */
  mobilSelfSafeDecel?: number;
  /** MOBIL: Politeness factor (0 to 1, default: 0.0) */
  mobilPoliteness?: number;
  /** MOBIL: Minimum speed gain required for lane change (km/h, default: 10) */
  mobilSpeedGainThreshold?: number;
  /** MOBIL: Incentive to change lane when leader is stopped (m/s², default: 3.0) */
  mobilStoppedIncentive?: number;
  /** European Rules: Safety gap factor for rear check (default: 1.0) */
  europeanGapFactor?: number;
}

// Default simulation parameters
export const defaultParams: SimulationParams = {
  trafficDensity: 10, // 10 cars per km (default)
  vehicleTypeDensity: {
    car: 100,    // 100% cars by default
    truck: 0,    // No trucks by default
    motorcycle: 0, // No motorcycles by default
  },
  stoppedCarsGap: 1.0, // 1.0 meter gap between stopped cars by default (standard jam density)
  driverTypeDensity: {
    aggressive: 20,    // 20% aggressive drivers by default
    normal: 60,        // 60% normal drivers by default
    conservative: 20,  // 20% conservative drivers by default
  },
  dt: 0.1, // 100ms time step
  aMax: 1.5, // m/s² (maximum comfortable deceleration, reduced from 3 to 1.5 for smoother braking)
  k: 0.3, // unitless
  lengthCar: 4.5, // meters (typical car length)
  tDist: 3, // seconds (time headway)
  initialGap: 15, // meters (safe following distance at low speed)
  brakeTime: 5, // seconds
  brakeCarIndex: 0, // default to first car
  minSpeed: 20, // km/h (minimum realistic speed)
  maxSpeed: 130, // km/h (typical highway speed limit)
  meanSpeed: 90, // km/h (average desired speed)
  stdSpeed: 40, // km/h (standard deviation of desired speeds)
  meanDistTripPlanned: 15, // km (average trip length)
  sigmaDistTripPlanned: 0.5, // km (standard deviation of trip lengths, reduced from 1 to 0.5 for realistic values)
  speedLimit: 130, // km/h (standard highway speed limit)
  freewayLength: 1, // km (default 1 km)
  numLanes: 2, // default to 2 lanes
  rightLaneBias: 0.1, // small bias for right lane
  accelerationThreshold: 0.2, // Threshold for lane change - lowered to 0.2 to encourage overtakes
  laneChangeCooldown: 10, // Increased to 10s default for more stability
  simulationDuration: 600, // 10 minutes by default, 0 would be unlimited but we're setting a max
  uniformDriverBehavior: true, // default to uniform driver behavior for deterministic lane changes
  driverReactionTime: 2.0, // 2 seconds reaction time by default
  brakingReactionTime: 1.0, // 1 second braking reaction time by default (faster than acceleration)
  mobilSafeDecel: -2.0, // m/s² (maximum deceleration forced on follower)
  mobilSelfSafeDecel: -3.0, // m/s² (maximum deceleration car is willing to experience)
  mobilPoliteness: 0.0, // purely selfish by default
  mobilSpeedGainThreshold: 1, // km/h (Lowered from 10 to 1 to allow acceleration-based overtakes)
  mobilStoppedIncentive: 3.0, // m/s² incentive boost
  europeanGapFactor: 1.0, // Default to 1.0 (standard safe distance)
};

/**
 * Calculates the maximum physical density of vehicles that can fit on the road
 * @param params Simulation parameters including vehicle densities
 * @returns Max density (cars/km)
 */
export function calculatePhysicalLimit(params: SimulationParams): number {
  const numLanes = params.numLanes || 1;
  const buffer = Math.max(1.0, params.stoppedCarsGap || 1.0);

  // Weighted average length based on vehicle types
  const { car, truck, motorcycle } = params.vehicleTypeDensity;
  const avgLength = (
    (car / 100) * 4.5 +   // car length
    (truck / 100) * 7.5 + // truck length
    (motorcycle / 100) * 2.4 // motorcycle length
  );

  // We calculate the limit per lane first to ensure that no single lane 
  // exceeds the physical capacity even after integer distribution (extraCars).
  const carsPerKmPerLane = Math.floor(1000 / (avgLength + buffer));
  return carsPerKmPerLane * numLanes;
}

// Generate random number from normal distribution
export function normalRandom(
  mean: number,
  std: number,
  min?: number,
  max?: number
): number {
  let u1 = Math.random();
  let u2 = Math.random();
  let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  let value = mean + z0 * std;

  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

// Generate random number from log-normal distribution (returns distance in same units as mean)
export function logNormalRandom(mean: number, sigma: number): number {
  // Convert mean and sigma to mu and sigma for log-normal distribution
  const mu = Math.log(mean) - 0.5 * Math.pow(sigma, 2);

  // Generate normal random variable
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // Transform to log-normal
  return Math.exp(mu + sigma * z0);
}

// Calculate safe following distance based on speed (returns meters)
export function calculateSafeDistance(speed: number, tDist: number): number {
  // speed in km/h, tDist in seconds
  // Convert km/h to m/s: 1 km/h = 1000/3600 m/s
  return (tDist * speed * 1000) / 3600;
}

// Calculate virtual car length (physical length + safe distance) in meters
export function calculateVirtualLength(
  speed: number,
  physicalLength: number,
  params: SimulationParams
): number {
  const safeDistance = calculateSafeDistance(speed, params.tDist);
  return physicalLength + safeDistance;
}

// Generate driver type and associated properties
function generateDriverProperties(
  driverTypeDensity: {
    aggressive: number;
    normal: number;
    conservative: number;
  },
  uniformDriverBehavior: boolean = false,
  baseReactionTime: number = 2.0
): {
  driverType: "aggressive" | "normal" | "conservative";
  laneChangeProbability: number;
  laneStickiness: number;
  driverReactionTime: number;
  laneChangeStabilityThreshold: number;
} {
  const rand = Math.random();

  // Reaction time parameters (standard deviation for normal distribution)
  const reactionTimeMean = 2.0; // seconds (will be overridden by params.driverReactionTime if available)
  const reactionTimeStd = 0.4; // standard deviation

  // Convert percentages to cumulative probabilities
  const aggressiveThreshold = driverTypeDensity.aggressive / 100;
  const normalThreshold = aggressiveThreshold + (driverTypeDensity.normal / 100);

  // Uniform behavior: all drivers change lanes deterministically when conditions are favorable
  if (uniformDriverBehavior) {
    const uniformLaneChangeProbability = 1.0; // Always change lanes when conditions are favorable
    const uniformLaneStickiness = 0.7; // Higher stickiness to resist "chatter" and marginal gains

    // Still assign driver types for visualization/identification purposes
    if (rand < aggressiveThreshold) {
      return {
        driverType: "aggressive",
        laneChangeProbability: uniformLaneChangeProbability,
        laneStickiness: uniformLaneStickiness,
        driverReactionTime: baseReactionTime * 0.7,
        laneChangeStabilityThreshold: 4,
      };
    } else if (rand < normalThreshold) {
      return {
        driverType: "normal",
        laneChangeProbability: uniformLaneChangeProbability,
        laneStickiness: uniformLaneStickiness,
        driverReactionTime: baseReactionTime,
        laneChangeStabilityThreshold: 7,
      };
    } else {
      return {
        driverType: "conservative",
        laneChangeProbability: uniformLaneChangeProbability,
        laneStickiness: uniformLaneStickiness,
        driverReactionTime: baseReactionTime * 1.4,
        laneChangeStabilityThreshold: 12,
      };
    }
  }

  // Calculate randomized driver-specific properties
  const meanReaction = 2.0; // We'll use this as fallback, but ideally use params.driverReactionTime
  // Since we don't have params here, we'll return a factor or calculate it in initializeSimulation
  // Actually, let's keep it simple and generate these properties here.
  // We'll need to pass the base reaction time if we want to center it exactly.

  // Lane Stability Threshold: Random integer between 3 and 10
  const randomStabilityThreshold = Math.floor(normalRandom(6, 2, 3, 12));

  // Aggressive: 70% of base, Normal: 100% of base, Conservative: 140% of base
  if (rand < aggressiveThreshold) {
    // Aggressive driver
    return {
      driverType: "aggressive",
      laneChangeProbability: normalRandom(0.8, 0.1, 0.6, 1.0),
      laneStickiness: normalRandom(0.3, 0.1, 0.1, 0.5),
      driverReactionTime: normalRandom(baseReactionTime * 0.7, baseReactionTime * 0.15, 0.5, 5.0),
      laneChangeStabilityThreshold: Math.floor(normalRandom(4, 1, 2, 7)),
    };
  } else if (rand < normalThreshold) {
    // Normal driver
    return {
      driverType: "normal",
      laneChangeProbability: normalRandom(0.5, 0.15, 0.2, 0.8),
      laneStickiness: normalRandom(0.6, 0.15, 0.3, 0.9),
      driverReactionTime: normalRandom(baseReactionTime, baseReactionTime * 0.2, 0.8, 6.0),
      laneChangeStabilityThreshold: Math.floor(normalRandom(7, 2, 4, 12)),
    };
  } else {
    // Conservative driver
    return {
      driverType: "conservative",
      laneChangeProbability: normalRandom(0.2, 0.1, 0.05, 0.4),
      laneStickiness: normalRandom(0.8, 0.1, 0.6, 1.0),
      driverReactionTime: normalRandom(baseReactionTime * 1.4, baseReactionTime * 0.3, 1.5, 8.0),
      laneChangeStabilityThreshold: Math.floor(normalRandom(12, 3, 8, 20)),
    };
  }
}

// Generate vehicle type based on density parameters
function generateVehicleType(params: SimulationParams): "car" | "truck" | "motorcycle" {
  const rand = Math.random() * 100;
  const { car, truck, motorcycle } = params.vehicleTypeDensity;

  if (rand < car) {
    return "car";
  } else if (rand < car + truck) {
    return "truck";
  } else {
    return "motorcycle";
  }
}

// Get vehicle properties based on type
function getVehicleProperties(vehicleType: "car" | "truck" | "motorcycle") {
  switch (vehicleType) {
    case "truck":
      return {
        lengthMeters: 7.5, // ~25ft in meters, rounded down
        speedModifier: 0.9, // trucks are slightly slower
        accelerationModifier: 0.8, // trucks accelerate slower
      };
    case "motorcycle":
      return {
        lengthMeters: 2.4, // ~8ft in meters, rounded down
        speedModifier: 1.1, // motorcycles can go faster
        accelerationModifier: 1.3, // motorcycles accelerate faster
      };
    case "car":
    default:
      return {
        lengthMeters: 4.5, // ~15ft in meters, rounded down
        speedModifier: 1.0, // normal speed
        accelerationModifier: 1.0, // normal acceleration
      };
  }
}

// Initialize the simulation
export function initializeSimulation(params: SimulationParams, showNotifications: boolean = true): {
  cars: Car[];
  laneLength: number;
  density: number;
} {
  const cars: Car[] = [];
  const carColors = [
    "hsl(var(--car-red))",
    "hsl(var(--car-blue))",
    "hsl(var(--car-green))",
    "hsl(var(--car-yellow))",
    "hsl(var(--car-purple))",
    "hsl(var(--car-orange))",
  ];

  const numLanes = params.numLanes || 1;
  // Ensure laneLength is in kilometers
  let laneLength = params.freewayLength ?? 16; // default 16 km if not set
  // All code below uses kilometers for laneLength and positions.

  // Calculate total number of cars based on overall traffic density (cars/km)
  // Clamp total cars based on physical road limit
  const maxPhysicalDensity = calculatePhysicalLimit(params);
  const effectiveDensity = Math.min(params.trafficDensity, maxPhysicalDensity);
  const totalCars = Math.round(effectiveDensity * laneLength);

  // Calculate target number of cars per lane
  // Distribute cars as evenly as possible across lanes
  const targetCarsPerLane = Math.floor(totalCars / numLanes);
  const extraCars = totalCars % numLanes; // Distribute any remainder cars to the first few lanes

  // Generate cars with random desired speeds
  let carId = 0;
  for (let lane = 0; lane < numLanes; lane++) {
    // Distribute any extra cars to the first few lanes
    const carsInThisLane = lane < extraCars ? targetCarsPerLane + 1 : targetCarsPerLane;

    for (let i = 0; i < carsInThisLane; i++) {
      // Generate vehicle type first
      const vehicleType = generateVehicleType(params);
      const vehicleProps = getVehicleProperties(vehicleType);

      const desiredSpeed = normalRandom(
        params.meanSpeed * vehicleProps.speedModifier,
        params.stdSpeed,
        params.minSpeed,
        params.maxSpeed
      );

      // Initial speed is the desired speed
      const speed = desiredSpeed;

      // Calculate virtual length based on vehicle type and initial speed (in meters)
      const physicalLength = vehicleProps.lengthMeters;
      const virtualLength = calculateVirtualLength(speed, physicalLength, params);

      // Generate planned trip distance using log-normal distribution (km)
      const minTripDistance = 1; // minimum trip distance in km
      const distTripPlannedRaw = logNormalRandom(params.meanDistTripPlanned, params.sigmaDistTripPlanned);
      const distTripPlanned = Math.max(
        minTripDistance,
        distTripPlannedRaw
      );
      // debugLog(showNotifications, `[DEBUG] Car ${carId}: meanDistTripPlanned=${params.meanDistTripPlanned}, sigmaDistTripPlanned=${params.sigmaDistTripPlanned}, raw=${distTripPlannedRaw}, final=${distTripPlanned}`);

      // Generate driver properties
      const driverProps = generateDriverProperties(
        params.driverTypeDensity,
        params.uniformDriverBehavior,
        params.driverReactionTime ?? 2.0
      );

      cars.push({
        id: carId,
        name: `Car ${carId + 1}`,
        position: 0, // Will be set properly later (in miles)
        speed,
        desiredSpeed,
        color: "hsl(142, 72%, 29%)", // Start all cars with green color
        virtualLength,
        physicalLength,
        distTripPlanned,
        distanceTraveled: 0,
        lane,
        lastLaneChange: 0,
        vehicleType,
        laneStabilityCounter: 0,
        acceleration: 0,
        lastLeaderId: -1, // Initialize with -1
        ...driverProps,
      });
      carId++;
    }
  }

  // Calculate overall traffic density (cars per mile)
  const density = totalCars / laneLength;

  // Position cars with proper spacing in each lane
  for (let lane = 0; lane < numLanes; lane++) {
    const carsInLane = cars.filter((car) => car.lane === lane);

    // If no cars in this lane, skip to next lane
    if (carsInLane.length === 0) continue;

    // Sort cars by ID to ensure consistent ordering
    carsInLane.sort((a, b) => a.id - b.id);

    // ADVANCED PLACEMENT: Use cumulative lengths + uniform gaps for perfect stability
    const totalPhysicalLengthMeters = carsInLane.reduce((sum, car) => sum + car.physicalLength, 0);
    const totalAsphaltMeters = laneLength * 1000;
    const totalGapSpaceMeters = totalAsphaltMeters - totalPhysicalLengthMeters;

    // Safety check: if we somehow have negative gap space, force bumper-to-bumper
    const gapPerCarMeters = Math.max(0, totalGapSpaceMeters / carsInLane.length);

    let currentPositionMeters = 0;

    for (let i = 0; i < carsInLane.length; i++) {
      const car = carsInLane[i];

      // Front-based positions
      car.position = currentPositionMeters / 1000; // Convert meters to km

      // Update position for next car (current car length + gap)
      currentPositionMeters += (car.physicalLength + gapPerCarMeters);

      // Harmonize initial speed based on available gap to prevent startup "shock"
      // Safe gap s* = s0 + v*T -> v_safe = (gap - s0) / T
      const s0 = params.stoppedCarsGap || 1.0;
      const T = params.tDist || 1.5;
      const safeSpeedMs = Math.max(0, (gapPerCarMeters - s0) / T);
      const safeSpeedKph = (safeSpeedMs * 3600) / 1000;

      car.speed = Math.max(
        0,
        Math.min(
          safeSpeedKph * (0.9 + Math.random() * 0.1), // Add slight randomness
          car.desiredSpeed,
          params.speedLimit || 130
        )
      );
    }
  }

  // Sort cars by position and update their IDs and names
  cars.sort((a, b) => a.position - b.position);
  for (let i = 0; i < cars.length; i++) {
    cars[i].id = i;
    cars[i].name = `Car ${i + 1}`;
  }

  return { cars, laneLength, density };
}

// Calculate distance to car ahead in the same lane (in km), accounting for car lengths
export function calculateDistanceToCarAhead(
  carIndex: number,
  cars: Car[],
  laneLength: number,
  carLength: number = 5 // Default car length in meters if not provided
): number {
  if (carIndex < 0 || carIndex >= cars.length) {
    return laneLength;
  }
  const currentCar = cars[carIndex];
  if (!currentCar) return laneLength;
  const currentLane = currentCar.lane;

  // Get all cars in the same lane
  const sameLaneCars = cars.filter((car) => car.lane === currentLane);

  // Sort cars by position in the lane
  const sortedLaneCars = sameLaneCars.sort((a, b) => {
    // Handle wrap-around when calculating distances
    const distA = (a.position - currentCar.position + laneLength) % laneLength;
    const distB = (b.position - currentCar.position + laneLength) % laneLength;
    return distA - distB;
  });

  // Find the car ahead (first car with positive distance)
  const aheadCar = sortedLaneCars.find(
    (car) =>
      car.id !== currentCar.id && // Not the current car
      (car.position - currentCar.position + laneLength) % laneLength > 0 // Ahead of current car
  );

  if (!aheadCar) {
    return laneLength; // No car ahead in this lane
  }

  // Calculate distance with wrap-around (front of current car to front of ahead car)
  let distance = aheadCar.position - currentCar.position;
  if (distance < 0) {
    distance += laneLength;
  }

  // Use the actual physical length of the car ahead
  const gap = distance - (aheadCar.physicalLength / 1000); // Convert meters to km

  // Ensure we don't return negative gap (in case cars are overlapping)
  return Math.max(0, gap);
}

// Utility to get car color based on entry/exit distance
export function getCarColor(car: Car): string {
  // Use 20% of trip distance or 5 km, whichever is smaller, for thresholds
  const entryThreshold = Math.min(5, car.distTripPlanned * 0.2); // km
  const exitThreshold = Math.min(5, car.distTripPlanned * 0.2); // km
  const fullGreen = "hsl(142, 72%, 29%)";
  const lightGreen = "hsl(142, 72%, 45%)";
  const lightRed = "hsl(0, 72%, 65%)";
  const fullRed = "hsl(0, 72%, 51%)";
  const white = "hsl(0, 0%, 100%)";

  const distanceTraveled = car.distanceTraveled;
  const distanceLeft = car.distTripPlanned - car.distanceTraveled;

  if (distanceTraveled <= entryThreshold) {
    if (distanceTraveled <= entryThreshold / 2) return fullGreen;
    return lightGreen;
  }
  if (distanceLeft <= exitThreshold) {
    if (distanceLeft <= exitThreshold / 2) return fullRed;
    return lightRed;
  }
  return white;
}

// Helper function for conditional debug logging
const debugLog = (showNotifications: boolean, message: string) => {
  if (showNotifications) {
    console.log(message);
  }
};

// Update simulation for one time step
export function updateSimulation(
  cars: Car[],
  laneLength: number,
  params: SimulationParams,
  currentTime: number,
  trafficRule: "american" | "european",
  simulationSpeed: number = 1,
  stoppedCars: Set<number> = new Set(),
  showNotifications: boolean = true,
  actualDeltaTime?: number // Optional parameter for actual time elapsed since last frame
): {
  cars: Car[];
  events: {
    type: "exit" | "enter" | "laneChange";
    carId: number;
    carName: string;
    position: number;
    speed: number;
    lane?: number;
  }[];
} {
  // Normalize trafficRule to handle case sensitivity issues
  const rule = String(trafficRule).toLowerCase() as 'american' | 'european';

  // SNAPSHOT PHASE: Create a read-only view of the world at time t
  // specific properties are shallow copied, but the array structure is frozen for lookups
  const readOnlyCars = cars;

  // WRITE BUFFER: Create a deep(ish) copy for time t+1
  // We map to new objects so we don't mutate the snapshot
  const updatedCars = cars.map(car => ({ ...car }));

  const numCars = cars.length;
  const movements: {
    newPosition: number;
    newSpeed: number;
    distanceTraveled: number;
  }[] = new Array(numCars); // Pre-allocate

  const carsToRemove: { index: number; car: Car }[] = [];
  const events: {
    type: "exit" | "enter" | "laneChange";
    carId: number;
    carName: string;
    position: number;
    speed: number;
    lane?: number;
  }[] = [];

  const sortedIndices = [...Array(numCars).keys()].sort((a, b) => {
    return readOnlyCars[a].position - readOnlyCars[b].position;
  });

  // Apply simulation speed to the timestep
  const baseDt = actualDeltaTime !== undefined ? actualDeltaTime : params.dt;
  const effectiveDt = baseDt * simulationSpeed;

  // Debug tick-based logging
  const tick = Math.round(currentTime / params.dt);

  // Track which SOURCE lanes have had a car leave this frame (prevents synchronized changes)
  const lanesWithChangeThisFrame = new Set<number>();

  for (let i = 0; i < numCars; i++) {
    const carIndex = sortedIndices[i];
    // We modify the `next` state, but read from the `current` state
    const nextCar = updatedCars[carIndex];
    const currentCar = readOnlyCars[carIndex]; // The purely immutable snapshot version
    const car = nextCar; // Alias for compatibility with existing logic

    let carSpeed = currentCar.speed; // Read speed from snapshot

    // Check if this car is stopped for testing
    if (stoppedCars.has(nextCar.id)) {
      carSpeed = 0;
      nextCar.color = "black"; // Set stopped cars to black

      // Find car ahead in SAME LANE (Snapshot)
      const sameLaneCars = readOnlyCars.filter(c => c.lane === currentCar.lane);
      const carAhead = sameLaneCars.find(c =>
        c.position > currentCar.position &&
        (c.position - currentCar.position) < laneLength / 2
      );

      if (carAhead) {
        const currentGap = (carAhead.position - currentCar.position) * 1000;
        const desiredGap = params.stoppedCarsGap || 1.0;

        if (currentGap < desiredGap) {
          nextCar.position = carAhead.position - (desiredGap / 1000);
          if (nextCar.position < 0) nextCar.position += laneLength;
        }
      }

      movements[carIndex] = {
        newPosition: nextCar.position,
        newSpeed: 0,
        distanceTraveled: nextCar.distanceTraveled,
      };
      continue;
    }

    // Check if car is about to exit
    const distanceToExit = currentCar.distTripPlanned - currentCar.distanceTraveled;
    const shouldMoveToExitLane = distanceToExit <= 1 && distanceToExit > 0;

    // Find the car ahead in the same lane (SNAPSHOT)
    const currentLane = currentCar.lane;
    const sameLaneCars = readOnlyCars.filter((c) => c.lane === currentLane);
    const sortedSameLaneCars = sameLaneCars.sort((a, b) => {
      const distA = (a.position - currentCar.position + laneLength) % laneLength;
      const distB = (b.position - currentCar.position + laneLength) % laneLength;
      return distA - distB;
    });

    // Determine ahead car from SNAPSHOT
    const aheadCar = sortedSameLaneCars.find(
      (c) => (c.position - currentCar.position + laneLength) % laneLength > 0
    );

    // Calculate gap from SNAPSHOT
    const gap = aheadCar
      ? (aheadCar.position - currentCar.position + laneLength) % laneLength
      : laneLength;

    // Safety Calcs
    const safeDistKm = calculateSafeDistance(carSpeed, params.tDist) / 1000;
    const s0Km = Math.max(1.0, params.stoppedCarsGap ?? 1.0) / 1000;
    const safeGap = Math.max(s0Km, safeDistKm);

    const aheadCarSpeed = aheadCar?.speed || 0;
    const aheadCarId = aheadCar?.id ?? -1;

    // Detect leader change
    // We update `nextCar.lastLeaderId`
    if (nextCar.lastLeaderId !== undefined && nextCar.lastLeaderId !== aheadCarId) {
      if (nextCar.lastLeaderId !== -1) {
        nextCar.reactionDelayEndTime = undefined;
        nextCar.brakingReactionDelayEndTime = undefined;
        nextCar.lastLeaderSpeed = aheadCarSpeed;
        nextCar.leaderWasBraking = true;

        if (showNotifications) {
          debugLog(showNotifications, `[LEADER CHANGE] Car ${currentCar.id} reacting to new leader (Car ${aheadCarId}) at ${aheadCarSpeed.toFixed(1)} km/h`);
        }
      }
    }
    nextCar.lastLeaderId = aheadCarId;

    // ===== DRIVER REACTION DELAY LOGIC =====
    // Use `nextCar` to track persistent state, `aheadCarSpeed` (from snapshot) for triggers
    const previousLeaderSpeed = nextCar.lastLeaderSpeed ?? aheadCarSpeed;
    const leaderSpeedIncreased = aheadCarSpeed > previousLeaderSpeed;
    const leaderSpeedDecreased = aheadCarSpeed < previousLeaderSpeed;

    nextCar.lastLeaderSpeed = aheadCarSpeed;

    const reactionTime = currentCar.driverReactionTime;
    const notCurrentlyInDelay = !nextCar.reactionDelayEndTime || nextCar.reactionDelayEndTime <= currentTime;
    const leaderWasSlowOrStopped = previousLeaderSpeed < 5;

    if (leaderSpeedIncreased && notCurrentlyInDelay && leaderWasSlowOrStopped) {
      const delayEndTime = currentTime + reactionTime;
      nextCar.reactionDelayEndTime = delayEndTime;
      if (currentCar.id === 0) {
        debugLog(showNotifications, `[ACCEL REACTION START] Car ${currentCar.id}: Leader speed increased. Delaying until ${delayEndTime.toFixed(3)}s`);
      }
    }

    const inReactionDelay = nextCar.reactionDelayEndTime && nextCar.reactionDelayEndTime > currentTime;

    // Braking Reaction
    const brakingReactionTime = currentCar.driverReactionTime * 0.5;
    const leaderIsBraking = leaderSpeedDecreased && (previousLeaderSpeed - aheadCarSpeed) > 2;
    const wasNotBraking = !nextCar.leaderWasBraking;
    const notCurrentlyInBrakingDelay = !nextCar.brakingReactionDelayEndTime || nextCar.brakingReactionDelayEndTime <= currentTime;

    // Use SNAPSHOT gap for emergency check
    const criticalGap = safeGap * 0.3;
    const isEmergency = gap < criticalGap;

    if (leaderIsBraking && wasNotBraking && notCurrentlyInBrakingDelay && !isEmergency) {
      const brakingDelayEndTime = currentTime + brakingReactionTime;
      nextCar.brakingReactionDelayEndTime = brakingDelayEndTime;
      nextCar.leaderWasBraking = true;
      if (currentCar.id === 0) {
        debugLog(showNotifications, `[BRAKE REACTION START] Car ${currentCar.id}: Leader braking. Delaying until ${brakingDelayEndTime.toFixed(3)}s`);
      }
    } else if (!leaderIsBraking) {
      nextCar.leaderWasBraking = false;
    }

    const inBrakingReactionDelay = nextCar.brakingReactionDelayEndTime && nextCar.brakingReactionDelayEndTime > currentTime;

    // Debug log during delay
    if (car.id === 0 && inReactionDelay && tick % 20 === 0) {
      const timeRemaining = car.reactionDelayEndTime! - currentTime;
      const realWorldTimeRemaining = timeRemaining / simulationSpeed;
      debugLog(showNotifications, `[REACTION ACTIVE] Car ${car.id} in delay, ${timeRemaining.toFixed(2)}s simulation time remaining (${realWorldTimeRemaining.toFixed(2)}s real-world at ${simulationSpeed}x speed)`);
    }

    // Debug logging to verify rule and execution (every 100 ticks instead of 10)
    if (car.id === 0 && tick % 100 === 0) {
      debugLog(showNotifications, `[SIM TICK] rule=${rule} t=${currentTime.toFixed(1)}s car=${car.id} lane=${car.lane}`);
    }

    // --- EUROPEAN STATE TRACKING ---
    const desiredSpeed = currentCar.desiredSpeed || params.speedLimit || 130;
    const isSlowedDown = carSpeed < desiredSpeed * 0.85;

    if (isSlowedDown) {
      if (nextCar.slowDownStartTime === undefined) nextCar.slowDownStartTime = currentTime;
    } else {
      nextCar.slowDownStartTime = undefined;
    }

    const isLeftLane = currentCar.lane < (params.numLanes || 2) - 1;
    const isStruggling = isLeftLane && carSpeed < desiredSpeed * 0.85;

    if (isStruggling) {
      if (nextCar.leftLaneStruggleStartTime === undefined) nextCar.leftLaneStruggleStartTime = currentTime;
    } else {
      nextCar.leftLaneStruggleStartTime = undefined;
    }

    // Check right lane viability (SNAPSHOT)
    let isRightLaneViable = false;
    if (currentCar.lane < (params.numLanes || 2) - 1) {
      const adjacentLanes = findAdjacentCars(currentCar, readOnlyCars, laneLength, params);
      isRightLaneViable = canMaintainSpeedInLane(
        currentCar,
        adjacentLanes.rightLane.leader,
        aheadCar,
        readOnlyCars,
        currentCar.lane + 1,
        laneLength,
        params,
        5,
        false
      );
    }

    if (isRightLaneViable) {
      if (nextCar.rightLaneOpportunityStartTime === undefined) nextCar.rightLaneOpportunityStartTime = currentTime;
    } else {
      nextCar.rightLaneOpportunityStartTime = undefined;
    }

    // ACCELERATION CALCULATION (Snapshot based)
    const leaderLength = aheadCar?.physicalLength || params.lengthCar || 4.5;
    const idmAccelMs2 = calculateAcceleration(currentCar, gap, aheadCarSpeed, leaderLength, params);
    let appliedAccelMs2 = idmAccelMs2;

    const isBraking = idmAccelMs2 < -0.1;
    const isAccelerating = idmAccelMs2 > 0.1;

    if (isAccelerating) {
      if (inReactionDelay) appliedAccelMs2 = 0;
    } else if (isBraking) {
      if (inBrakingReactionDelay && !isEmergency) appliedAccelMs2 = 0;
    }

    nextCar.acceleration = appliedAccelMs2;

    const accelKmhS = appliedAccelMs2 * 3.6;
    carSpeed = Math.max(0, carSpeed + accelKmhS * effectiveDt);
    carSpeed = Math.min(carSpeed, params.speedLimit);

    // STRICT JAM DENSITY ENFORCEMENT
    if (aheadCar) {
      const frontToFrontKm = (aheadCar.position - currentCar.position + laneLength) % laneLength;
      // Convert km to meters
      const bumperToBumperMeters = (frontToFrontKm * 1000) - aheadCar.physicalLength;
      const s0 = Math.max(1.0, params.stoppedCarsGap ?? 1.0);

      if (bumperToBumperMeters <= s0 + 0.2) {
        carSpeed = 0;
      }
    }

    nextCar.virtualLength = calculateVirtualLength(carSpeed, currentCar.physicalLength, params) / 1000;
    let potentialMove = carSpeed * (1 / 3600) * effectiveDt;

    // Movement Restrictions based on SNAPSHOT ahead car
    if (aheadCar) {
      const distanceToCarAhead = (aheadCar.position - currentCar.position + laneLength) % laneLength;
      const minDistanceToAhead = (aheadCar.physicalLength / 1000) + s0Km;

      if (distanceToCarAhead <= minDistanceToAhead + 0.0002) {
        potentialMove = 0;
        carSpeed = 0;
      } else {
        const maxMove = Math.max(0, distanceToCarAhead - minDistanceToAhead);
        if (potentialMove > maxMove) {
          potentialMove = maxMove;
          carSpeed = 0; // Stop if we hit the limit
        }
      }
    }

    // --- LANE CHANGE DECISION (Two-Phase) ---
    const sourceLaneAlreadyHadChange = lanesWithChangeThisFrame.has(currentCar.lane);

    // We check against SNAPSHOT for adjacency
    if (!sourceLaneAlreadyHadChange) {
      const adjacentLanes = findAdjacentCars(currentCar, readOnlyCars, laneLength, params);

      // We pass `nextCar` to manage hysteresis state, but everything else comes from `readOnlyCars`
      const { shouldChange, targetLane } = shouldChangeLaneWithExitBehavior(
        nextCar, // Use nextCar to persist hysteresis (timers)
        aheadCar, // Snapshot leader
        adjacentLanes, // Snapshot adjacency
        readOnlyCars, // Snapshot world
        params,
        laneLength,
        currentTime,
        rule,
        shouldMoveToExitLane,
        showNotifications,
        tick
      );

      // Jam Override
      let canExecuteLaneChange = shouldChange;
      if (shouldChange && aheadCar) {
        const frontToFrontKm = (aheadCar.position - currentCar.position + laneLength) % laneLength;
        const bumperToBumperMeters = (frontToFrontKm * 1000) - aheadCar.physicalLength;
        if (bumperToBumperMeters <= (Math.max(1.0, params.stoppedCarsGap ?? 1.0) + 0.5)) {
          canExecuteLaneChange = false;
        }
      }

      if (canExecuteLaneChange && targetLane !== null) {
        nextCar.previousLane = currentCar.lane;
        nextCar.lane = targetLane;
        nextCar.lastLaneChange = currentTime;
        nextCar.pendingLaneChange = undefined;
        nextCar.laneChangeOpportunityDetectedTime = undefined;
        nextCar.reactionDelayEndTime = undefined;
        nextCar.brakingReactionDelayEndTime = undefined;
        nextCar.leaderWasBraking = false;
        nextCar.isOvertaking = false; // Reset overtake state

        debugLog(showNotifications, `[LANE CHANGE] Car ${nextCar.id}: ${currentCar.lane} -> ${targetLane}`);

        events.push({
          type: "laneChange",
          carId: nextCar.id,
          carName: nextCar.name,
          position: nextCar.position,
          speed: nextCar.speed,
          lane: targetLane,
        });

        // We mark the SOURCE lane as "busy"
        lanesWithChangeThisFrame.add(currentCar.lane);
      }
    }

    // Update Speed/Position on NextCar and Movements Buffer
    const newPosition = (currentCar.position + potentialMove) % laneLength;
    const newDistanceTraveled = currentCar.distanceTraveled + potentialMove;

    movements[carIndex] = {
      newPosition,
      newSpeed: carSpeed,
      distanceTraveled: newDistanceTraveled,
    };
  }

  // POST-MOVEMENT VALIDATION (Conflict Resolution)
  // Ensures no two cars end up overlapping in the NEW state
  const s0 = Math.max(1.0, params.stoppedCarsGap ?? 1.0);

  for (let i = 0; i < numCars; i++) {
    const car = updatedCars[i]; // The car in its NEW state/lane
    const proposedPosition = movements[i].newPosition;

    // Check against all other cars' PROPOSED positions in the SAME NEW LANE
    // We verify against `updatedCars` (which holds the new lanes) and `movements` (new positions)
    for (let j = 0; j < numCars; j++) {
      if (i === j) continue;
      const otherCar = updatedCars[j];

      // Only check collision if in same lane
      if (car.lane !== otherCar.lane) continue;

      const otherPos = movements[j].newPosition;

      // Check distance
      const frontToFrontKm = ((otherPos - proposedPosition + laneLength) % laneLength);

      // If `otherCar` is ahead and too close
      if (frontToFrontKm > 0 && frontToFrontKm < laneLength / 2) {
        const bumperToBumperMeters = (frontToFrontKm * 1000) - otherCar.physicalLength;

        if (bumperToBumperMeters < s0) {
          // Collision/Overlap detected in future state!
          // Fallback: freeze position to prevent overlap
          movements[i].newPosition = readOnlyCars[i].position;
          movements[i].newSpeed = 0;
          break;
        }
      }
    }
  }

  // Apply Final Buffer to Output State
  for (let i = 0; i < numCars; i++) {
    updatedCars[i].position = movements[i].newPosition;
    updatedCars[i].speed = movements[i].newSpeed;
    updatedCars[i].distanceTraveled = movements[i].distanceTraveled;

    if (!stoppedCars.has(updatedCars[i].id)) {
      updatedCars[i].color = getCarColor(updatedCars[i]);
    }
    if (updatedCars[i].distanceTraveled >= updatedCars[i].distTripPlanned) {
      carsToRemove.push({ index: i, car: updatedCars[i] });
    }
  }

  // EUROPEAN OVERTAKING STATE MANAGEMENT
  if (rule === "european") {
    for (let i = 0; i < updatedCars.length; i++) {
      const car = updatedCars[i];
      if (car.isOvertaking && car.overtakeStartTime) {
        const overtakeTime = currentTime - car.overtakeStartTime;
        const rightLaneCars = updatedCars.filter(c => c.lane === car.lane + 1);
        const hasPassedSlowerCars = rightLaneCars.every(rightCar => {
          const distance = ((car.position - rightCar.position + laneLength) % laneLength);
          return distance > 0.1;
        });

        const minOvertakeDuration = 8;
        if ((overtakeTime >= minOvertakeDuration && hasPassedSlowerCars) || overtakeTime >= 20) {
          updatedCars[i].isOvertaking = false;
          updatedCars[i].overtakeStartTime = undefined;
        }
      }
    }
  }

  // Handling Removals
  for (let i = carsToRemove.length - 1; i >= 0; i--) {
    const { index: indexToRemove, car } = carsToRemove[i];
    updatedCars.splice(indexToRemove, 1);
    events.push({
      type: "exit",
      carId: car.id,
      carName: car.name,
      position: car.position,
      speed: car.speed,
    });
  }

  const numLanesSim = params.numLanes || 1;

  // Handling New Entries
  for (let i = 0; i < carsToRemove.length; i++) {
    const newPosition = 0;
    const vehicleType = generateVehicleType(params);
    const vehicleProps = getVehicleProperties(vehicleType);
    const desiredSpeed = normalRandom(
      params.meanSpeed * vehicleProps.speedModifier,
      params.stdSpeed,
      params.minSpeed,
      params.maxSpeed
    );
    const speed = desiredSpeed;
    const physicalLength = vehicleProps.lengthMeters;
    const virtualLength = calculateVirtualLength(speed, physicalLength, params);
    const distTripPlanned = Math.max(1, logNormalRandom(params.meanDistTripPlanned, params.sigmaDistTripPlanned));
    const driverProps = generateDriverProperties(params.driverTypeDensity, params.uniformDriverBehavior, params.driverReactionTime ?? 2.0);

    // Find safe ID
    const newId = updatedCars.length > 0 ? Math.max(...updatedCars.map(c => c.id)) + 1 : 0;
    const lane = Math.floor(Math.random() * numLanesSim);

    const newCar = {
      id: newId,
      name: `Car ${newId + 1}`,
      position: newPosition,
      speed,
      desiredSpeed,
      color: "hsl(142, 72%, 29%)",
      virtualLength,
      physicalLength,
      distTripPlanned,
      distanceTraveled: 0,
      lane,
      lastLaneChange: 0,
      vehicleType,
      laneStabilityCounter: 0,
      acceleration: 0,
      lastLeaderId: -1,
      ...driverProps,
    };
    updatedCars.push(newCar);
    events.push({ type: "enter", carId: newId, carName: newCar.name, position: newPosition, speed });
  }

  return { cars: updatedCars, events };
}

// Calculate acceleration based on current speed, desired speed, and gap
function calculateAcceleration(
  car: Car,
  gapKm: number,
  leaderSpeed: number,
  leaderLength: number,
  params: SimulationParams
): number {
  const kmhToMs = 1000 / 3600;
  const currentSpeedMs = car.speed * kmhToMs;
  const leaderSpeedMs = leaderSpeed * kmhToMs;
  const desiredSpeedMs = (car.desiredSpeed || 130) * kmhToMs;

  // IDM PARAMETERS
  const T = params.tDist || 1.5;         // Safe time headway (seconds)
  const s0 = Math.max(1.0, params.stoppedCarsGap ?? 1.0); // Minimum gap (meters) - strictly enforced 1m floor
  const a = params.aMax || 1.4;          // Max acceleration (m/s^2)
  const b = 2.0;                         // Comfortable deceleration (m/s^2)
  const delta = 4.0;                     // Acceleration exponent (usually 4)

  // 1. FREE FLOW TERM: acceleration toward desired speed
  // a * [1 - (v / v0)^delta]
  // Protect against division by zero if desiredSpeedMs is 0
  const freeFlowTerm = desiredSpeedMs > 0
    ? a * (1 - Math.pow(currentSpeedMs / desiredSpeedMs, delta))
    : 0;

  // 2. INTERACTION TERM: braking due to leader
  // - a * (s* / s)^2

  // Calculate Dynamic Approach Term (s*)
  // s* = s0 + v*T + (v * delta_v) / (2 * sqrt(a * b))
  // deltaV is approach speed: (v - v_leader). Positive means we are faster (closing in).
  const deltaV = currentSpeedMs - leaderSpeedMs;
  const dynamicTerm = (currentSpeedMs * deltaV) / (2 * Math.sqrt(a * b));

  // desiredGap (s*) must include the dynamic term only if we are approaching
  // We clamp it to at least s0 to prevent negative gaps when leader is pulling away
  const sStar = Math.max(s0, s0 + (currentSpeedMs * T) + dynamicTerm);

  // Actual gap in meters (Bumper-to-Bumper)
  // Distance is front-to-front, so we subtract leader's length
  const actualGapMeters = (gapKm * 1000) - leaderLength;

  // JAM DENSITY STABILITY: If we are already at or below the stopped gap and not moving,
  // stay perfectly stationary. Otherwise the IDM term 1-(s*/s)^2 might give a tiny kick.
  // Using s0+0.2 to match the movement enforcement threshold
  if (actualGapMeters <= s0 + 0.2 && currentSpeedMs < 0.1) {
    if (leaderSpeedMs < 0.1) return 0;
  }

  // COLLISION / OVERLAP PROTECTION
  // If cars are overlapping or touching (gap < 0.2m), apply extreme braking
  if (actualGapMeters < 0.2) {
    // Return a hard stop (ignore IDM math)
    return -15.0; // Standardize extreme braking
  }

  // Calculate interaction term with a safety floor for actualGapMeters
  // and a cap on the resulting deceleration to prevent astronomical values
  const gapFloor = 0.5; // Increased floor for stability
  const safeGapForMath = Math.max(gapFloor, actualGapMeters);
  let interactionTerm = -a * Math.pow(sStar / safeGapForMath, 2);

  // Cap deceleration to 15 m/s² (approx 5x params.aMax)
  const decelCap = -15.0;
  if (interactionTerm < decelCap) {
    interactionTerm = decelCap;
  }

  const totalAccel = freeFlowTerm + interactionTerm;
  return Math.max(decelCap, totalAccel);
}

// Find cars in adjacent lanes
function findAdjacentCars(
  car: Car,
  cars: Car[],
  laneLength: number,
  params: SimulationParams
): {
  leftLane: { leader?: Car; follower?: Car };
  rightLane: { leader?: Car; follower?: Car };
} {
  const result = {
    leftLane: { leader: undefined, follower: undefined },
    rightLane: { leader: undefined, follower: undefined },
  };

  // Check if left lane exists
  if (car.lane > 0) {
    const leftLaneCars = cars.filter((c) => c.lane === car.lane - 1);
    if (leftLaneCars.length > 0) {
      // Find closest ahead and closest behind
      const sortedByAhead = [...leftLaneCars].sort((a, b) => {
        const distA = (a.position - car.position + laneLength) % laneLength;
        const distB = (b.position - car.position + laneLength) % laneLength;
        return distA - distB;
      });
      const sortedByBehind = [...leftLaneCars].sort((a, b) => {
        const distA = (car.position - a.position + laneLength) % laneLength;
        const distB = (car.position - b.position + laneLength) % laneLength;
        return distA - distB;
      });

      const leader = sortedByAhead[0];
      const follower = sortedByBehind[0];

      if (leader === follower) {
        // Only one car found. Is it more likely a leader or a follower?
        const distAhead = (leader.position - car.position + laneLength) % laneLength;
        const distBehind = (car.position - leader.position + laneLength) % laneLength;
        if (distAhead < distBehind) {
          result.leftLane.leader = leader;
        } else {
          result.leftLane.follower = leader;
        }
      } else {
        result.leftLane.leader = leader;
        result.leftLane.follower = follower;
      }
    }
  }

  // Check if right lane exists
  if (car.lane < (params.numLanes || 3) - 1) {
    const rightLaneCars = cars.filter((c) => c.lane === car.lane + 1);
    if (rightLaneCars.length > 0) {
      const sortedByAhead = [...rightLaneCars].sort((a, b) => {
        const distA = (a.position - car.position + laneLength) % laneLength;
        const distB = (b.position - car.position + laneLength) % laneLength;
        return distA - distB;
      });
      const sortedByBehind = [...rightLaneCars].sort((a, b) => {
        const distA = (car.position - a.position + laneLength) % laneLength;
        const distB = (car.position - b.position + laneLength) % laneLength;
        return distA - distB;
      });

      const leader = sortedByAhead[0];
      const follower = sortedByBehind[0];

      if (leader === follower) {
        const distAhead = (leader.position - car.position + laneLength) % laneLength;
        const distBehind = (car.position - leader.position + laneLength) % laneLength;
        if (distAhead < distBehind) {
          result.rightLane.leader = leader;
        } else {
          result.rightLane.follower = leader;
        }
      } else {
        result.rightLane.leader = leader;
        result.rightLane.follower = follower;
      }
    }
  }

  return result;
}

// Check if car can maintain desired speed in target lane for look-ahead duration
function canMaintainSpeedInLane(
  car: Car,
  targetLaneLeader: Car | undefined,
  currentLeader: Car | undefined,
  cars: Car[],
  targetLane: number,
  laneLength: number,
  params: SimulationParams,
  lookAheadTime: number = 5, // seconds
  showNotifications: boolean = false
): boolean {
  const desiredSpeed = car.desiredSpeed || 130; // km/h

  // If no leader in target lane, can definitely maintain speed
  if (!targetLaneLeader) {
    return true;
  }

  // Calculate the gap to the target lane leader
  const immediateGap = (targetLaneLeader.position - car.position + laneLength) % laneLength;
  const immediateGapMeters = immediateGap * 1000;

  // MINIMUM GAP REQUIREMENT based on car's current speed
  // Use the same safe following distance calculation as IDM
  // This prevents changing into a lane where we'd immediately need to brake
  const carSpeedMs = (car.speed || 0) * (1000 / 3600); // km/h to m/s
  const targetLeaderSpeedMs = (targetLaneLeader.speed || 0) * (1000 / 3600);

  // Calculate the safe gap we need to avoid braking
  // s* = s0 + v*T + (v * deltaV) / (2 * sqrt(a * b))
  const s0 = Math.max(1.0, params.stoppedCarsGap ?? 1.0); // Minimum gap in meters
  const T = params.tDist || 3;  // Time headway in seconds
  const a = 1.4;  // Max accel
  const b = 2.0;  // Comfortable decel
  const deltaV = carSpeedMs - targetLeaderSpeedMs; // Approach speed

  const dynamicTerm = deltaV > 0 ? (carSpeedMs * deltaV) / (2 * Math.sqrt(a * b)) : 0;
  const requiredGap = s0 + (carSpeedMs * T) + dynamicTerm;

  // If the gap is smaller than what we need for comfortable following, don't allow the change
  if (immediateGapMeters < requiredGap) {
    if (showNotifications) {
      debugLog(showNotifications, `[GAP CHECK] Car ${car.id} blocked - gap ${immediateGapMeters.toFixed(1)}m < required ${requiredGap.toFixed(1)}m (speed: ${car.speed.toFixed(1)}, leader: ${targetLaneLeader.speed.toFixed(1)} km/h)`);
    }
    return false;
  }

  // Calculate look-ahead distance based on car's desired speed
  // Convert km/h to km/s, then multiply by time
  const lookAheadDistance = (desiredSpeed / 3600) * lookAheadTime; // km

  // Find all cars in target lane ahead of our position within look-ahead distance
  const carsInTargetLane = cars.filter((c) => c.lane === targetLane);

  let currentPos = car.position;
  let minPotentialPerformance = Infinity;

  for (const targetCar of carsInTargetLane) {
    const distanceToTargetCar = (targetCar.position - currentPos + laneLength) % laneLength;

    // Only consider cars within look-ahead distance
    if (distanceToTargetCar > 0 && distanceToTargetCar <= lookAheadDistance) {
      // DISTANCE WEIGHTING: A slow car much further ahead is less of an immediate problem.
      // We add a virtual speed bonus based on distance (up to 15 km/h at the edge of look-ahead).
      const distanceFactor = distanceToTargetCar / lookAheadDistance;
      const virtualSpeed = targetCar.speed + (distanceFactor * 15);
      minPotentialPerformance = Math.min(minPotentialPerformance, virtualSpeed);
    }
  }

  // RELATIVE COMPARISON: Instead of an absolute threshold, compare to our current situation.
  const currentPerformance = currentLeader ? currentLeader.speed : desiredSpeed;

  // We only block if the target lane is significantly worse than our current lane.
  // (Using a 5 km/h buffer to allow for slight downgrades that might improve later)
  const canMaintain = minPotentialPerformance >= currentPerformance - 5;

  if (showNotifications && !canMaintain) {
    debugLog(showNotifications, `[LOOK-AHEAD] Car ${car.id} blocked from lane ${targetLane} - target performance: ${minPotentialPerformance.toFixed(1)} km/h < current: ${currentPerformance.toFixed(1)} km/h`);
  }

  return canMaintain;
}

// Calculate MOBIL incentive for lane change
export function calculateLaneChangeIncentive(
  car: Car,
  currentLeader: Car | undefined,
  targetLane: { leader?: Car; follower?: Car },
  params: SimulationParams,
  laneLength: number,
  trafficRule: "american" | "european" = "american",
  showNotifications: boolean = true,
  tick: number
): number {
  // Calculate current acceleration in current lane
  const currentGap = currentLeader
    ? (currentLeader.position - car.position + laneLength) % laneLength
    : laneLength;

  const currentLeaderSpeed = currentLeader?.speed ?? params.maxSpeed;

  const currentLeaderLength = currentLeader?.physicalLength || params.lengthCar || 4.5;

  const currentAccel = calculateAcceleration(
    car,
    currentGap,
    currentLeaderSpeed,
    currentLeaderLength,
    params
  );

  // Calculate acceleration in target lane
  const targetGap = targetLane.leader
    ? (targetLane.leader.position - car.position + laneLength) % laneLength
    : laneLength;

  const targetLeaderSpeed = targetLane.leader?.speed ?? params.maxSpeed;

  // NEW: For European rules, check safe distance but without the extra 1.5x multiplier
  // USER DECISION: The explicit distance check (even at 1.0x) makes behavior too strict compared to MOBIL.
  // We are removing this strict distance check to align safety behavior with the American model,
  // relying purely on the MOBIL braking criterion below.
  let safeGapCheck = true;
  /* 
  Legacy code removed:
  if (trafficRule === "european" && targetLane.follower) {
    const gapBehind = (car.position - targetLane.follower.position + laneLength) % laneLength;
    const followerSpeed = targetLane.follower.speed || 0;
    const followerSafeDist = calculateSafeDistance(followerSpeed, params.tDist || 3) / 1000;

    // Original check was followerSafeDist * 1.5. Now aligning with American/Standard behavior
    // We utilize the new europeanGapFactor parameter (default 1.0)
    const factor = params.europeanGapFactor ?? 1.0;
    safeGapCheck = gapBehind > followerSafeDist * factor;

    if (!safeGapCheck) {
      if (showNotifications && tick % 100 === 0) {
        debugLog(showNotifications, `[EUROPEAN SAFETY] Car ${car.id} blocked from lane change - insufficient gap behind (${gapBehind.toFixed(3)}km < ${(followerSafeDist * factor).toFixed(3)}km)`);
      }
      return -10;
    }
  }
  */

  const targetLeaderLength = targetLane.leader?.physicalLength || params.lengthCar || 4.5;

  const targetAccel = calculateAcceleration(
    car,
    targetGap,
    targetLeaderSpeed,
    targetLeaderLength,
    params
  );

  // SELF-SAFETY: Don't change into a lane where you'd have to slam on the brakes
  const selfSafeDecel = params.mobilSelfSafeDecel ?? -3.0;
  if (targetAccel < selfSafeDecel) {
    if (showNotifications && tick % 100 === 0) {
      debugLog(showNotifications, `[SELF SAFETY] Car ${car.id} blocked - would need to brake too hard in target lane (${targetAccel.toFixed(2)} m/s2)`);
    }
    return -10;
  }

  // Calculate follower's acceleration change (impact on car behind)
  let followerAccelChange = 0;
  if (targetLane.follower) {
    // BEFORE the change: Follower is behind targetLane.leader
    const followerGapBefore = targetLane.leader
      ? (targetLane.leader.position - targetLane.follower.position + laneLength) % laneLength
      : laneLength;

    const followerAccelBefore = calculateAcceleration(
      targetLane.follower,
      followerGapBefore,
      targetLeaderSpeed,
      targetLeaderLength,
      params
    );

    // AFTER the change: Follower is behind 'car'
    const followerGapAfter =
      (car.position - targetLane.follower.position + laneLength) % laneLength;

    const followerAccelAfter = calculateAcceleration(
      targetLane.follower,
      followerGapAfter,
      car.speed,
      car.physicalLength,
      params
    );

    // SAFETY CRITERION: If the lane change would force the follower to brake too hard, return very low incentive.
    const bSafe = params.mobilSafeDecel ?? -2.0;
    if (followerAccelAfter < bSafe) {
      if (showNotifications && tick % 100 === 0) {
        debugLog(showNotifications, `[MOBIL SAFETY] Car ${car.id} blocked - follower ${targetLane.follower.id} would need to brake too hard (${followerAccelAfter.toFixed(2)} m/s2)`);
      }
      return -10;
    }

    followerAccelChange = followerAccelAfter - followerAccelBefore;
  }

  // Base MOBIL incentive calculation
  // Apply politeness factor if specified
  const politeness = params.mobilPoliteness ?? 0.0;
  let incentive = (targetAccel - currentAccel) + politeness * followerAccelChange;

  // Speed deficit already prevents unnecessary changes, so no hysteresis needed

  // Minimum Speed Benefit
  const currentLaneSpeed = currentLeader?.speed ?? params.maxSpeed;
  const targetLaneSpeed = targetLane.leader?.speed ?? params.maxSpeed;
  const speedBenefit = targetLaneSpeed - currentLaneSpeed;
  const speedGainThreshold = params.mobilSpeedGainThreshold ?? 10;

  if (speedBenefit < speedGainThreshold && currentLeader) {
    incentive -= 2.0; // Heavy penalty for insufficient speed benefit
  }

  // NEW: For European rules, if safety check fails, return very low incentive
  if (trafficRule === "european" && !safeGapCheck) {
    return -10; // Very low incentive to prevent lane change
  }

  // ✅ KEY ADDITION: Encourage lane change if current leader is stopped
  if (currentLeader && currentLeader.speed === 0) {
    const stoppedIncentive = params.mobilStoppedIncentive ?? 3.0;
    incentive += stoppedIncentive;
  }

  // Optional: Slight incentive for lane preference (right or left depending on traffic rule)
  // MOVED: Bias logic is now handled in shouldChangeLane to properly support empty lanes
  // and avoid dependency on targetLane.leader existence.

  return incentive;
}

export interface Pack {
  packId: number;
  cars: Car[];
  avgSpeed: number;
  density: number;
  startPos: number;
  endPos: number;
}

// Centralized pack identification logic
export function identifyPacks(
  cars: Car[],
  laneLength: number,
  timeHeadway: number = 2.0, // seconds
  minPackSize: number = 2
): Pack[] {
  if (cars.length === 0) return [];

  const resultPacks: Pack[] = [];
  let packIdCounter = 1;

  // Find the number of lanes based on the max lane index found in cars
  const maxLane = cars.reduce((max, car) => Math.max(max, car.lane), 0);
  const numLanes = maxLane + 1;

  // Process specific lane
  for (let lane = 0; lane < numLanes; lane++) {
    const laneCars = cars.filter(car => car.lane === lane);

    // Sort cars by position in this lane
    const sortedCars = laneCars.sort((a, b) => a.position - b.position);

    if (sortedCars.length < minPackSize) continue;

    let packStartIdx = 0;
    let rawPacks: {
      cars: Car[];
      startPos: number;
      endPos: number;
    }[] = [];

    // First pass: Identify contiguous groups based on dynamic gap threshold
    for (let i = 1; i < sortedCars.length; i++) {
      const car = sortedCars[i];     // The car ahead
      const prevCar = sortedCars[i - 1]; // The car behind (follower)

      // Calculate gap between current car and previous car
      let gap = car.position - prevCar.position;

      if (gap < 0) {
        gap += laneLength;
      }

      // Research-based Platoon Identification (Inspired by Vogel 2006)
      // A car follows another if it's very close OR reasonably close with synchronized speed.
      const followerSpeed = prevCar.speed; // km/h
      const leadSpeed = car.speed;
      const speedDiff = Math.abs(followerSpeed - leadSpeed);

      const tightHeadway = (followerSpeed * timeHeadway) / 3600;
      const looseHeadway = (followerSpeed * (timeHeadway * 1.8)) / 3600; // Grace zone for stable convoys

      // Minimum gap floor to handle stop-and-go/jam density
      const minGapFloor = 0.007;

      let isFollowing = false;
      if (gap <= Math.max(tightHeadway, minGapFloor)) {
        isFollowing = true; // Tight clustering
      } else if (gap <= looseHeadway && speedDiff < 10) {
        isFollowing = true; // Synchronized flow (grace zone)
      }

      // If not following, start a new pack
      if (!isFollowing) {
        // End current pack
        const packCars = sortedCars.slice(packStartIdx, i);
        rawPacks.push({
          cars: packCars,
          startPos: packCars[0].position,
          endPos: packCars[packCars.length - 1].position
        });

        // Start new pack
        packStartIdx = i;
      }
    }

    // Add the last pack
    const lastPackCars = sortedCars.slice(packStartIdx);
    rawPacks.push({
      cars: lastPackCars,
      startPos: lastPackCars[0].position,
      endPos: lastPackCars[lastPackCars.length - 1].position
    });

    // Second pass: Check for wraparound continuity
    if (rawPacks.length > 1) {
      const firstPack = rawPacks[0];
      const lastPack = rawPacks[rawPacks.length - 1];

      const firstCar = firstPack.cars[0];
      const lastCar = lastPack.cars[lastPack.cars.length - 1];

      let wrapGap = firstCar.position - lastCar.position;
      if (wrapGap < 0) wrapGap += laneLength;

      const followerSpeed = lastCar.speed;
      const dynamicThreshold = (followerSpeed * timeHeadway) / 3600;
      const effectiveThreshold = Math.max(dynamicThreshold, 0.005);

      if (wrapGap <= effectiveThreshold) {
        // Merge last pack into first pack
        firstPack.cars = [...lastPack.cars, ...firstPack.cars];
        firstPack.startPos = lastPack.startPos; // Keep logic simple, though strict start/end might be odd with wrap

        // Remove the last pack
        rawPacks.pop();
      }
    }

    // Third pass: Filter by size and create result packs
    for (const rawPack of rawPacks) {
      if (rawPack.cars.length >= minPackSize) {
        const carCount = rawPack.cars.length;

        // Calculate pack length handling wraparound
        let packLength = rawPack.endPos - rawPack.startPos;
        if (packLength < 0) packLength += laneLength;

        // Ensure density makes sense
        const density = packLength > 0.001 ? (carCount / packLength) : 0;

        const avgSpeed = rawPack.cars.reduce((sum, car) => sum + car.speed, 0) / carCount;

        resultPacks.push({
          packId: packIdCounter++,
          cars: rawPack.cars,
          avgSpeed,
          density,
          startPos: rawPack.startPos,
          endPos: rawPack.endPos
        });
      }
    }
  }

  return resultPacks;
}

// Determine if lane change is possible and beneficial
function shouldChangeLane(
  car: Car,
  currentLeader: Car | undefined,
  adjacentLanes: {
    leftLane: { leader?: Car; follower?: Car };
    rightLane: { leader?: Car; follower?: Car };
  },
  cars: Car[],
  params: SimulationParams,
  laneLength: number,
  currentTime: number,
  trafficRule: "american" | "european",
  showNotifications: boolean = true,
  tick: number
): { shouldChange: boolean; targetLane: number | null } {
  const numLanes = params.numLanes || 3;
  const desiredSpeed = car.desiredSpeed || (params.speedLimit || 130);
  const cooldownPeriod = params.laneChangeCooldown ?? 5;
  const cooldownActive = currentTime - (car.lastLaneChange || 0) < cooldownPeriod;

  if (cooldownActive) return { shouldChange: false, targetLane: null };

  const INCENTIVE_THRESHOLD = params.accelerationThreshold ?? 0.2;

  // 1. Calculate incentives
  const leftIncentive = car.lane > 0
    ? calculateLaneChangeIncentive(car, currentLeader, adjacentLanes.leftLane, params, laneLength, trafficRule, showNotifications, tick)
    : -Infinity;

  let rightIncentive = car.lane < numLanes - 1
    ? calculateLaneChangeIncentive(car, currentLeader, adjacentLanes.rightLane, params, laneLength, trafficRule, showNotifications, tick)
    : -Infinity;

  // European biases - must be applied before stickiness for return behavior
  if (trafficRule === "european" && rightIncentive > -9) {
    rightIncentive += (params.rightLaneBias || 0.2);
    if (car.speed >= desiredSpeed * 0.90) rightIncentive += 0.2;
  }

  // 2. Identify candidate while respecting hard safety blocks (-10)
  // If an incentive is below -9, it's a safety rejection and must not be diluted by stickiness
  const leftIsSafe = leftIncentive > -9;
  const rightIsSafe = rightIncentive > -9;

  let adjustedLeft = leftIsSafe ? leftIncentive : -10;
  let adjustedRight = rightIsSafe ? rightIncentive : -10;

  // Lane memory penalty
  if (car.previousLane !== undefined && currentTime - (car.lastLaneChange || 0) < 30.0) {
    if (car.lane - 1 === car.previousLane && leftIsSafe) adjustedLeft -= 0.3;
    if (car.lane + 1 === car.previousLane && rightIsSafe) adjustedRight -= 0.3;
  }

  // 3. Determine if any change is potentially desirable
  let candidateTarget: number | null = null;
  let candidateIncentive = -Infinity;

  // Left Evaluation
  const leftThreshold = (car.pendingLaneChange === car.lane - 1) ? 0.1 : INCENTIVE_THRESHOLD;
  if (leftIsSafe && adjustedLeft > leftThreshold) {
    const overtakeReady = (car.slowDownStartTime && (currentTime - car.slowDownStartTime > 2.0));
    if (overtakeReady && canMaintainSpeedInLane(car, adjacentLanes.leftLane.leader, currentLeader, cars, car.lane - 1, laneLength, params, 5, false)) {
      candidateTarget = car.lane - 1;
      candidateIncentive = adjustedLeft;
    }
  }

  // Right Evaluation
  // Right Evaluation: American rule uses symmetric threshold, European allows easier return (-0.5)
  const rightThreshold = (car.pendingLaneChange === car.lane + 1)
    ? (trafficRule === "american" ? 0.1 : -0.8) // Symmetric hysteresis for American
    : (trafficRule === "european" ? -0.5 : INCENTIVE_THRESHOLD);
  if (rightIsSafe && adjustedRight > rightThreshold && adjustedRight > candidateIncentive) {
    const isEuropeanRightwardCheck = trafficRule === "european" &&
      (car.speed >= desiredSpeed * 0.95 ||
        (car.rightLaneOpportunityStartTime && (currentTime - car.rightLaneOpportunityStartTime > 5.0)) ||
        (car.leftLaneStruggleStartTime && (currentTime - car.leftLaneStruggleStartTime > 10.0)));

    const canMaintain = canMaintainSpeedInLane(car, adjacentLanes.rightLane.leader, currentLeader, cars, car.lane + 1, laneLength, params, 5, false);
    const overtakeReady = trafficRule === "american" ? (car.slowDownStartTime && (currentTime - car.slowDownStartTime > 2.0)) : true;

    if ((canMaintain && overtakeReady) || isEuropeanRightwardCheck) {
      candidateTarget = car.lane + 1;
      candidateIncentive = adjustedRight;
    }
  }

  // 4. Persistent Trigger Check
  const isSlowedDown = car.speed < desiredSpeed * 0.85; // Consistent 15% deficit
  const isRuleBasedReturn = trafficRule === "european" && candidateTarget === car.lane + 1;

  // CRITICAL: If the current pending lane change is now unsafe, we MUST signal a reset
  if (car.pendingLaneChange !== undefined) {
    const pendingLaneIncentive = car.pendingLaneChange === car.lane - 1 ? leftIncentive : rightIncentive;
    if (pendingLaneIncentive <= -9) {
      // Safety violation detected for the move we are already waiting for!
      return { shouldChange: false, targetLane: -1 }; // Sentinel to trigger reset
    }
  }

  const isTriggered = isSlowedDown || isRuleBasedReturn || car.pendingLaneChange !== undefined;

  if (candidateTarget !== null && isTriggered) {
    return { shouldChange: true, targetLane: candidateTarget };
  }

  return { shouldChange: false, targetLane: null };
}

// Enhanced lane change function with exit behavior
function shouldChangeLaneWithExitBehavior(
  car: Car,
  currentLeader: Car | undefined,
  adjacentLanes: {
    leftLane: { leader?: Car; follower?: Car };
    rightLane: { leader?: Car; follower?: Car };
  },
  cars: Car[],
  params: SimulationParams,
  laneLength: number,
  currentTime: number,
  trafficRule: "american" | "european",
  shouldMoveToExitLane: boolean,
  showNotifications: boolean = true,
  tick: number
): { shouldChange: boolean; targetLane: number | null } {
  const numLanes = params.numLanes || 1;
  const isInExitLane = car.lane === 0 || car.lane === numLanes - 1;

  let provisionalTarget: number | null = null;
  let isExitMove = false;

  // 1. Regular logic first
  const std = shouldChangeLane(car, currentLeader, adjacentLanes, cars, params, laneLength, currentTime, trafficRule, showNotifications, tick);
  if (std.shouldChange) {
    provisionalTarget = std.targetLane;
  }

  // 2. Override with exit logic if needed (takes priority)
  if (shouldMoveToExitLane && !isInExitLane) {
    const preferredExitLane = numLanes - 1;
    let exitTarget: number | null = null;

    if (car.lane < preferredExitLane) {
      const incentive = calculateLaneChangeIncentive(car, currentLeader, adjacentLanes.rightLane, params, laneLength, trafficRule, showNotifications, tick);
      // Safety check: Never bypass -10 barrier
      if (incentive > -0.9) exitTarget = car.lane + 1;
    } else if (car.lane > preferredExitLane) {
      const incentive = calculateLaneChangeIncentive(car, currentLeader, adjacentLanes.leftLane, params, laneLength, trafficRule, showNotifications, tick);
      if (incentive > -0.9) exitTarget = car.lane - 1;
    }

    if (exitTarget !== null) {
      provisionalTarget = exitTarget;
      isExitMove = true;
    }
  }

  // 3. UNIFIED HYSTERESIS TIMER
  if (provisionalTarget !== null && provisionalTarget !== -1) {
    if (car.pendingLaneChange === provisionalTarget && car.laneChangeOpportunityDetectedTime) {
      const duration = currentTime - car.laneChangeOpportunityDetectedTime;
      if (duration >= 5.0) {
        debugLog(showNotifications, `[HYSTERESIS] Car ${car.id} CONFIRMED ${isExitMove ? "EXIT " : ""}change to ${provisionalTarget} after ${duration.toFixed(1)}s`);
        return { shouldChange: true, targetLane: provisionalTarget };
      }
      return { shouldChange: false, targetLane: null };
    } else {
      car.pendingLaneChange = provisionalTarget;
      car.laneChangeOpportunityDetectedTime = currentTime;
      debugLog(showNotifications, `[HYSTERESIS] Car ${car.id} DETECTED ${isExitMove ? "EXIT " : ""}opportunity to ${provisionalTarget}. Timer started.`);
      return { shouldChange: false, targetLane: null };
    }
  } else {
    // Reset if no opportunity found OR safety violation detected (-1 sentinel)
    if (car.pendingLaneChange !== undefined) {
      if (provisionalTarget === -1) {
        debugLog(showNotifications, `[HYSTERESIS RESET] Car ${car.id} CANCELLED pending change to ${car.pendingLaneChange} - now UNSAFE.`);
      } else if (tick % 50 === 0) {
        debugLog(showNotifications, `[HYSTERESIS RESET] Car ${car.id} lost opportunity to ${car.pendingLaneChange}.`);
      }
    }
    car.pendingLaneChange = undefined;
    car.laneChangeOpportunityDetectedTime = undefined;
    return { shouldChange: false, targetLane: null };
  }
}
