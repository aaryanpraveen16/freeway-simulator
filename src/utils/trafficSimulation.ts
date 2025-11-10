// Constants and types for traffic simulation
export interface Car {
  id: number;
  name: string; // Add name property
  position: number; // position in the loop in meters (0 to laneLength)
  speed: number; // speed in km/h
  desiredSpeed: number; // desired speed in km/h
  color: string; // color for visualization
  virtualLength: number; // physical length + safe distance in meters
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
  politenessFactor?: number; // MOBIL politeness factor
  rightLaneBias?: number; // bias for right lane
  accelerationThreshold?: number; // threshold for lane change
  laneChangeCooldown?: number; // min time between lane changes (seconds)
  simulationDuration?: number; // simulation duration in seconds (0 = unlimited)
  uniformDriverBehavior?: boolean; // if true, all drivers have same lane change probability (default false)
}

// Default simulation parameters
export const defaultParams: SimulationParams = {
  trafficDensity: 0.62, // 1 car per 1.6 km (converted from 1 car per mile)
  vehicleTypeDensity: {
    car: 100,    // 100% cars by default
    truck: 0,    // No trucks by default
    motorcycle: 0, // No motorcycles by default
  },
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
  freewayLength: 16, // km (about 10 miles)
  numLanes: 2, // default to 2 lanes
  politenessFactor: 0.3, // typical MOBIL value
  rightLaneBias: 0.1, // small bias for right lane
  accelerationThreshold: 0.2, // threshold for lane change
  laneChangeCooldown: 2, // seconds
  simulationDuration: 600, // 10 minutes by default, 0 would be unlimited but we're setting a max
  uniformDriverBehavior: true, // default to uniform driver behavior for deterministic lane changes
};

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

// Generate random number from log-normal distribution (returns miles)
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

// Calculate virtual car length (physical length + safe distance) in miles
export function calculateVirtualLength(
  speed: number,
  params: SimulationParams
): number {
  const lengthCarMiles = params.lengthCar;
  const safeDistance = calculateSafeDistance(speed, params.tDist);
  return lengthCarMiles + safeDistance;
}

