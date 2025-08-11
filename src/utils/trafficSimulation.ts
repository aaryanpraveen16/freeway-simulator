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
function generateDriverProperties(): {
  driverType: "aggressive" | "normal" | "conservative";
  laneChangeProbability: number;
  laneStickiness: number;
} {
  const rand = Math.random();

  if (rand < 0.2) {
    // Aggressive driver
    return {
      driverType: "aggressive",
      laneChangeProbability: normalRandom(0.8, 0.1, 0.6, 1.0),
      laneStickiness: normalRandom(0.3, 0.1, 0.1, 0.5),
    };
  } else if (rand < 0.8) {
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
      const driverProps = generateDriverProperties();

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

// Calculate distance to car ahead in the same lane (in miles)
export function calculateDistanceToCarAhead(
  carIndex: number,
  cars: Car[],
  laneLength: number
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

  // Calculate distance with wrap-around
  let distance = aheadCar.position - currentCar.position;
  if (distance < 0) {
    distance += laneLength;
  }

  return distance;
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
    const safeGap = safeDistKm + (params.lengthCar / 1000) + bufferKm;

    const aheadCarSpeed = aheadCar?.speed || 0;
    
    // More generous safe distance calculation - only brake when really needed
    const minimumGap = safeGap * 0.7; // Allow closer following for more realistic behavior
    const comfortableGap = safeGap * 1.2; // Distance where we start gentle adjustments
    
    // If there's no car ahead or plenty of space, accelerate to desired speed
    if (!aheadCar || gap > comfortableGap) {
      // If far ahead, accelerate towards desired speed (in km/h)
      const acceleration = params.aMax * 3.6; // Convert m/s² to km/h/s
      carSpeed = Math.min(carSpeed + acceleration * effectiveDt, car.desiredSpeed);
    } else if (gap < minimumGap) {
      // Only start braking when we're actually too close
      const criticalDistance = minimumGap * 0.5; // Point where we need emergency braking
      
      if (aheadCarSpeed === 0) {
        // Approaching a stopped car - gradual braking based on distance
        const stopDistance = 0.005; // 5 meters minimum stopping distance in km
        if (gap > stopDistance * 2) {
          // Gradual deceleration when we have room
          const decelerationRate = params.aMax * 0.4 * 3.6; // Gentle braking
          carSpeed = Math.max(carSpeed - decelerationRate * effectiveDt, aheadCarSpeed);
        } else if (gap > stopDistance) {
          // More urgent braking when closer
          const decelerationRate = params.aMax * 0.8 * 3.6; 
          carSpeed = Math.max(carSpeed - decelerationRate * effectiveDt, 0);
        } else {
          // Emergency stop only when very close
          carSpeed = Math.max(carSpeed * 0.8, 0);
        }
      } else {
        // Car ahead is moving - match its speed gradually
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
    } else {
      // In the comfort zone - gentle speed matching only if needed
      const speedDifference = carSpeed - aheadCarSpeed;
      
      if (speedDifference > 15) {
        // Only adjust if significantly faster
        const adjustment = params.aMax * 0.2 * 3.6; // Very gentle adjustment
        carSpeed = Math.max(carSpeed - adjustment * effectiveDt, aheadCarSpeed);
      } else if (carSpeed < car.desiredSpeed && speedDifference <= 0) {
        // Accelerate towards desired speed if we're not faster than car ahead
        const acceleration = params.aMax * 0.5 * 3.6;
        const targetSpeed = Math.min(car.desiredSpeed, aheadCarSpeed);
        carSpeed = Math.min(carSpeed + acceleration * effectiveDt, targetSpeed);
      }
    }
    
    // Ensure speed is not negative
    carSpeed = Math.max(carSpeed, 0);

    // Ensure we don't exceed speed limit
    carSpeed = Math.min(carSpeed, params.speedLimit);
    car.virtualLength = calculateVirtualLength(carSpeed, params) / 1000; // meters to km
    
    // Calculate movement for this time step (convert km/h to km/frame)
    let potentialMove = carSpeed * (1/3600) * effectiveDt; // km/h to km/s to km/frame
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
      
      // Enhanced lane change logic for exit behavior
      const { shouldChange, targetLane } = shouldChangeLaneWithExitBehavior(
        car,
        aheadCar,
        adjacentLanes,
        params,
        laneLength,
        currentTime,
        trafficRule,
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
          // Still too close after lane change - gradual braking instead of immediate stop
          const emergencyBraking = Math.max(carSpeed * 0.6, 5); // Reduce speed by 40% but maintain minimum 5 km/h
          carSpeed = Math.max(emergencyBraking, 0);
          potentialMove = carSpeed * (1/3600) * effectiveDt;
          // Ensure we don't collide
          potentialMove = Math.min(potentialMove, Math.max(0, gap - safeGap * 0.8));
        }
      } else {
        // No valid lane change - gradual emergency braking instead of immediate stop
        const emergencyDeceleration = params.aMax * 1.2 * 3.6; // Stronger but still gradual deceleration
        carSpeed = Math.max(carSpeed - emergencyDeceleration * effectiveDt, 0);
        
        // Calculate conservative movement to avoid collision
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
    const driverProps = generateDriverProperties();

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
  if (car.lane < params.numLanes - 1) {
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
    targetAccel - currentAccel + params.politenessFactor * followerAccelChange;

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
      incentive += params.rightLaneBias;
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
  if (currentTime - car.lastLaneChange < params.laneChangeCooldown) {
    return { shouldChange: false, targetLane: null };
  }

  const gapToLeader =
    currentLeader
      ? (currentLeader.position - car.position + laneLength) % laneLength
      : Infinity;

  const slowerLeader = currentLeader &&
    currentLeader.speed < car.speed - 2 &&
    gapToLeader < 500;

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
    car.lane < params.numLanes - 1
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

  if (trafficRule === "american") {
    // American rules: prefer left-lane passing but allow right-lane passing
    // with lower probability and higher threshold
    
    // Check if we should move left to pass (preferred)
    const shouldPassLeft = 
      car.lane > 0 &&
      adjustedLeft > params.accelerationThreshold * 0.8 && // Higher threshold for left
      slowerLeader;
      
    // Check if we should move right to pass (less preferred)
    const shouldPassRight = 
      car.lane < params.numLanes - 1 &&
      adjustedRight > params.accelerationThreshold * 1.2 && // Higher threshold for right
      slowerLeader &&
      (car.lane === 0 || Math.random() > 0.9); // Much less likely to pass on right

    // Check if we should return to right lane when not passing
    const rightLaneLeader = adjacentLanes.rightLane.leader;
    const canReturnRight =
      car.lane < params.numLanes - 1 &&
      (!rightLaneLeader ||
        (rightLaneLeader.speed >= car.speed &&
          ((rightLaneLeader.position - car.position + laneLength) % laneLength > 300)));

    // Decision making with priority:
    // 1. Return to right lane when safe (if not passing)
    // 2. Pass on left if possible (preferred)
    // 3. Pass on right if no other option (rare)
    
    if (canReturnRight && 
        !slowerLeader && // Not actively trying to pass
        adjustedRight > params.accelerationThreshold * 0.5 &&
        Math.random() < car.laneChangeProbability) {
      return { shouldChange: true, targetLane: car.lane + 1 };
    } else if (shouldPassLeft && Math.random() < car.laneChangeProbability) {
      return { shouldChange: true, targetLane: car.lane - 1 };
    } else if (shouldPassRight && Math.random() < car.laneChangeProbability * 0.5) {
      return { shouldChange: true, targetLane: car.lane + 1 };
    }
  } else {
    // European rules: strict left-lane passing only
    
    // Only pass on the left
    if (
      car.lane > 0 && // Not already in leftmost lane
      adjustedLeft > params.accelerationThreshold * 0.7 && // Lower threshold for left
      slowerLeader &&
      Math.random() < car.laneChangeProbability * 1.2 // Higher probability for left
    ) {
      return { shouldChange: true, targetLane: car.lane - 1 };
    }

    // Strong incentive to return to right lane after passing
    const rightLaneLeader = adjacentLanes.rightLane.leader;
    const canReturnRight =
      car.lane < params.numLanes - 1 &&
      (!rightLaneLeader ||
        (rightLaneLeader.speed >= car.speed * 0.9 && // More aggressive about returning right
          ((rightLaneLeader.position - car.position + laneLength) % laneLength > 250)));

    // If not actively passing, try to return right
    if (
      canReturnRight &&
      (!slowerLeader || car.lane === 0) && // Either no slower leader or already in left lane
      adjustedRight > params.accelerationThreshold * 0.3 && // Lower threshold to return right
      Math.random() < car.laneChangeProbability * 1.5 // Higher probability to return right
    ) {
      return { shouldChange: true, targetLane: car.lane + 1 };
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
  if (currentTime - car.lastLaneChange < params.laneChangeCooldown) {
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
