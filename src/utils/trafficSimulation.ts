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
function generateDriverProperties(driverTypeDensity: {
  aggressive: number;
  normal: number;
  conservative: number;
}): {
  driverType: "aggressive" | "normal" | "conservative";
  laneChangeProbability: number;
  laneStickiness: number;
} {
  const rand = Math.random();
  
  // Convert percentages to cumulative probabilities
  const aggressiveThreshold = driverTypeDensity.aggressive / 100;
  const normalThreshold = aggressiveThreshold + (driverTypeDensity.normal / 100);

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
export function initializeSimulation(params: SimulationParams): {
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
      console.log(
        `[DEBUG] Car ${carId}: meanDistTripPlanned=${params.meanDistTripPlanned}, sigmaDistTripPlanned=${params.sigmaDistTripPlanned}, raw=${distTripPlannedRaw}, final=${distTripPlanned}`
      );

      // Generate driver properties
      const driverProps = generateDriverProperties(params.driverTypeDensity);

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

// Update simulation for one time step
export function updateSimulation(
  cars: Car[],
  laneLength: number,
  params: SimulationParams,
  currentTime: number,
  trafficRule: "american" | "european",
  simulationSpeed: number = 1,
  stoppedCars: Set<number> = new Set()
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
      console.log(`[SIM TICK] rule=${rule} t=${currentTime.toFixed(1)}s car=${car.id} lane=${car.lane}`);
    }
    
    // EARLY EUROPEAN OVERTAKE EVALUATION - before cars brake too much
    // This addresses the issue that cars brake before reaching the "too-close" lane change trigger
    if (rule === "european" && car.id === 0 && tick % 5 === 0) {
      console.log(`[EUROPEAN CHECK] Car ${car.id} in lane ${car.lane} - gap: ${gap.toFixed(3)}km, safeGap: ${safeGap.toFixed(3)}km, aheadCar: ${aheadCar ? `speed ${aheadCarSpeed.toFixed(1)}km/h` : 'none'}`);
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
          
          // Stricter safety requirements: 1.5x safeGap ahead and behind
          const safetyBuffer = 1.5;
          const leftLaneIsSafe = leftGapAhead > safeGap * safetyBuffer && 
                                leftGapBehind > safeGap * safetyBuffer;
          
          // Additional safety check: don't move if follower is approaching fast
          const followerSpeedCheck = !leftLaneFollower || 
            leftLaneFollower.speed <= car.speed + 10; // Follower not more than 10 km/h faster
          
          if (leftLaneIsSafe && followerSpeedCheck) {
            console.log(`[EUROPEAN OVERTAKE] Car ${car.id} moving LEFT early to overtake (gap: ${gap.toFixed(3)}km, safeGap: ${safeGap.toFixed(3)}km, speedDiff: ${speedDifference.toFixed(1)}km/h), from lane ${car.lane} to ${car.lane - 1}`);
            
            // Perform the lane change immediately
            updatedCars[carIndex].lane = car.lane - 1;
            updatedCars[carIndex].lastLaneChange = currentTime;
            
            // Mark this as an overtaking maneuver to prevent immediate return to right
            updatedCars[carIndex].isOvertaking = true;
            updatedCars[carIndex].overtakeStartTime = currentTime;
            
            // Add lane change event
            events.push({
              type: "laneChange",
              carId: car.id,
              carName: car.name,
              position: car.position,
              speed: car.speed,
              lane: car.lane - 1,
            });
            
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
      console.log(`[SINGLE CAR DEBUG] Car ${car.id} in lane ${car.lane}, no other cars - should be free to change lanes`);
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
        console.log(`[LANE CHANGE DEBUG] Car ${car.id} checking lane change - gap ahead: ${gap.toFixed(1)}, safeGap: ${safeGap.toFixed(1)}, will try lane change`);
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
        shouldMoveToExitLane
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
    console.log(`[RULE VERIFICATION] Traffic rule is: ${rule} (original: ${trafficRule})`);
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
      if (car.lane < numLanes - 1) {
        // Check if car is currently overtaking and should wait before returning right
        const isCurrentlyOvertaking = car.isOvertaking && car.overtakeStartTime;
        const overtakeTime = isCurrentlyOvertaking ? currentTime - car.overtakeStartTime : 0;
        const minOvertakeTime = 5; // Minimum 5 seconds to complete overtake
        
        // Respect lane change cooldowns and overtaking state
        const timeSinceLastChange = currentTime - (car.lastLaneChange || 0);
        const minCooldown = 3; // Minimum 3 seconds between lane changes
        const canMoveRight = timeSinceLastChange >= minCooldown && 
                           (!isCurrentlyOvertaking || overtakeTime >= minOvertakeTime);
        
        if (canMoveRight) {
          const adjacentLanes = findAdjacentCars(car, updatedCars, laneLength, params);
          
          if (car.id === 0) {
            console.log(`[EUROPEAN PROACTIVE] Car ${car.id} in lane ${car.lane} - checking proactive rightward move (overtaking: ${isCurrentlyOvertaking}, time: ${overtakeTime.toFixed(1)}s)`);
          }
          
          const { shouldChange, targetLane } = shouldChangeLaneWithExitBehavior(
            car,
            undefined, // No current leader constraint for proactive moves
            adjacentLanes,
            params,
            laneLength,
            currentTime,
            rule,
            false // Not exiting
          );

          if (shouldChange && targetLane !== null && targetLane > car.lane) {
            // Additional check: make sure we're not moving back into the path of a slow car we just overtook
            const rightLaneCars = updatedCars.filter(c => c.lane === targetLane);
            const nearbySlowCars = rightLaneCars.filter(otherCar => {
              const distance = Math.abs((otherCar.position - car.position + laneLength) % laneLength);
              return distance < 0.2 && otherCar.speed < car.speed - 10; // Within 200m and significantly slower
            });
            
            if (nearbySlowCars.length === 0) {
              updatedCars[i].lane = targetLane;
              updatedCars[i].lastLaneChange = currentTime;
              
              // Clear overtaking state when returning to right lane
              updatedCars[i].isOvertaking = false;
              updatedCars[i].overtakeStartTime = undefined;
              
              if (car.id === 0) {
                console.log(`[EUROPEAN FIX] Car ${car.id} moving RIGHT - safe return to rightmost lane, from lane ${car.lane} to ${targetLane}`);
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
              console.log(`[EUROPEAN WAIT] Car ${car.id} waiting to return right - slow car still nearby`);
            }
          }
        } else if (car.id === 0) {
          console.log(`[EUROPEAN COOLDOWN] Car ${car.id} on cooldown - time since last change: ${timeSinceLastChange.toFixed(1)}s, overtaking: ${isCurrentlyOvertaking}`);
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
    const driverProps = generateDriverProperties(params.driverTypeDensity);

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
  trafficRule: "american" | "european" = "american"
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
  trafficRule: "american" | "european"
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

  // NEW: Check if car is slowed down significantly below desired speed
  const desiredSpeed = car.desiredSpeed || (params.speedLimit || 130);
  const isSlowedDown = car.speed < desiredSpeed - 15 && // At least 15 km/h below desired speed
    currentLeader && // Only if there's a car ahead causing the slowdown
    currentLeader.speed < car.speed; // Leader is slower than us

  const leftIncentive =
    car.lane > 0
      ? calculateLaneChangeIncentive(
          car,
          currentLeader,
          adjacentLanes.leftLane,
          params,
          laneLength
        )
      : -Infinity;

  const rightIncentive =
    car.lane < (params.numLanes || 3) - 1
      ? calculateLaneChangeIncentive(
          car,
          currentLeader,
          adjacentLanes.rightLane,
          params,
          laneLength
        )
      : -Infinity;

  const adjustedLeft = leftIncentive * (1 - car.laneStickiness);
  const adjustedRight = rightIncentive * (1 - car.laneStickiness);

  // Debug which traffic rule is being used
  if (car.id === 0) {
    console.log(`[TRAFFIC RULE DEBUG] Car ${car.id} executing traffic rule: ${trafficRule}`);
  }

  if (trafficRule === "american") {
    // American rules: prefer left-lane passing but allow right-lane passing
    // NEW: Also change lanes when slowed down significantly, if safe
    
    // EUROPEAN CONDITION: Overtaking logic - same as European rules
    const currentSpeed = car.speed || 0;
    const safeDistKm = calculateSafeDistance(currentSpeed, params.tDist || 3) / 1000;
    const safeGap = safeDistKm + 0.005;
    
    const gapToLeader = !currentLeader ? Infinity : 
      ((currentLeader.position - car.position + laneLength) % laneLength);
    
    // More realistic overtaking conditions based on safeGap and speed difference
    const speedDifference = currentLeader ? (desiredSpeed - currentLeader.speed) : 0;
    const isBlockedBySlowCar = currentLeader && 
      speedDifference >= 5 && // Need at least 5 km/h speed benefit
      gapToLeader <= safeGap * 1.2; // Within 1.2x safe following distance
    
    const canReachDesiredSpeedInCurrentLane = !currentLeader || 
      (currentLeader.speed >= desiredSpeed * 0.8 && gapToLeader > safeGap);
    
    // Check if left lane is safe for overtaking  
    const leftLaneLeader = adjacentLanes.leftLane.leader;
    const leftLaneFollower = adjacentLanes.leftLane.follower;
    const leftGapAhead = !leftLaneLeader ? Infinity : 
      ((leftLaneLeader.position - car.position + laneLength) % laneLength);
    const leftGapBehind = !leftLaneFollower ? Infinity : 
      ((car.position - leftLaneFollower.position + laneLength) % laneLength);
    
    const leftLaneIsSafe = leftGapAhead > safeGap && leftGapBehind > safeGap;
    
    // EUROPEAN OVERTAKING CONDITION: Same logic as European rules
    if (!canReachDesiredSpeedInCurrentLane && car.lane > 0 && leftLaneIsSafe && adjustedLeft > 0.1) {
      console.log(`[AMERICAN EUROPEAN OVERTAKE] Car ${car.id} moving LEFT to overtake slow car (gap: ${gapToLeader.toFixed(3)}km, safeGap: ${safeGap.toFixed(3)}km, speedDiff: ${speedDifference.toFixed(1)}km/h), from lane ${car.lane} to ${car.lane - 1}`);
      return { shouldChange: true, targetLane: car.lane - 1 };
    }
    
    // EUROPEAN RIGHT LANE PRIORITY CONDITIONS
    const numLanes = params.numLanes || 3;
    
    // European rule can override cooldown for rightward movement
    const canOverrideCooldown = true;
    
    // Check if we can move to the right lane (toward higher lane numbers - more right)
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
      const safeGapForRight = safeDistKm + 0.005; // Same calculation as in main simulation
      
      // Can maintain reasonable speed in right lane? (More aggressive - accept slower speeds)
      const canMaintainSpeed = !rightLaneLeader || 
        (rightLaneLeader.speed >= targetSpeed * 0.6 && gapAhead > safeGapForRight * 0.8);
      
      // Very aggressive safety requirements for European "keep right" principle
      const safeToChange = gapAhead > safeGapForRight && gapBehind > safeGapForRight && 
        (!rightLaneFollower || rightLaneFollower.speed <= currentSpeed + 30);
      
      // EUROPEAN PRIORITY 1: If right lane is completely empty, always move there
      if (!rightLaneLeader && !rightLaneFollower) {
        console.log(`[AMERICAN EUROPEAN FIX] Car ${car.id} moving RIGHT - empty lane, from lane ${car.lane} to ${car.lane + 1}`);
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
      
      // EUROPEAN PRIORITY 2: If right lane allows reasonable speed and is safe, move there
      if (canMaintainSpeed && safeToChange) {
        console.log(`[AMERICAN EUROPEAN FIX] Car ${car.id} moving RIGHT - can maintain speed, from lane ${car.lane} to ${car.lane + 1}`);
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
    }
    
    // Check if we should move left to pass (preferred)
    const shouldPassLeft = 
      car.lane < (params.numLanes || 3) - 1 &&
      adjustedLeft > (params.accelerationThreshold || 0.2) * 0.3 && // Reduced threshold for left
      slowerLeader;
      
    // Check if we should move right to pass (less preferred)
    const shouldPassRight = 
      car.lane > 0 &&
      adjustedRight > (params.accelerationThreshold || 0.2) * 0.5 && // Reduced threshold for right
      slowerLeader &&
      (car.lane === (params.numLanes || 3) - 1 || Math.random() > 0.7); // More likely to pass on right

    // NEW: Check if we should change lanes because we're slowed down
    const shouldChangeLaneWhenSlowed = 
      isSlowedDown && // Car is significantly below desired speed
      Math.random() < car.laneChangeProbability * 2.0; // Higher probability when slowed down

    // Check if we should return to right lane when not passing
    const rightLaneLeader = adjacentLanes.rightLane.leader;
    const canReturnRight =
      car.lane > 0 &&
      (!rightLaneLeader ||
        (rightLaneLeader.speed >= car.speed &&
          ((rightLaneLeader.position - car.position + laneLength) % laneLength > 200))); // Reduced gap requirement

    // NEW: Safety check for lane changes when slowed down
    const isLeftLaneSafe = car.lane < (params.numLanes || 3) - 1 &&
      adjacentLanes.leftLane.leader &&
      ((adjacentLanes.leftLane.leader.position - car.position + laneLength) % laneLength) > 0.1 && // At least 100m gap
      (!adjacentLanes.leftLane.follower ||
        ((car.position - adjacentLanes.leftLane.follower.position + laneLength) % laneLength) > 0.1); // Safe from behind

    const isRightLaneSafe = car.lane > 0 &&
      adjacentLanes.rightLane.leader &&
      ((adjacentLanes.rightLane.leader.position - car.position + laneLength) % laneLength) > 0.1 && // At least 100m gap
      (!adjacentLanes.rightLane.follower ||
        ((car.position - adjacentLanes.rightLane.follower.position + laneLength) % laneLength) > 0.1); // Safe from behind

    // Decision making with priority:
    // 1. Change lanes when slowed down (if safe) - NEW HIGH PRIORITY
    // 2. Return to right lane when safe (if not passing)
    // 3. Pass on left if possible (preferred)
    // 4. Pass on right if no other option (rare)
    
    // NEW: High priority for lane changes when slowed down
    if (shouldChangeLaneWhenSlowed) {
      // Prefer left lane for overtaking when slowed down
      // NOTE: Left = lower lane numbers, Right = higher lane numbers
      if (isLeftLaneSafe && adjustedLeft > 0) {
        console.log(`[AMERICAN SLOWDOWN] Car ${car.id} changing LEFT due to slowdown (speed: ${car.speed.toFixed(1)} km/h, desired: ${desiredSpeed.toFixed(1)} km/h)`);
        return { shouldChange: true, targetLane: car.lane - 1 };
      }
      // Try right lane if left is not safe or not available
      if (isRightLaneSafe && adjustedRight > 0) {
        console.log(`[AMERICAN SLOWDOWN] Car ${car.id} changing RIGHT due to slowdown (speed: ${car.speed.toFixed(1)} km/h, desired: ${desiredSpeed.toFixed(1)} km/h)`);
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
    }
    
    if (canReturnRight && 
        !slowerLeader && // Not actively trying to pass
        adjustedRight > (params.accelerationThreshold || 0.2) * 0.2 &&
        Math.random() < car.laneChangeProbability * 1.5) { // Increased probability
      return { shouldChange: true, targetLane: car.lane + 1 };
    } else if (shouldPassLeft && Math.random() < car.laneChangeProbability * 1.5) { // Increased probability
      return { shouldChange: true, targetLane: car.lane - 1 };
    } else if (shouldPassRight && Math.random() < car.laneChangeProbability * 0.8) { // Increased probability
      return { shouldChange: true, targetLane: car.lane + 1 };
    }
  } else {
    // European rules: Aggressive rightmost lane preference - check every frame
    if (car.id === 0) {
      console.log(`[EUROPEAN DEBUG] Car ${car.id} entering European rule logic in lane ${car.lane}`);
    }
    const desiredSpeed = car.desiredSpeed || (params.speedLimit || 130);
    const numLanes = params.numLanes || 3;
    
    // CORE PRINCIPLE: Always try to move to the rightmost lane where desired speed can be maintained
    // NOTE: Lane 0 = leftmost, higher numbers = more right. Rightmost lane = numLanes - 1
    
    // European rule can ALWAYS override cooldown for rightward movement (aggressive keep right)
    const canOverrideCooldown = true; // Always override cooldown for European rule
    
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
      
      // Can maintain reasonable speed in right lane? (More aggressive - accept slower speeds)
      const canMaintainSpeed = !rightLaneLeader || 
        (rightLaneLeader.speed >= targetSpeed * 0.6 && gapAhead > safeGap * 0.8);
      
      // Very aggressive safety requirements for European "keep right" principle
      const safeToChange = gapAhead > safeGap && gapBehind > safeGap && 
        (!rightLaneFollower || rightLaneFollower.speed <= currentSpeed + 30);
      
      // PRIORITY 1: If right lane is completely empty, always move there
      if (!rightLaneLeader && !rightLaneFollower) {
        console.log(`[EUROPEAN FIX] Car ${car.id} moving RIGHT - empty lane, from lane ${car.lane} to ${car.lane + 1}`);
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
      
      // PRIORITY 2: If right lane allows reasonable speed and is safe, move there
      if (canMaintainSpeed && safeToChange) {
        console.log(`[EUROPEAN FIX] Car ${car.id} moving RIGHT - can maintain speed, from lane ${car.lane} to ${car.lane + 1}`);
        return { shouldChange: true, targetLane: car.lane + 1 };
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
      speedDifference >= 5 && // Need at least 5 km/h speed benefit
      gapToLeader <= safeGap * 1.2; // Within 1.2x safe following distance
    
    const canOverrideCooldownForOvertaking = isBlockedBySlowCar;
    
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
      
      const leftLaneIsSafe = leftGapAhead > safeGap && leftGapBehind > safeGap;
      
      // More aggressive leftward movement for European rule
      // NOTE: Left = lower lane numbers, Right = higher lane numbers
      if (!canReachDesiredSpeedInCurrentLane && car.lane > 0 && leftLaneIsSafe && adjustedLeft > 0.1) {
        console.log(`[EUROPEAN OVERTAKE] Car ${car.id} moving LEFT to overtake slow car (gap: ${gapToLeader.toFixed(3)}km, safeGap: ${safeGap.toFixed(3)}km, speedDiff: ${speedDifference.toFixed(1)}km/h), from lane ${car.lane} to ${car.lane - 1}`);
        return { shouldChange: true, targetLane: car.lane - 1 };
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
  shouldMoveToExitLane: boolean
): { shouldChange: boolean; targetLane: number | null } {
  if (currentTime - (car.lastLaneChange || 0) < (params.laneChangeCooldown || 5)) {
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
        laneLength
      );
      if (rightIncentive > -0.5) { // Lower threshold for exit lane changes
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
    } else if (car.lane > preferredExitLane && adjacentLanes.leftLane.leader) {
      const leftIncentive = calculateLaneChangeIncentive(
        car,
        currentLeader,
        adjacentLanes.leftLane,
        params,
        laneLength
      );
      if (leftIncentive > -0.5) { // Lower threshold for exit lane changes
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
        laneLength
      );
      if (rightIncentive > -0.3) {
        return { shouldChange: true, targetLane: car.lane + 1 };
      }
    } else if (car.lane > alternativeExitLane && adjacentLanes.leftLane.leader) {
      const leftIncentive = calculateLaneChangeIncentive(
        car,
        currentLeader,
        adjacentLanes.leftLane,
        params,
        laneLength
      );
      if (leftIncentive > -0.3) {
        return { shouldChange: true, targetLane: car.lane - 1 };
      }
    }
  }

  // Regular lane change logic for non-exiting cars
  return shouldChangeLane(car, currentLeader, adjacentLanes, params, laneLength, currentTime, trafficRule);
}