// Generate driver type and associated properties
function generateDriverProperties(
  driverTypeDensity: {
    aggressive: number;
    normal: number;
    conservative: number;
  },
  uniformDriverBehavior: boolean = false
): {
  driverType: "aggressive" | "normal" | "conservative";
  laneChangeProbability: number;
  laneStickiness: number;
} {
  const rand = Math.random();
  
  // Convert percentages to cumulative probabilities
  const aggressiveThreshold = driverTypeDensity.aggressive / 100;
  const normalThreshold = aggressiveThreshold + (driverTypeDensity.normal / 100);

  // Uniform behavior: all drivers change lanes deterministically when conditions are favorable
  if (uniformDriverBehavior) {
    const uniformLaneChangeProbability = 1.0; // Always change lanes when conditions are favorable
    const uniformLaneStickiness = 0.0; // No stickiness - don't resist lane changes
    
    // Still assign driver types for visualization/identification purposes
    if (rand < aggressiveThreshold) {
      return {
        driverType: "aggressive",
        laneChangeProbability: uniformLaneChangeProbability,
        laneStickiness: uniformLaneStickiness,
      };
    } else if (rand < normalThreshold) {
      return {
        driverType: "normal",
        laneChangeProbability: uniformLaneChangeProbability,
        laneStickiness: uniformLaneStickiness,
      };
    } else {
      return {
        driverType: "conservative",
        laneChangeProbability: uniformLaneChangeProbability,
        laneStickiness: uniformLaneStickiness,
      };
    }
  }

  // Normal behavior: different probabilities for different driver types
  if (rand < aggressiveThreshold) {
    // Aggressive driver
    return {
      driverType: "aggressive",
      laneChangeProbability: normalRandom(0.8, 0.1, 0.6, 1.0),
      laneStickiness: normalRandom(0.3, 0.1, 0.1, 0.5),
    };
  } else if (rand < normalThreshold) {
    // Normal driver
    return {
      driverType: "normal",
      laneChangeProbability: normalRandom(0.5, 0.15, 0.2, 0.8),
      laneStickiness: normalRandom(0.6, 0.15, 0.3, 0.9),
    };
  } else {
    // Conservative driver
    return {
      driverType: "conservative",
      laneChangeProbability: normalRandom(0.2, 0.1, 0.05, 0.4),
      laneStickiness: normalRandom(0.8, 0.1, 0.6, 1.0),
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

  // Calculate total number of cars based on overall traffic density (cars/mile)
  // Total cars = density (cars/mile) * lane length (miles)
  const totalCars = Math.round(params.trafficDensity * laneLength);
  
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

      // Calculate virtual length based on vehicle type and initial speed (in miles)
      const vehicleLengthMiles = (vehicleProps.lengthMeters * 3.28084) / 5280; // Convert meters to miles
      const modifiedParams = { ...params, lengthCar: vehicleLengthMiles };
      const virtualLength = calculateVirtualLength(speed, modifiedParams);

      // Generate planned trip distance using log-normal distribution (km)
      const minTripDistance = 1; // minimum trip distance in km
      const distTripPlannedRaw = logNormalRandom(params.meanDistTripPlanned, params.sigmaDistTripPlanned);
      const distTripPlanned = Math.max(
        minTripDistance,
        distTripPlannedRaw
      );
      debugLog(showNotifications, `[DEBUG] Car ${carId}: meanDistTripPlanned=${params.meanDistTripPlanned}, sigmaDistTripPlanned=${params.sigmaDistTripPlanned}, raw=${distTripPlannedRaw}, final=${distTripPlanned}`);

      // Generate driver properties
      const driverProps = generateDriverProperties(params.driverTypeDensity, params.uniformDriverBehavior);

      cars.push({
        id: carId,
        name: `Car ${carId + 1}`,
        position: 0, // Will be set properly later (in miles)
        speed,
        desiredSpeed,
        color: "hsl(142, 72%, 29%)", // Start all cars with green color
        virtualLength,
        distTripPlanned,
        distanceTraveled: 0,
        lane,
        lastLaneChange: 0,
        vehicleType,
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
    
    // Calculate spacing between cars (in meters)
    const spacing = laneLength / carsInLane.length;
    
    // Position cars with even spacing
    for (let i = 0; i < carsInLane.length; i++) {
      // Calculate position with some randomness to prevent perfect alignment
      const position = (i * spacing + Math.random() * spacing * 0.1) % laneLength;
      carsInLane[i].position = position; // always in kilometers
      
      // Set initial speed to desired speed with some variation
      carsInLane[i].speed = Math.max(
        params.minSpeed,
        Math.min(
          carsInLane[i].desiredSpeed * (0.9 + Math.random() * 0.2), // 90-110% of desired speed
          params.speedLimit
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
  const currentCar = cars[carIndex];
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

  // Convert car length to km and subtract from distance to get actual gap
  const gap = distance - (carLength / 1000); // Convert meters to km
  
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
  showNotifications: boolean = true
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
  
  const updatedCars = [...cars];
  const numCars = cars.length;
  const carColors = [
    "hsl(var(--car-red))",
    "hsl(var(--car-blue))",
    "hsl(var(--car-green))",
    "hsl(var(--car-yellow))",
    "hsl(var(--car-purple))",
    "hsl(var(--car-orange))",
  ];
  const movements: {
    newPosition: number;
    newSpeed: number;
    distanceTraveled: number;
  }[] = [];
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
    return updatedCars[a].position - updatedCars[b].position;
  });

  // Apply simulation speed to the timestep
  const effectiveDt = params.dt * simulationSpeed;
  
  // Debug tick-based logging to verify rule and execution
  const tick = Math.round(currentTime / params.dt);

  for (let i = 0; i < numCars; i++) {
    const carIndex = sortedIndices[i];
    const car = updatedCars[carIndex];
    let carSpeed = car.speed;

    // Check if this car is stopped for testing
    if (stoppedCars.has(car.id)) {
      carSpeed = 0;
      car.color = "black"; // Set stopped cars to black
      movements[carIndex] = {
        newPosition: car.position,
        newSpeed: 0,
        distanceTraveled: car.distanceTraveled,
      };
      continue; // Skip all other processing for stopped cars
    }

    // Check if car is about to exit (within 1 mile of trip completion)
    const distanceToExit = car.distTripPlanned - car.distanceTraveled;
    const shouldMoveToExitLane = distanceToExit <= 1 && distanceToExit > 0;
    
    // Find the car ahead in the same lane
    let currentLane = car.lane;
    let sameLaneCars = updatedCars.filter((c) => c.lane === currentLane);
    let sortedSameLaneCars = sameLaneCars.sort((a, b) => {
      const distA = (a.position - car.position + laneLength) % laneLength;
      const distB = (b.position - car.position + laneLength) % laneLength;
      return distA - distB;
    });
    let aheadCar = sortedSameLaneCars.find(
      (c) => (c.position - car.position + laneLength) % laneLength > 0
    );

    // Calculate gap to car ahead in kilometers (with wrap-around)
    let gap = aheadCar
      ? (aheadCar.position - car.position + laneLength) % laneLength
      : laneLength;

    // Calculate safe following distance in kilometers
    const safeDistKm = calculateSafeDistance(carSpeed, params.tDist) / 1000; // meters to km
    const bufferKm = 0.005; // 5 meters in km
    const safeGap = safeDistKm + bufferKm; // Removed car length since it's already accounted for in calculateDistanceToCarAhead

    const aheadCarSpeed = aheadCar?.speed || 0;
    
    // Debug logging to verify rule and execution (every 10 ticks)
    if (car.id === 0 && tick % 10 === 0) {
      debugLog(showNotifications, `[SIM TICK] rule=${rule} t=${currentTime.toFixed(1)}s car=${car.id} lane=${car.lane}`);
    }
    
    // EARLY EUROPEAN OVERTAKE EVALUATION - before cars brake too much
    // This addresses the issue that cars brake before reaching the "too-close" lane change trigger
    if (rule === "european" && car.id === 0 && tick % 5 === 0) {
      debugLog(showNotifications, `[EUROPEAN CHECK] Car ${car.id} in lane ${car.lane} - gap: ${gap.toFixed(3)}km, safeGap: ${safeGap.toFixed(3)}km, aheadCar: ${aheadCar ? `speed ${aheadCarSpeed.toFixed(1)}km/h` : 'none'}`);
    }
    
    if (rule === "european" && aheadCar) {
      const desiredSpeed = car.desiredSpeed || params.speedLimit || 130;
      const speedDifference = desiredSpeed - aheadCarSpeed;
      const isBlockedBySlowCar = speedDifference >= 5 && gap <= safeGap * 1.2;
      
      if (isBlockedBySlowCar && car.lane > 0) {
        // Stricter cooldown to prevent oscillation - minimum 3 seconds between lane changes
        const laneChangeCooldown = Math.max(params.laneChangeCooldown || 5, 3);
        const timeSinceLastChange = currentTime - (car.lastLaneChange || 0);
        const canAttemptOvertake = timeSinceLastChange >= laneChangeCooldown ||
          (speedDifference >= 15 && timeSinceLastChange >= 1); // Very high speed difference allows shorter cooldown
        
        if (canAttemptOvertake) {
          const adjacentLanes = findAdjacentCars(car, updatedCars, laneLength, params);
          const leftLaneLeader = adjacentLanes.leftLane.leader;
          const leftLaneFollower = adjacentLanes.leftLane.follower;
          
          const leftGapAhead = !leftLaneLeader ? Infinity : 
            ((leftLaneLeader.position - car.position + laneLength) % laneLength);
          const leftGapBehind = !leftLaneFollower ? Infinity : 
            ((car.position - leftLaneFollower.position + laneLength) % laneLength);
          
          // Stricter safety requirements: 1.5x safeGap ahead and behind for more conservative lane changes (using follower's speed)
          const safetyBuffer = 1.5;
          
          // Calculate follower's safe gap for more accurate safety check
          let leftFollowerSafeGap = safeGap; // Default to car's safe gap if no follower
          if (leftLaneFollower) {
            const leftFollowerSpeed = leftLaneFollower.speed || 0;
            const leftFollowerSafeDist = calculateSafeDistance(leftFollowerSpeed, params.tDist || 3) / 1000;
            leftFollowerSafeGap = leftFollowerSafeDist + 0.005;
          }
          
          const leftLaneIsSafe = leftGapAhead > safeGap * safetyBuffer && 
                                leftGapBehind > leftFollowerSafeGap * safetyBuffer;
          
          // Additional safety check: don't move if follower is approaching fast
          const followerSpeedCheck = !leftLaneFollower || 
            leftLaneFollower.speed <= car.speed + 10; // Follower not more than 10 km/h faster
          
          // NEW: Check if lane change would cause car behind to slow down
          const willCauseBehindToSlowDown = (follower: Car | undefined, gapBehind: number, currentSpeed: number) => {
            if (!follower) return false; // No follower, no issue
            
            // Calculate the safe following distance the follower would need
            const followerSafeDist = calculateSafeDistance(follower.speed, params.tDist || 3) / 1000;
            const followerSafeGap = followerSafeDist + 0.005;
            
            // If the gap behind is less than what the follower needs, they would have to slow down
            const wouldNeedToSlowDown = gapBehind < followerSafeGap * 1.2;
            
            // Also check if our speed is significantly lower than follower's speed
            const speedDifference = follower.speed - currentSpeed;
            const isMuchSlower = speedDifference > 15; // If we're 15+ km/h slower
            
            return wouldNeedToSlowDown || isMuchSlower;
          };
          
          const willCauseLeftBehindToSlow = willCauseBehindToSlowDown(leftLaneFollower, leftGapBehind, car.speed);
          
          if (leftLaneIsSafe && followerSpeedCheck && !willCauseLeftBehindToSlow) {
            debugLog(showNotifications, `[EUROPEAN OVERTAKE] Car ${car.id} moving LEFT early to overtake (gap: ${gap.toFixed(3)}km, safeGap: ${safeGap.toFixed(3)}km, speedDiff: ${speedDifference.toFixed(1)}km/h), from lane ${car.lane} to ${car.lane - 1}`);
            
            // Perform the lane change immediately
            updatedCars[carIndex].lane = car.lane - 1;
            updatedCars[carIndex].lastLaneChange = currentTime;
            updatedCars[carIndex].isOvertaking = true;
            updatedCars[carIndex].overtakeStartTime = currentTime;
            currentLane = car.lane - 1; // Update currentLane for subsequent calculations
            
            // Recalculate aheadCar and gap in new lane
            currentLane = car.lane - 1;
            sameLaneCars = updatedCars.filter((c) => c.lane === currentLane);
            sortedSameLaneCars = sameLaneCars.sort((a, b) => {
              const distA = (a.position - car.position + laneLength) % laneLength;
              const distB = (b.position - car.position + laneLength) % laneLength;
              return distA - distB;
            });
            aheadCar = sortedSameLaneCars.find(
              (c) => (c.position - car.position + laneLength) % laneLength > 0
            );
            gap = aheadCar
              ? (aheadCar.position - car.position + laneLength) % laneLength
              : laneLength;
          } else if (leftLaneIsSafe && followerSpeedCheck && willCauseLeftBehindToSlow) {
            // Log when we would have overtaken but didn't due to safety concern
            debugLog(showNotifications, `[EUROPEAN SAFETY] Car ${car.id} NOT overtaking LEFT early - would cause car behind to slow down (gap: ${leftGapBehind.toFixed(3)}km, follower speed: ${leftLaneFollower?.speed.toFixed(1) || 'N/A'} km/h, our speed: ${car.speed.toFixed(1)} km/h)`);
          }
        }
      }
    }
    
    // Use only safeGap for all distance calculations
    // If there's no car ahead or we have safe distance, maintain or increase speed
    if (!aheadCar || gap > safeGap) {
      // If far ahead, accelerate towards desired speed (in km/h)
      const acceleration = params.aMax * 3.6; // Convert m/s² to km/h/s
      carSpeed = Math.min(carSpeed + acceleration * effectiveDt, car.desiredSpeed);
    } else {
      // Start braking when we're closer than safe distance
      const criticalDistance = safeGap * 0.5; // Point where we need emergency braking
      
      if (aheadCarSpeed === 0) {
        // Approaching a stopped car - gradual braking based on distance
        const stopDistance = 0.005; // 5 meters minimum stopping distance in km
        if (gap > stopDistance * 2) {
          // Gradual deceleration when we have room
          const decelerationRate = params.aMax * 0.4 * 3.6; // Gentle braking
          carSpeed = Math.max(carSpeed - decelerationRate * effectiveDt, 0);
        } else if (gap > stopDistance) {
          // More urgent braking when closer
          const decelerationRate = params.aMax * 0.8 * 3.6; // More aggressive braking
          carSpeed = Math.max(carSpeed - decelerationRate * effectiveDt, 0);
        } else {
          // Very close to stopped car - stop completely
          carSpeed = 0;
        }
      } else {
        // Car ahead is moving - match speed with a safe following distance
        const speedDifference = carSpeed - aheadCarSpeed;
        
        if (speedDifference > 10) {
          // Significant speed difference - gentle braking
          const decelerationRate = params.aMax * 0.5 * 3.6;
          carSpeed = Math.max(carSpeed - decelerationRate * effectiveDt, aheadCarSpeed);
        } else if (speedDifference > 0) {
          // Small speed difference - very gentle adjustment
          const adjustment = speedDifference * 0.2; // Gradually reduce difference
          carSpeed = carSpeed - adjustment * effectiveDt;
        } else {
          // We're slower or same speed - maintain current speed
          carSpeed = Math.min(carSpeed + params.aMax * 0.2 * 3.6 * effectiveDt, aheadCarSpeed);
        }
      }
    }

    // Ensure we don't exceed speed limit
    carSpeed = Math.min(carSpeed, params.speedLimit);
    car.virtualLength = calculateVirtualLength(carSpeed, params) / 1000; // meters to km
    
    // Calculate movement for this time step (convert km/h to km/frame)
    let potentialMove = carSpeed * (1/3600) * effectiveDt; // km/h to km/s to km/frame
    
    // Debug single car scenario
    if (car.id === 0 && updatedCars.length === 1) {
      debugLog(showNotifications, `[SINGLE CAR DEBUG] Car ${car.id} in lane ${car.lane}, no other cars - should be free to change lanes`);
    }
    
    // Ensure we have some minimum movement to prevent cars from getting stuck (but only if not blocked)
    if (!aheadCar || gap > safeGap) {
      const minMove = 0.00001 * effectiveDt; // 1 cm per second in km
      potentialMove = Math.max(potentialMove, minMove);
    }
    
    // Ensure we don't move past the car ahead
    if (aheadCar) {
      const distanceToCarAhead = (aheadCar.position - car.position + laneLength) % laneLength;
      const safeDistance = (calculateSafeDistance(carSpeed, params.tDist) + params.lengthCar) / 1000; // meters to km
      potentialMove = Math.max(0, Math.min(potentialMove, distanceToCarAhead - safeDistance));
    }

    // Final check: prevent moving too close to car ahead (gap is in km)
    if (gap - potentialMove < safeGap) {
      // Try lane change first
      const adjacentLanes = findAdjacentCars(
        car,
        updatedCars,
        laneLength,
        params
      );
      
      // Debug lane change trigger
      if (car.id === 0) {
        debugLog(showNotifications, `[LANE CHANGE DEBUG] Car ${car.id} checking lane change - gap ahead: ${gap.toFixed(1)}, safeGap: ${safeGap.toFixed(1)}, will try lane change`);
      }

      // Enhanced lane change logic for exit behavior
      const { shouldChange, targetLane } = shouldChangeLaneWithExitBehavior(
        car,
        aheadCar,
        adjacentLanes,
        params,
        laneLength,
        currentTime,
        rule,
        shouldMoveToExitLane,
        showNotifications
      );

      if (shouldChange && targetLane !== null) {
        // Perform lane change
        updatedCars[carIndex].lane = targetLane;
        updatedCars[carIndex].lastLaneChange = currentTime;
        
        // Add lane change event
        events.push({
          type: "laneChange",
          carId: car.id,
          carName: car.name,
          position: car.position,
          speed: car.speed,
          lane: targetLane,
        });

        // Recalculate aheadCar and gap in new lane
        currentLane = targetLane;
        sameLaneCars = updatedCars.filter((c) => c.lane === currentLane);
        sortedSameLaneCars = sameLaneCars.sort((a, b) => {
          const distA = (a.position - car.position + laneLength) % laneLength;
          const distB = (b.position - car.position + laneLength) % laneLength;
          return distA - distB;
        });
        aheadCar = sortedSameLaneCars.find(
          (c) => (c.position - car.position + laneLength) % laneLength > 0
        );
        gap = aheadCar
          ? (aheadCar.position - car.position + laneLength) % laneLength
          : laneLength;

        // Recalculate potential move and gap again
        if (gap - potentialMove < safeGap) {
          // Still too close after lane change - apply gradual braking
          const emergencyBraking = Math.max(carSpeed * 0.6, 5);
          carSpeed = Math.max(emergencyBraking, 0);
          potentialMove = carSpeed * (1/3600) * effectiveDt;
          // Maintain safe gap with a small buffer
          potentialMove = Math.min(potentialMove, Math.max(0, gap - safeGap * 0.9));
        }
      } else {
        // No valid lane change - apply gradual braking
        const emergencyDeceleration = params.aMax * 1.2 * 3.6;
        carSpeed = Math.max(carSpeed - emergencyDeceleration * effectiveDt, 0);
        
        // Calculate movement to maintain safe gap
        potentialMove = carSpeed * (1/3600) * effectiveDt;
        potentialMove = Math.min(potentialMove, Math.max(0, gap - safeGap * 0.9));
      }
    }

    // Calculate new position in km
    const newPosition = (car.position + potentialMove) % laneLength;
    const newDistanceTraveled = car.distanceTraveled + potentialMove;
    movements[carIndex] = {
      newPosition,
      newSpeed: carSpeed,
      distanceTraveled: newDistanceTraveled,
    };
  }

  for (let i = 0; i < numCars; i++) {
    updatedCars[i].position = movements[i].newPosition;
    updatedCars[i].speed = movements[i].newSpeed;
    updatedCars[i].distanceTraveled = movements[i].distanceTraveled;

    // Set color based on entry/exit distance (unless stopped)
    if (!stoppedCars.has(updatedCars[i].id)) {
      updatedCars[i].color = getCarColor(updatedCars[i]);
    }

    if (updatedCars[i].distanceTraveled >= updatedCars[i].distTripPlanned) {
      carsToRemove.push({ index: i, car: updatedCars[i] });
    }
  }

  // Debug traffic rule every few frames
  if (updatedCars.length > 0 && updatedCars[0].id === 0 && tick % 20 === 0) {
    debugLog(showNotifications, `[RULE VERIFICATION] Traffic rule is: ${rule} (original: ${trafficRule})`);
  }

  // EUROPEAN OVERTAKING STATE MANAGEMENT: Clear overtaking state when maneuver is complete
  // This prevents cars from being stuck in overtaking mode forever
  if (rule === "european") {
    for (let i = 0; i < updatedCars.length; i++) {
      const car = updatedCars[i];
      
      // Check if car is in overtaking state and should be cleared
      if (car.isOvertaking && car.overtakeStartTime) {
        const overtakeTime = currentTime - car.overtakeStartTime;
        const minOvertakeDuration = 8; // Minimum 8 seconds to complete overtaking
        
        if (car.id === 0) {
          debugLog(showNotifications, `[OVERTAKING DEBUG] Car ${car.id} isOvertaking: ${car.isOvertaking}, overtakeTime: ${overtakeTime.toFixed(1)}s`);
        }
        
        // Find cars in the lane to the right (original lane)
        const rightLaneCars = updatedCars.filter(c => c.lane === car.lane + 1);
        
        // Check if we've successfully passed the slower car(s)
        const hasPassedSlowerCars = rightLaneCars.every(rightCar => {
          const distance = ((car.position - rightCar.position + laneLength) % laneLength);
          return distance > 0.1; // We're at least 100m ahead of cars in the right lane
        });
        
        // Clear overtaking state if:
        // 1. Minimum time has passed AND we've passed slower cars, OR
        // 2. A very long time has passed (safety net)
        const shouldClearOvertaking = (overtakeTime >= minOvertakeDuration && hasPassedSlowerCars) || 
                                     (overtakeTime >= 20); // Safety net: clear after 20 seconds
        
        if (shouldClearOvertaking) {
          updatedCars[i].isOvertaking = false;
          updatedCars[i].overtakeStartTime = undefined;
          
          if (car.id === 0) {
            debugLog(showNotifications, `[OVERTAKING COMPLETE] Car ${car.id} cleared overtaking state after ${overtakeTime.toFixed(1)}s`);
          }
        }
      }
    }
  }

  // EUROPEAN PROACTIVE LANE CHANGE: Check if cars can move rightward
  // This runs independently of traffic pressure to enforce "keep right" principle
  // BUT respects overtaking maneuvers to prevent oscillation
  if (rule === "european") {
    for (let i = 0; i < updatedCars.length; i++) {
      const car = updatedCars[i];
      
      // Only check cars not in rightmost lane
      // NOTE: Lane 0 = leftmost, highest lane number = rightmost
      const numLanes = params.numLanes || 3;
      
      if (car.id === 0) {
        debugLog(showNotifications, `[PROACTIVE ENTRY] Car ${car.id} - lane: ${car.lane}, numLanes: ${numLanes}, rightmost: ${numLanes - 1}, shouldCheck: ${car.lane < numLanes - 1}`);
      }
      
      if (car.lane < numLanes - 1) {
        // Check if car is currently overtaking and should wait before returning right
        const isCurrentlyOvertaking = car.isOvertaking && car.overtakeStartTime;
        const overtakeTime = isCurrentlyOvertaking ? currentTime - car.overtakeStartTime : 0;
        const minOvertakeTime = 10; // Increased to 10 seconds to complete overtaking properly
        
        if (car.id === 0) {
          debugLog(showNotifications, `[PROACTIVE DEBUG] Car ${car.id} isOvertaking: ${isCurrentlyOvertaking}, overtakeTime: ${overtakeTime.toFixed(1)}s, lane: ${car.lane}`);
        }
        
        // Respect lane change cooldowns and overtaking state
        const timeSinceLastChange = currentTime - (car.lastLaneChange || 0);
        const minCooldown = 8; // Increased to 8 seconds between lane changes to prevent oscillation
        
        // Additional check: only move right if car can maintain reasonable speed in current lane
        const desiredSpeed = car.desiredSpeed || (params.speedLimit || 130);
        const currentSpeed = car.speed || 0;
        const canMaintainCurrentSpeed = currentSpeed >= desiredSpeed * 0.8; // 80% of desired speed
        
        const canMoveRight = (params.uniformDriverBehavior || timeSinceLastChange >= minCooldown) && 
                           (!isCurrentlyOvertaking || overtakeTime >= minOvertakeTime) &&
                           canMaintainCurrentSpeed; // Only move right if not significantly slowed down
        
        if (canMoveRight) {
          const adjacentLanes = findAdjacentCars(car, updatedCars, laneLength, params);
          
          if (car.id === 0) {
            debugLog(showNotifications, `[EUROPEAN PROACTIVE] Car ${car.id} in lane ${car.lane} - checking proactive rightward move (overtaking: ${isCurrentlyOvertaking}, time: ${overtakeTime.toFixed(1)}s)`);
          }
          
          const { shouldChange, targetLane } = shouldChangeLaneWithExitBehavior(
            car,
            undefined, // No current leader constraint for proactive moves
            adjacentLanes,
            params,
            laneLength,
            currentTime,
            rule,
            false, // Not exiting
            showNotifications
          );
          
          if (car.id === 0) {
            debugLog(showNotifications, `[LANE CHANGE RESULT] Car ${car.id} - shouldChange: ${shouldChange}, targetLane: ${targetLane}, currentLane: ${car.lane}`);
          }

          if (shouldChange && targetLane !== null && targetLane > car.lane) {
            // Additional check: make sure we're not moving back into the path of a slow car we just overtook
            const rightLaneCars = updatedCars.filter(c => c.lane === targetLane);
            const nearbySlowCars = rightLaneCars.filter(otherCar => {
              const distance = Math.abs((otherCar.position - car.position + laneLength) % laneLength);
              return distance < 0.3 && otherCar.speed < car.speed - 15; // Increased distance and speed difference
            });
            
            // Additional safety check: ensure right lane has reasonable speed potential
            const rightLaneLeader = rightLaneCars.find(c => {
              const distance = ((c.position - car.position + laneLength) % laneLength);
              return distance > 0 && distance < 0.5; // Within 500m ahead
            });
            
            const rightLaneHasGoodSpeed = !rightLaneLeader || rightLaneLeader.speed >= desiredSpeed * 0.7;
            
            if (nearbySlowCars.length === 0 && rightLaneHasGoodSpeed) {
              updatedCars[i].lane = targetLane;
              updatedCars[i].lastLaneChange = currentTime;
              
              // Clear overtaking state when returning to right lane
              updatedCars[i].isOvertaking = false;
              updatedCars[i].overtakeStartTime = undefined;
              
              if (car.id === 0) {
                debugLog(showNotifications, `[EUROPEAN FIX] Car ${car.id} moving RIGHT - safe return to rightmost lane, from lane ${car.lane} to ${targetLane}`);
              }
              
              events.push({
                type: "laneChange",
                carId: car.id,
                carName: car.name,
                position: car.position,
                speed: car.speed,
                lane: targetLane,
              });
            } else if (car.id === 0) {
              debugLog(showNotifications, `[EUROPEAN WAIT] Car ${car.id} waiting to return right - slow car still nearby`);
            }
          }
        } else if (car.id === 0) {
          debugLog(showNotifications, `[EUROPEAN COOLDOWN] Car ${car.id} on cooldown - time since last change: ${timeSinceLastChange.toFixed(1)}s, overtaking: ${isCurrentlyOvertaking}`);
        }
      }
    }
  }

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

  const numLanes = params.numLanes || 1;

  for (let i = 0; i < carsToRemove.length; i++) {
    const newPosition = 0;
    
    // Generate vehicle type for new car
    const vehicleType = generateVehicleType(params);
    const vehicleProps = getVehicleProperties(vehicleType);
    
    const desiredSpeed = normalRandom(
      params.meanSpeed * vehicleProps.speedModifier,
      params.stdSpeed,
      params.minSpeed,
      params.maxSpeed
    );
    const speed = desiredSpeed;
    
    // Calculate virtual length based on vehicle type (convert meters to miles)
    const vehicleLengthMiles = (vehicleProps.lengthMeters * 3.28084) / 5280;
    const modifiedParams = { ...params, lengthCar: vehicleLengthMiles };
    const virtualLength = calculateVirtualLength(speed, modifiedParams);
    
    const minTripDistance = 1; // km
    const distTripPlanned = Math.max(
      minTripDistance,
      logNormalRandom(
        params.meanDistTripPlanned,
        params.sigmaDistTripPlanned
      )
    );

    // Generate driver properties for new car
    const driverProps = generateDriverProperties(params.driverTypeDensity, params.uniformDriverBehavior);

    const newId =
      updatedCars.length > 0
        ? Math.max(...updatedCars.map((car) => car.id)) + 1
        : 0;

    // Assign to random lane
    const lane = Math.floor(Math.random() * numLanes);

    const newCar = {
      id: newId,
      name: `Car ${newId + 1}`,
      position: newPosition,
      speed,
      desiredSpeed,
      color: "hsl(142, 72%, 29%)", // Start new cars with green color
      virtualLength,
      distTripPlanned,
      distanceTraveled: 0,
      lane,
      lastLaneChange: 0,
      vehicleType,
      ...driverProps,
    };
    updatedCars.push(newCar);
    events.push({
      type: "enter",
      carId: newId,
      carName: newCar.name,
      position: newPosition,
      speed: speed,
    });
  }
  return { cars: updatedCars, events };
}

// Calculate acceleration based on current speed, desired speed, and gap
function calculateAcceleration(
  car: Car,
  gap: number,
  leaderSpeed: number,
  params: SimulationParams
): number {
  const mphToFtPerSec = 5280 / 3600;
  const currentSpeed = car.speed * mphToFtPerSec;
  const leaderSpeedFtPerSec = leaderSpeed * mphToFtPerSec;

  // Calculate desired acceleration based on speed difference
  let accel = (car.desiredSpeed - car.speed) * params.k;

  // Apply safe-distance logic
  const safeDist = calculateSafeDistance(car.speed, params.tDist);
  if (gap < safeDist + params.lengthCar) {
    const decel = Math.min(
      (currentSpeed ** 2 - leaderSpeedFtPerSec ** 2) /
        (2 * Math.max(safeDist - gap + params.lengthCar, 1)),
      params.aMax
    );
    accel = Math.min(accel, -decel);
  }

  return accel;
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
      // Find leader and follower in left lane
      const sortedLeftLaneCars = leftLaneCars.sort((a, b) => {
        const distA = (a.position - car.position + laneLength) % laneLength;
        const distB = (b.position - car.position + laneLength) % laneLength;
        return distA - distB;
      });

      result.leftLane.leader = sortedLeftLaneCars.find(
        (c) => (c.position - car.position + laneLength) % laneLength > 0
      );
      result.leftLane.follower = sortedLeftLaneCars.find(
        (c) => (car.position - c.position + laneLength) % laneLength > 0
      );
    }
  }

  // Check if right lane exists
  if (car.lane < (params.numLanes || 3) - 1) {
    const rightLaneCars = cars.filter((c) => c.lane === car.lane + 1);
    if (rightLaneCars.length > 0) {
      // Find leader and follower in right lane
      const sortedRightLaneCars = rightLaneCars.sort((a, b) => {
        const distA = (a.position - car.position + laneLength) % laneLength;
        const distB = (b.position - car.position + laneLength) % laneLength;
        return distA - distB;
      });

      result.rightLane.leader = sortedRightLaneCars.find(
        (c) => (c.position - car.position + laneLength) % laneLength > 0
      );
      result.rightLane.follower = sortedRightLaneCars.find(
        (c) => (car.position - c.position + laneLength) % laneLength > 0
      );
    }
  }

  return result;
}

// Calculate MOBIL incentive for lane change
export function calculateLaneChangeIncentive(
  car: Car,
  currentLeader: Car | undefined,
  targetLane: { leader?: Car; follower?: Car },
  params: SimulationParams,
  laneLength: number,
  trafficRule: "american" | "european" = "american",
  showNotifications: boolean = true
): number {
  // Calculate current acceleration in current lane
  const currentGap = currentLeader
    ? (currentLeader.position - car.position + laneLength) % laneLength
    : laneLength;

  const currentLeaderSpeed = currentLeader?.speed ?? params.maxSpeed;

  const currentAccel = calculateAcceleration(
    car,
    currentGap,
    currentLeaderSpeed,
    params
  );

  // Calculate acceleration in target lane
  const targetGap = targetLane.leader
    ? (targetLane.leader.position - car.position + laneLength) % laneLength
    : laneLength;

  const targetLeaderSpeed = targetLane.leader?.speed ?? params.maxSpeed;

  // NEW: For European rules, apply 2x safe distance buffer for car behind
  let safeGapCheck = true;
  if (trafficRule === "european" && targetLane.follower) {
    const gapBehind = (car.position - targetLane.follower.position + laneLength) % laneLength;
    const followerSpeed = targetLane.follower.speed || 0;
    const followerSafeDist = calculateSafeDistance(followerSpeed, params.tDist || 3) / 1000;
    const followerSafeGap = followerSafeDist + 0.005;
    
    // Apply 1.5x safe distance buffer for car behind in European rules (using follower's speed)
    safeGapCheck = gapBehind > followerSafeGap * 1.5;
    
    if (!safeGapCheck) {
      debugLog(showNotifications, `[EUROPEAN SAFETY] Car ${car.id} blocked from lane change - insufficient gap behind (${gapBehind.toFixed(3)}km < ${(followerSafeGap * 1.5).toFixed(3)}km, follower speed: ${followerSpeed.toFixed(1)} km/h)`);
    }
  }

  const targetAccel = calculateAcceleration(
    car,
    targetGap,
    targetLeaderSpeed,
    params
  );

  // Calculate follower's acceleration change (impact on car behind)
  let followerAccelChange = 0;
  if (targetLane.follower) {
    const followerGapBefore =
      (car.position - targetLane.follower.position + laneLength) % laneLength;

    const followerGapAfter = targetLane.leader
      ? (targetLane.leader.position - targetLane.follower.position + laneLength) % laneLength
      : laneLength;

    const followerAccelBefore = calculateAcceleration(
      targetLane.follower,
      followerGapBefore,
      car.speed,
      params
    );

    const followerAccelAfter = calculateAcceleration(
      targetLane.follower,
      followerGapAfter,
      targetLeaderSpeed,
      params
    );

    followerAccelChange = followerAccelAfter - followerAccelBefore;
  }

  // Base MOBIL incentive calculation
  let incentive =
    targetAccel - currentAccel + (params.politenessFactor || 0.3) * followerAccelChange;

  // NEW: For European rules, if safety check fails, return very low incentive
  if (trafficRule === "european" && !safeGapCheck) {
    return -10; // Very low incentive to prevent lane change
  }

  // ✅ KEY ADDITION: Encourage lane change if current leader is stopped
  if (currentLeader && currentLeader.speed === 0) {
    incentive += 3; // Strong incentive to change lanes
  }

  // Optional: Slight incentive for lane preference (right or left depending on traffic rule)
  if (targetLane.leader) {
    if (
      (trafficRule === "american" && car.lane < targetLane.leader.lane) ||
      (trafficRule === "european" && car.lane > targetLane.leader.lane)
    ) {
      incentive += (params.rightLaneBias || 0.1);
    }
  }

  return incentive;
}

// Determine if lane change is possible and beneficial
function shouldChangeLane(
  car: Car,
  currentLeader: Car | undefined,
  adjacentLanes: {
    leftLane: { leader?: Car; follower?: Car };
    rightLane: { leader?: Car; follower?: Car };
  },
  params: SimulationParams,
  laneLength: number,
  currentTime: number,
  trafficRule: "american" | "european",
  showNotifications: boolean = true
): { shouldChange: boolean; targetLane: number | null } {
  // Check cooldown, but allow European rule to override for rightward movement
  const cooldownActive = currentTime - (car.lastLaneChange || 0) < (params.laneChangeCooldown || 5);
  
  const gapToLeader =
    currentLeader
      ? (currentLeader.position - car.position + laneLength) % laneLength
      : Infinity;

  const slowerLeader = currentLeader &&
    currentLeader.speed < car.speed - 1 && // Reduced speed difference requirement
    gapToLeader < 800; // Increased gap requirement

  // Check if car is slowed down significantly below desired speed
  const desiredSpeed = car.desiredSpeed || (params.speedLimit || 130);
  const isSlowedDown = params.uniformDriverBehavior 
    ? car.speed < desiredSpeed - 15 // 15 km/h threshold for deterministic behavior
    : car.speed < desiredSpeed - 15 && // At least 15 km/h below desired speed
      currentLeader && // Only if there's a car ahead causing the slowdown
      currentLeader.speed < car.speed; // Leader is slower than us

  // Debug logging for slowdown detection
  if (params.uniformDriverBehavior) {
    debugLog(showNotifications, `[SLOWDOWN DEBUG] Car ${car.id}: uniformDriverBehavior=${params.uniformDriverBehavior}, speed=${car.speed.toFixed(1)}, desiredSpeed=${desiredSpeed.toFixed(1)}, isSlowedDown=${isSlowedDown}, hasLeader=${!!currentLeader}`);
  }

  const leftIncentive =
    car.lane > 0
      ? calculateLaneChangeIncentive(
          car,
          currentLeader,
          adjacentLanes.leftLane,
          params,
          laneLength,
          trafficRule,
          showNotifications
        )
      : -Infinity;

  const rightIncentive =
    car.lane < (params.numLanes || 3) - 1
      ? calculateLaneChangeIncentive(
          car,
          currentLeader,
          adjacentLanes.rightLane,
          params,
          laneLength,
          trafficRule,
          showNotifications
        )
      : -Infinity;

  const adjustedLeft = leftIncentive * (1 - car.laneStickiness);
  const adjustedRight = rightIncentive * (1 - car.laneStickiness);

  // Debug which traffic rule is being used
  if (car.id === 0) {
    debugLog(showNotifications, `[TRAFFIC RULE DEBUG] Car ${car.id} executing traffic rule: ${trafficRule}`);
  }

  if (trafficRule === "american") {
    // American rules: no lane preference for overtaking, no automatic return to right lane
    // Change lanes when slowed down significantly or when overtaking is beneficial
    
    const numLanes = params.numLanes || 3;
    
    // Check if we should change lanes because we're slowed down
    const shouldChangeLaneWhenSlowed = 
      isSlowedDown && // Car is significantly below desired speed
      (params.uniformDriverBehavior || Math.random() < car.laneChangeProbability * 2.0); // Deterministic when uniform, probabilistic otherwise
    
    // Check if we should move left to pass (no preference)
    const shouldPassLeft = 
      car.lane < numLanes - 1 &&
      adjustedLeft > (params.accelerationThreshold || 0.2) &&
      slowerLeader;
      
    // Check if we should move right to pass (no preference)
    const shouldPassRight = 
      car.lane > 0 &&
      adjustedRight > (params.accelerationThreshold || 0.2) &&
      slowerLeader

    // NEW: Safety check for lane changes when slowed down
    const isLeftLaneSafe = car.lane > 0 &&
      (!adjacentLanes.leftLane.leader || // No leader means safe
        ((adjacentLanes.leftLane.leader.position - car.position + laneLength) % laneLength) > 0.1) && // At least 100m gap if leader exists
      (!adjacentLanes.leftLane.follower || // No follower means safe
        ((car.position - adjacentLanes.leftLane.follower.position + laneLength) % laneLength) > 0.1); // Safe from behind

    const isRightLaneSafe = car.lane < (params.numLanes || 3) - 1 &&
      (!adjacentLanes.rightLane.leader || // No leader means safe
        ((adjacentLanes.rightLane.leader.position - car.position + laneLength) % laneLength) > 0.1) && // At least 100m gap if leader exists
      (!adjacentLanes.rightLane.follower || // No follower means safe
        ((car.position - adjacentLanes.rightLane.follower.position + laneLength) % laneLength) > 0.1); // Safe from behind

    // Debug logging for safety checks
    if (shouldChangeLaneWhenSlowed) {
      debugLog(showNotifications, `[SAFETY DEBUG] Car ${car.id} lane ${car.lane}: isLeftLaneSafe=${isLeftLaneSafe} (laneCheck: ${car.lane > 0}), isRightLaneSafe=${isRightLaneSafe} (laneCheck: ${car.lane < (params.numLanes || 3) - 1}), numLanes=${params.numLanes}`);
    }

    // Decision making with priority:
    // 1. Change lanes when slowed down (if safe) - HIGH PRIORITY
    // 2. Pass on left if safe and beneficial
    // 3. Pass on right if safe and beneficial
    
    // High priority for lane changes when slowed down
    if (shouldChangeLaneWhenSlowed) {
      // No lane preference - check both directions equally
      // NOTE: Left = lower lane numbers, Right = higher lane numbers
      // Safety checks are ALWAYS enforced, only incentive threshold is bypassed when uniform
      if (isLeftLaneSafe && (params.uniformDriverBehavior || adjustedLeft > 0)) {
        debugLog(showNotifications, `[AMERICAN SLOWDOWN] Car ${car.id} in lane ${car.lane} changing LEFT to lane ${car.lane - 1} due to slowdown (speed: ${car.speed.toFixed(1)} km/h, desired: ${desiredSpeed.toFixed(1)} km/h, isLeftLaneSafe: ${isLeftLaneSafe}, numLanes: ${params.numLanes}`);
        return { shouldChange: true, targetLane: car.lane - 1 };
      }
      // Try right lane if left is not safe or not available
      if (isRightLaneSafe && (params.uniformDriverBehavior || adjustedRight > 0)) {
        debugLog(showNotifications, `[AMERICAN SLOWDOWN] Car ${car.id} changing RIGHT due to slowdown (speed: ${car.speed.toFixed(1)} km/h, desired: ${desiredSpeed.toFixed(1)} km/h)`);
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
    }
    
    // Overtaking decisions - no lane preference, but with safety checks
    if (shouldPassLeft && isLeftLaneSafe && (params.uniformDriverBehavior || Math.random() < car.laneChangeProbability)) {
      debugLog(showNotifications, `[AMERICAN PASS] Car ${car.id} changing LEFT to pass slower vehicle`);
      return { shouldChange: true, targetLane: car.lane - 1 };
    } else if (shouldPassRight && isRightLaneSafe && (params.uniformDriverBehavior || Math.random() < car.laneChangeProbability)) {
      debugLog(showNotifications, `[AMERICAN PASS] Car ${car.id} changing RIGHT to pass slower vehicle`);
      return { shouldChange: true, targetLane: car.lane + 1 };
    }
  } else {
    // European rules: Aggressive rightmost lane preference - check every frame
    if (car.id === 0) {
      debugLog(showNotifications, `[EUROPEAN DEBUG] Car ${car.id} entering European rule logic in lane ${car.lane}`);
    }
    const desiredSpeed = car.desiredSpeed || (params.speedLimit || 130);
    const numLanes = params.numLanes || 3;
    
    // CORE PRINCIPLE: Always try to move to the rightmost lane where desired speed can be maintained
    // NOTE: Lane 0 = leftmost, higher numbers = more right. Rightmost lane = numLanes - 1
    
    // European rule can override cooldown for rightward movement when uniformDriverBehavior is enabled
    const canOverrideCooldown = params.uniformDriverBehavior || true; // Always override for European, but especially when uniform
    
    // Helper function to check if lane change would cause car behind to slow down
    const willCauseBehindToSlowDown = (follower: Car | undefined, gapBehind: number, currentSpeed: number) => {
      if (!follower) return false; // No follower, no issue
      
      // Calculate the safe following distance the follower would need
      const followerSafeDist = calculateSafeDistance(follower.speed, params.tDist || 3) / 1000;
      const followerSafeGap = followerSafeDist + 0.005;
      
      // If the gap behind is less than what the follower needs, they would have to slow down
      const wouldNeedToSlowDown = gapBehind < followerSafeGap * 1.2;
      
      // Also check if our speed is significantly lower than follower's speed
      const speedDifference = follower.speed - currentSpeed;
      const isMuchSlower = speedDifference > 15; // If we're 15+ km/h slower
      
      return wouldNeedToSlowDown || isMuchSlower;
    };
    
    // First check if we can move to the right lane (toward higher lane numbers - more right)
    if (car.lane < numLanes - 1 && (!cooldownActive || canOverrideCooldown)) {
      const rightLaneLeader = adjacentLanes.rightLane.leader;
      const rightLaneFollower = adjacentLanes.rightLane.follower;
      
      // Calculate gaps in right lane
      const gapAhead = !rightLaneLeader ? Infinity : 
        ((rightLaneLeader.position - car.position + laneLength) % laneLength);
      const gapBehind = !rightLaneFollower ? Infinity : 
        ((car.position - rightLaneFollower.position + laneLength) % laneLength);
      
      // Use current speed vs desired speed comparison for more realistic behavior
      const currentSpeed = car.speed || 0;
      const targetSpeed = Math.min(desiredSpeed, currentSpeed + 10); // Don't expect huge speed increases
      
      // Calculate safe gap for this car's speed
      const carSpeed = car.speed || 0;
      const safeDistKm = calculateSafeDistance(carSpeed, params.tDist || 3) / 1000;
      const safeGap = safeDistKm + 0.005; // Same calculation as in main simulation
      
      // NEW: Calculate follower's safe gap for more accurate safety check
      let followerSafeGap = safeGap; // Default to car's safe gap if no follower
      if (rightLaneFollower) {
        const followerSpeed = rightLaneFollower.speed || 0;
        const followerSafeDist = calculateSafeDistance(followerSpeed, params.tDist || 3) / 1000;
        followerSafeGap = followerSafeDist + 0.005;
      }
      
      // Can maintain reasonable speed in right lane? (More aggressive - accept slower speeds)
      const canMaintainSpeed = !rightLaneLeader || 
        (rightLaneLeader.speed >= targetSpeed * 0.6 && gapAhead > safeGap * 0.8);
      
      // Very aggressive safety requirements for European "keep right" principle
      // Use 1.5x safe distance buffer for car behind to make lane changes more conservative (using follower's speed)
      const safeToChange = gapAhead > safeGap && gapBehind > followerSafeGap * 1.5 && 
        (!rightLaneFollower || rightLaneFollower.speed <= currentSpeed + 30);
      
      // NEW: Check if lane change would cause car behind to slow down
      const willCauseRightBehindToSlow = willCauseBehindToSlowDown(rightLaneFollower, gapBehind, currentSpeed);
      
      // PRIORITY 1: If right lane is completely empty, always move there (unless it would cause behind to slow)
      if (!rightLaneLeader && !rightLaneFollower) {
        debugLog(showNotifications, `[EUROPEAN FIX] Car ${car.id} moving RIGHT - empty lane, from lane ${car.lane} to ${car.lane + 1}`);
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
      
      // PRIORITY 2: If right lane allows reasonable speed and is safe, move there (but don't cause behind to slow)
      if (canMaintainSpeed && safeToChange && !willCauseRightBehindToSlow) {
        debugLog(showNotifications, `[EUROPEAN FIX] Car ${car.id} moving RIGHT - can maintain speed, from lane ${car.lane} to ${car.lane + 1}`);
        return { shouldChange: true, targetLane: car.lane + 1 };
      } else if (canMaintainSpeed && safeToChange && willCauseRightBehindToSlow) {
        // Log when we would have moved but didn't due to safety concern
        debugLog(showNotifications, `[EUROPEAN SAFETY] Car ${car.id} NOT moving RIGHT - would cause car behind to slow down (gap: ${gapBehind.toFixed(3)}km, follower speed: ${rightLaneFollower?.speed.toFixed(1) || 'N/A'} km/h, our speed: ${currentSpeed.toFixed(1)} km/h)`);
      }
    }
    
    // Consider left movement to overtake - European rule can override cooldown when severely blocked
    const currentSpeed = car.speed || 0;
    const safeDistKm = calculateSafeDistance(currentSpeed, params.tDist || 3) / 1000;
    const safeGap = safeDistKm + 0.005;
    
    const gapToLeader = !currentLeader ? Infinity : 
      ((currentLeader.position - car.position + laneLength) % laneLength);
    
    // More realistic overtaking conditions based on safeGap and speed difference
    const speedDifference = currentLeader ? (desiredSpeed - currentLeader.speed) : 0;
    const isBlockedBySlowCar = currentLeader && 
      speedDifference >= 15 && // Need at least 15 km/h speed benefit (matching American rules)
      gapToLeader <= safeGap * 1.2; // Within 1.2x safe following distance
    
    const canOverrideCooldownForOvertaking = params.uniformDriverBehavior || isBlockedBySlowCar;
    
    if (!cooldownActive || canOverrideCooldownForOvertaking) {
      // If can't move right and current lane doesn't allow desired speed, try left
      const canReachDesiredSpeedInCurrentLane = !currentLeader || 
        (currentLeader.speed >= desiredSpeed * 0.8 && gapToLeader > safeGap);
      
      // Check if left lane is safe for overtaking  
      const leftLaneLeader = adjacentLanes.leftLane.leader;
      const leftLaneFollower = adjacentLanes.leftLane.follower;
      const leftGapAhead = !leftLaneLeader ? Infinity : 
        ((leftLaneLeader.position - car.position + laneLength) % laneLength);
      const leftGapBehind = !leftLaneFollower ? Infinity : 
        ((car.position - leftLaneFollower.position + laneLength) % laneLength);
      
      // Use 1.5x safe distance buffer for car behind to make lane changes more conservative (using follower's speed)
      let leftFollowerSafeGap = safeGap; // Default to car's safe gap if no follower
      if (leftLaneFollower) {
        const leftFollowerSpeed = leftLaneFollower.speed || 0;
        const leftFollowerSafeDist = calculateSafeDistance(leftFollowerSpeed, params.tDist || 3) / 1000;
        leftFollowerSafeGap = leftFollowerSafeDist + 0.005;
      }
      
      const leftLaneIsSafe = leftGapAhead > safeGap && leftGapBehind > leftFollowerSafeGap * 1.5;
      
      // NEW: Check if left lane change would cause car behind to slow down
      const willCauseLeftBehindToSlow = willCauseBehindToSlowDown(leftLaneFollower, leftGapBehind, currentSpeed);
      
      // More aggressive leftward movement for European rule
      // NOTE: Left = lower lane numbers, Right = higher lane numbers
      // When uniformDriverBehavior is enabled, bypass incentive threshold and make it deterministic
      if (!canReachDesiredSpeedInCurrentLane && car.lane > 0 && leftLaneIsSafe && (params.uniformDriverBehavior || adjustedLeft > 0.1) && !willCauseLeftBehindToSlow) {
        debugLog(showNotifications, `[EUROPEAN OVERTAKE] Car ${car.id} moving LEFT to overtake slow car (gap: ${gapToLeader.toFixed(3)}km, safeGap: ${safeGap.toFixed(3)}km, speedDiff: ${speedDifference.toFixed(1)}km/h), from lane ${car.lane} to ${car.lane - 1}`);
        return { shouldChange: true, targetLane: car.lane - 1 };
      } else if (!canReachDesiredSpeedInCurrentLane && car.lane > 0 && leftLaneIsSafe && (params.uniformDriverBehavior || adjustedLeft > 0.1) && willCauseLeftBehindToSlow) {
        // Log when we would have overtaken but didn't due to safety concern
        debugLog(showNotifications, `[EUROPEAN SAFETY] Car ${car.id} NOT overtaking LEFT - would cause car behind to slow down (gap: ${leftGapBehind.toFixed(3)}km, follower speed: ${leftLaneFollower?.speed.toFixed(1) || 'N/A'} km/h, our speed: ${currentSpeed.toFixed(1)} km/h)`);
      }
    }
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
  params: SimulationParams,
  laneLength: number,
  currentTime: number,
  trafficRule: "american" | "european",
  shouldMoveToExitLane: boolean,
  showNotifications: boolean = true
): { shouldChange: boolean; targetLane: number | null } {
  // Check cooldown, but allow uniformDriverBehavior to override for deterministic behavior
  const cooldownActive = currentTime - (car.lastLaneChange || 0) < (params.laneChangeCooldown || 5);
  if (cooldownActive && !params.uniformDriverBehavior) {
    return { shouldChange: false, targetLane: null };
  }

  const numLanes = params.numLanes || 1;
  const isInExitLane = car.lane === 0 || car.lane === numLanes - 1; // leftmost or rightmost lane

  // If car needs to exit and is not in an exit lane, prioritize moving to exit lane
  if (shouldMoveToExitLane && !isInExitLane) {
    // Prefer rightmost lane for American traffic, leftmost for European
    const preferredExitLane = trafficRule === "american" ? numLanes - 1 : 0;
    const alternativeExitLane = trafficRule === "american" ? 0 : numLanes - 1;
    
    // Try preferred exit lane first
    if (car.lane < preferredExitLane && adjacentLanes.rightLane.leader) {
      const rightIncentive = calculateLaneChangeIncentive(
        car,
        currentLeader,
        adjacentLanes.rightLane,
        params,
        laneLength,
        trafficRule,
        showNotifications
      );
      if (params.uniformDriverBehavior || rightIncentive > -0.5) { // Deterministic when uniform, lower threshold for exit lane changes
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
    } else if (car.lane > preferredExitLane && adjacentLanes.leftLane.leader) {
      const leftIncentive = calculateLaneChangeIncentive(
        car,
        currentLeader,
        adjacentLanes.leftLane,
        params,
        laneLength,
        trafficRule,
        showNotifications
      );
      if (params.uniformDriverBehavior || leftIncentive > -0.5) { // Deterministic when uniform, lower threshold for exit lane changes
        return { shouldChange: true, targetLane: car.lane - 1 };
      }
    }
    
    // Try alternative exit lane if preferred is not accessible
    if (car.lane < alternativeExitLane && adjacentLanes.rightLane.leader) {
      const rightIncentive = calculateLaneChangeIncentive(
        car,
        currentLeader,
        adjacentLanes.rightLane,
        params,
        laneLength,
        trafficRule,
        showNotifications
      );
      if (params.uniformDriverBehavior || rightIncentive > -0.3) { // Deterministic when uniform
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
    } else if (car.lane > alternativeExitLane && adjacentLanes.leftLane.leader) {
      const leftIncentive = calculateLaneChangeIncentive(
        car,
        currentLeader,
        adjacentLanes.leftLane,
        params,
        laneLength,
        trafficRule,
        showNotifications
      );
      if (params.uniformDriverBehavior || leftIncentive > -0.3) { // Deterministic when uniform
        return { shouldChange: true, targetLane: car.lane - 1 };
      }
    }
  }

  // Regular lane change logic for non-exiting cars
  return shouldChangeLane(car, currentLeader, adjacentLanes, params, laneLength, currentTime, trafficRule, showNotifications);
}
