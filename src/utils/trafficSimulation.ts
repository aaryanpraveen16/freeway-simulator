// Constants and types for traffic simulation
export interface Car {
  id: number;
  name: string; // Add name property
  position: number; // position in the loop (0 to laneLength)
  lane: number; // current lane (0 to numLanes-1)
  speed: number; // speed in mph
  desiredSpeed: number; // desired speed in mph
  color: string; // color for visualization
  virtualLength: number; // physical length + safe distance
  distTripPlanned: number; // planned trip distance in feet
  distanceTraveled: number; // distance traveled so far in feet
  lastLaneChange: number; // time of last lane change
  driverType: 'aggressive' | 'normal' | 'passive';
  laneChangeProbability: number;
  laneStickiness: number;
}

export interface SimulationParams {
  numCars: number;
  numLanes: number; // number of lanes
  dt: number; // time step in seconds
  aMax: number; // max deceleration
  k: number; // speed adjustment sensitivity
  lengthCar: number; // physical car length in feet
  tDist: number; // time headway in seconds
  initialGap: number; // initial gap between cars in feet
  brakeTime: number; // time at which leader car starts braking
  brakeCarIndex: number; // index of the car to brake (default: 0 for first car)
  minSpeed: number; // minimum speed in mph
  maxSpeed: number; // maximum speed in mph
  meanSpeed: number; // mean desired speed in mph
  stdSpeed: number; // standard deviation of desired speeds
  meanDistTripPlanned: number; // mean planned trip distance in miles
  sigmaDistTripPlanned: number; // standard deviation of planned trip distances
  speedLimit: number;
  freewayLength: number; // total length of the freeway in miles
  // MOBIL parameters
  politenessFactor: number; // p in MOBIL model (0-1)
  accelerationThreshold: number; // a_thr in MOBIL model
  laneChangeCooldown: number; // minimum time between lane changes
  rightLaneBias: number; // bias towards right lane (0-1)
  // Driver behavior parameters
  aggressiveDriverRatio: number;
  passiveDriverRatio: number;
  minLaneChangeProbability: number;
  maxLaneChangeProbability: number;
  minLaneStickiness: number;
  maxLaneStickiness: number;
}

// Default simulation parameters
export const defaultParams: SimulationParams = {
  numCars: 10,
  numLanes: 1, // start with 1 lane
  dt: 0.1, // 100ms time step
  aMax: 10, // ft/s^2
  k: 0.3, // unitless
  lengthCar: 15, // feet
  tDist: 3, // seconds
  initialGap: 50, // feet
  brakeTime: 5, // seconds
  brakeCarIndex: 0, // default to first car
  minSpeed: 10, // mph
  maxSpeed: 80, // mph
  meanSpeed: 65, // mph
  stdSpeed: 5, // mph
  meanDistTripPlanned: 10, // 10 miles
  sigmaDistTripPlanned: 0.5, // standard deviation for log-normal distribution
  speedLimit: 70,
  freewayLength: 10, // 10 miles
  // MOBIL parameters
  politenessFactor: 0.5, // balanced between selfish and polite
  accelerationThreshold: 0.2, // m/s^2
  laneChangeCooldown: 2, // seconds
  rightLaneBias: 0.2, // slight bias towards right lane
  // Driver behavior parameters
  aggressiveDriverRatio: 0.2, // 20% aggressive drivers
  passiveDriverRatio: 0.3, // 30% passive drivers
  minLaneChangeProbability: 0.2,
  maxLaneChangeProbability: 0.8,
  minLaneStickiness: 0.1,
  maxLaneStickiness: 0.9,
};

// Generate random number from normal distribution
export function normalRandom(mean: number, std: number, min?: number, max?: number): number {
  let u1 = Math.random();
  let u2 = Math.random();
  let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  let value = mean + z0 * std;
  
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

// Generate random number from log-normal distribution
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

// Calculate safe following distance based on speed
export function calculateSafeDistance(speed: number, tDist: number): number {
  // Convert mph to ft/s: 1 mph = 5280/3600 ft/s = 1.467 ft/s
  return tDist * speed * (5280 / 3600);
}

// Calculate virtual car length (physical length + safe distance)
export function calculateVirtualLength(speed: number, params: SimulationParams): number {
  const safeDistance = calculateSafeDistance(speed, params.tDist);
  return params.lengthCar + safeDistance;
}

// Calculate car color based on car state
function calculateCarColor(car: Car): string {
  // Convert distances to miles for easier threshold comparison
  const distanceTraveledMiles = car.distanceTraveled / 5280;
  const distanceLeftMiles = (car.distTripPlanned - car.distanceTraveled) / 5280;
  const entryThresholdMiles = 2; // 2 miles threshold for entry/exit colors
  
  // Lane change: highest priority
  if (car.lastLaneChange && (Date.now() / 1000 - car.lastLaneChange) < 2) {
    return "hsl(48, 96%, 53%)"; // Yellow
  }
  
  // About to leave (within last 2 miles)
  if (distanceLeftMiles <= entryThresholdMiles) {
    // Full red when within 1 mile of exit
    if (distanceLeftMiles <= entryThresholdMiles / 2) {
      return "hsl(0, 72%, 51%)"; // Full red
    }
    // Light red when within 2 miles of exit
    return "hsl(0, 72%, 65%)"; // Light red
  }
  
  // Just entered (within first 2 miles)
  if (distanceTraveledMiles <= entryThresholdMiles) {
    // Full green when within 1 mile of entry
    if (distanceTraveledMiles <= entryThresholdMiles / 2) {
      return "hsl(142, 72%, 29%)"; // Full green
    }
    // Light green when within 2 miles of entry
    return "hsl(142, 72%, 45%)"; // Light green
  }
  
  // Default
  return "hsl(0, 0%, 100%)"; // White
}

// Initialize the simulation
export function initializeSimulation(params: SimulationParams): {
  cars: Car[];
  laneLength: number;
  density: number;
} {
  const cars: Car[] = [];
  
  // Convert miles to feet for internal calculations
  const laneLengthInFeet = params.freewayLength * 5280;
  
  // Generate cars with random desired speeds and driver types
  for (let i = 0; i < params.numCars; i++) {
    const desiredSpeed = normalRandom(
      params.meanSpeed,
      params.stdSpeed,
      params.minSpeed,
      params.maxSpeed
    );
    
    // Determine driver type based on ratios
    const random = Math.random();
    let driverType: 'aggressive' | 'normal' | 'passive';
    if (random < params.aggressiveDriverRatio) {
      driverType = 'aggressive';
    } else if (random < params.aggressiveDriverRatio + params.passiveDriverRatio) {
      driverType = 'passive';
    } else {
      driverType = 'normal';
    }
    
    // Set lane change probability and stickiness based on driver type
    let laneChangeProbability: number;
    let laneStickiness: number;
    
    switch (driverType) {
      case 'aggressive':
        laneChangeProbability = params.maxLaneChangeProbability;
        laneStickiness = params.minLaneStickiness;
        break;
      case 'passive':
        laneChangeProbability = params.minLaneChangeProbability;
        laneStickiness = params.maxLaneStickiness;
        break;
      default: // normal
        laneChangeProbability = (params.minLaneChangeProbability + params.maxLaneChangeProbability) / 2;
        laneStickiness = (params.minLaneStickiness + params.maxLaneStickiness) / 2;
    }
    
    // Initial speed is the desired speed
    const speed = desiredSpeed;
    
    // Calculate virtual length based on initial speed
    const virtualLength = calculateVirtualLength(speed, params);
    
    // Generate planned trip distance using log-normal distribution (convert miles to feet)
    const distTripPlanned = logNormalRandom(
      params.meanDistTripPlanned * 5280,
      params.sigmaDistTripPlanned
    );
    
    cars.push({
      id: i,
      name: `Car ${i + 1}`,
      position: 0,
      lane: Math.floor(Math.random() * params.numLanes), // random lane
      speed,
      desiredSpeed,
      color: calculateCarColor({ distanceTraveled: 0, distTripPlanned } as Car),
      virtualLength,
      distTripPlanned,
      distanceTraveled: 0,
      lastLaneChange: 0,
      driverType,
      laneChangeProbability,
      laneStickiness,
    });
  }
  
  // Calculate traffic density (cars per mile)
  const density = params.numCars / params.freewayLength;
  
  // UPDATED: Randomly position cars along the lane
  // Create an array of possible positions
  const usedPositions: number[] = [];
  
  // For each car, find a random position that doesn't overlap with other cars
  for (let i = 0; i < params.numCars; i++) {
    let validPosition = false;
    let position = 0;
    
    // Try to find a valid position
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops
    
    while (!validPosition && attempts < maxAttempts) {
      // Generate a random position around the track
      position = Math.random() * laneLengthInFeet;
      validPosition = true;
      
      // Check if this position is too close to any other car
      for (const usedPos of usedPositions) {
        const distance = Math.abs(position - usedPos);
        const wrappedDistance = Math.min(distance, laneLengthInFeet - distance);
        
        // If too close to another car, try again
        if (wrappedDistance < params.lengthCar + params.initialGap / 2) {
          validPosition = false;
          break;
        }
      }
      
      attempts++;
    }
    
    // If we couldn't find a completely valid position, just use the last attempt
    usedPositions.push(position);
    cars[i].position = position;
  }
  
  // Sort cars by position for better initial state visualization
  cars.sort((a, b) => a.position - b.position);
  
  // Reassign IDs to maintain the order
  for (let i = 0; i < cars.length; i++) {
    cars[i].id = i;
    cars[i].name = `Car ${i + 1}`;
  }
  
  return { cars, laneLength: laneLengthInFeet, density };
}

// Calculate distance to car ahead
export function calculateDistanceToCarAhead(carIndex: number, cars: Car[], laneLength: number): number {
  const currentCar = cars[carIndex];
  const aheadCarIndex = (carIndex + 1) % cars.length;
  const aheadCar = cars[aheadCarIndex];
  
  // Calculate distance with wrap-around
  let distance = aheadCar.position - currentCar.position;
  if (distance < 0) {
    distance += laneLength;
  }
  
  return Math.round(distance);
}

// Update simulation for one time step
export function updateSimulation(
  cars: Car[],
  laneLength: number,
  params: SimulationParams,
  currentTime: number,
  trafficRule: 'american' | 'european'
): { 
  cars: Car[]; 
  events: { 
    type: 'exit' | 'enter' | 'laneChange'; 
    carId: number; 
    carName: string; 
    position: number;
    speed: number;
    lane?: number;
  }[] 
} {
  const updatedCars = [...cars];
  const numCars = cars.length;
  
  // First, calculate all car movements without updating positions
  const movements: { newPosition: number; newSpeed: number; distanceTraveled: number; newLane?: number }[] = [];
  const carsToRemove: { index: number; car: Car }[] = [];
  const events: { type: 'exit' | 'enter' | 'laneChange'; carId: number; carName: string; position: number; speed: number; lane?: number }[] = [];

  // Sort cars by position to ensure we process them in order
  const sortedIndices = [...Array(numCars).keys()].sort((a, b) => {
    return updatedCars[a].position - updatedCars[b].position;
  });

  // Process cars in order of position to prevent overlapping
  for (let i = 0; i < numCars; i++) {
    const carIndex = sortedIndices[i];
    const car = updatedCars[carIndex];
    let carSpeed = car.speed;

    // Find the car ahead in the same lane
    const sameLaneCars = updatedCars.filter(c => c.lane === car.lane);
    const sortedSameLaneCars = sameLaneCars.sort((a, b) => {
      const distA = (a.position - car.position + laneLength) % laneLength;
      const distB = (b.position - car.position + laneLength) % laneLength;
      return distA - distB;
    });
    const aheadCar = sortedSameLaneCars.find(c => 
      (c.position - car.position + laneLength) % laneLength > 0
    );
    
    // Calculate gap to car ahead (with wrap-around)
    let gap = aheadCar ? (aheadCar.position - car.position + laneLength) % laneLength : laneLength;

    // Check for lane changing opportunities
    const adjacentLanes = findAdjacentCars(car, updatedCars, laneLength, params);
    const { shouldChange, targetLane } = shouldChangeLane(
      car,
      aheadCar,
      adjacentLanes,
      params,
      laneLength,
      currentTime,
      trafficRule
    );

    // Apply lane change if beneficial
    if (shouldChange && targetLane !== null) {
      movements[carIndex] = {
        ...movements[carIndex],
        newLane: targetLane
      };
      
      // Add lane change event
      events.push({
        type: 'laneChange',
        carId: car.id,
        carName: car.name,
        position: car.position,
        speed: car.speed,
        lane: targetLane
      });
    }

    // Apply speed adjustments
    carSpeed += (car.desiredSpeed - carSpeed) * params.k * params.dt;
    carSpeed = Math.min(carSpeed, params.speedLimit);

    // Apply safe-distance logic
    const safeDist = calculateSafeDistance(carSpeed, params.tDist);
    car.virtualLength = calculateVirtualLength(carSpeed, params);

    if (gap < safeDist + params.lengthCar) {
      const decel = Math.min(
        (carSpeed ** 2 - (aheadCar?.speed || params.maxSpeed) ** 2) / (2 * Math.max(safeDist - gap + params.lengthCar, 1)),
        params.aMax
      );
      carSpeed = Math.max(
        carSpeed - decel * (3600 / 5280) * params.dt,
        0
      );
      if (gap < params.lengthCar * 1.5) {
        carSpeed = Math.min(carSpeed, (aheadCar?.speed || 0) * 0.9);
      }
    }

    // Calculate movement
    const mphToFtPerSec = 5280 / 3600;
    const potentialMove = carSpeed * mphToFtPerSec * params.dt;
    
    // Calculate new position with wrap-around
    const newPosition = (car.position + potentialMove) % laneLength;
    
    // Update distance traveled (this accumulates even with wrap-around)
    const newDistanceTraveled = car.distanceTraveled + potentialMove;
    
    // Store the new position, speed, and distance traveled
    movements[carIndex] = { 
      newPosition, 
      newSpeed: carSpeed,
      distanceTraveled: newDistanceTraveled,
      newLane: movements[carIndex]?.newLane
    };
  }

  // Now update all car positions, speeds, and lanes
  for (let i = 0; i < numCars; i++) {
    updatedCars[i].position = movements[i].newPosition;
    updatedCars[i].speed = movements[i].newSpeed;
    updatedCars[i].distanceTraveled = movements[i].distanceTraveled;
    updatedCars[i].color = calculateCarColor(updatedCars[i]);
    
    // Update lane if changed
    if (movements[i].newLane !== undefined) {
      updatedCars[i].lane = movements[i].newLane;
      updatedCars[i].lastLaneChange = currentTime;
    }
    
    // Check if car has completed its planned trip
    if (updatedCars[i].distanceTraveled >= updatedCars[i].distTripPlanned) {
      carsToRemove.push({ index: i, car: updatedCars[i] });
    }
  }
  
  // Remove cars that have completed their trips
  for (let i = carsToRemove.length - 1; i >= 0; i--) {
    const { index: indexToRemove, car } = carsToRemove[i];
    updatedCars.splice(indexToRemove, 1);
    
    // Add exit event
    events.push({
      type: 'exit',
      carId: car.id,
      carName: car.name,
      position: car.position,
      speed: car.speed
    });
  }
  
  // Add new cars to maintain traffic density
  for (let i = 0; i < carsToRemove.length; i++) {
    const newPosition = 0;
    const desiredSpeed = normalRandom(
      params.meanSpeed,
      params.stdSpeed,
      params.minSpeed,
      params.maxSpeed
    );
    const speed = desiredSpeed;
    const virtualLength = calculateVirtualLength(speed, params);
    const distTripPlanned = logNormalRandom(
      params.meanDistTripPlanned * 5280,
      params.sigmaDistTripPlanned
    );
    const newId = updatedCars.length > 0 
      ? Math.max(...updatedCars.map(car => car.id)) + 1 
      : 0;
    
    // Add the new car
    const newCar = {
      id: newId,
      name: `Car ${newId + 1}`,
      position: newPosition,
      lane: Math.floor(Math.random() * params.numLanes), // random lane
      speed,
      desiredSpeed,
      color: calculateCarColor({ distanceTraveled: 0, distTripPlanned } as Car),
      virtualLength,
      distTripPlanned,
      distanceTraveled: 0,
      lastLaneChange: currentTime,
      driverType: 'normal' as const,
      laneChangeProbability: (params.minLaneChangeProbability + params.maxLaneChangeProbability) / 2,
      laneStickiness: (params.minLaneStickiness + params.maxLaneStickiness) / 2,
    };
    
    updatedCars.push(newCar);
    
    // Add enter event
    events.push({
      type: 'enter',
      carId: newId,
      carName: newCar.name,
      position: newPosition,
      speed: speed
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
      (currentSpeed ** 2 - leaderSpeedFtPerSec ** 2) / (2 * Math.max(safeDist - gap + params.lengthCar, 1)),
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
): { leftLane: { leader?: Car; follower?: Car }; rightLane: { leader?: Car; follower?: Car } } {
  const result = {
    leftLane: { leader: undefined, follower: undefined },
    rightLane: { leader: undefined, follower: undefined }
  };
  
  // Check if left lane exists
  if (car.lane > 0) {
    const leftLaneCars = cars.filter(c => c.lane === car.lane - 1);
    if (leftLaneCars.length > 0) {
      // Find leader and follower in left lane
      const sortedLeftLaneCars = leftLaneCars.sort((a, b) => {
        const distA = (a.position - car.position + laneLength) % laneLength;
        const distB = (b.position - car.position + laneLength) % laneLength;
        return distA - distB;
      });
      
      result.leftLane.leader = sortedLeftLaneCars.find(c => 
        (c.position - car.position + laneLength) % laneLength > 0
      );
      result.leftLane.follower = sortedLeftLaneCars.find(c => 
        (car.position - c.position + laneLength) % laneLength > 0
      );
    }
  }
  
  // Check if right lane exists
  if (car.lane < params.numLanes - 1) {
    const rightLaneCars = cars.filter(c => c.lane === car.lane + 1);
    if (rightLaneCars.length > 0) {
      // Find leader and follower in right lane
      const sortedRightLaneCars = rightLaneCars.sort((a, b) => {
        const distA = (a.position - car.position + laneLength) % laneLength;
        const distB = (b.position - car.position + laneLength) % laneLength;
        return distA - distB;
      });
      
      result.rightLane.leader = sortedRightLaneCars.find(c => 
        (c.position - car.position + laneLength) % laneLength > 0
      );
      result.rightLane.follower = sortedRightLaneCars.find(c => 
        (car.position - c.position + laneLength) % laneLength > 0
      );
    }
  }
  
  return result;
}

// Calculate MOBIL incentive for lane change
function calculateLaneChangeIncentive(
  car: Car,
  currentLeader: Car | undefined,
  targetLane: { leader?: Car; follower?: Car },
  params: SimulationParams,
  laneLength: number
): number {
  // Calculate current acceleration
  const currentGap = currentLeader ? 
    (currentLeader.position - car.position + laneLength) % laneLength : 
    laneLength;
  const currentAccel = calculateAcceleration(
    car,
    currentGap,
    currentLeader?.speed || params.maxSpeed,
    params
  );
  
  // Calculate acceleration in target lane
  const targetGap = targetLane.leader ? 
    (targetLane.leader.position - car.position + laneLength) % laneLength : 
    laneLength;
  const targetAccel = calculateAcceleration(
    car,
    targetGap,
    targetLane.leader?.speed || params.maxSpeed,
    params
  );
  
  // Calculate follower's acceleration change
  let followerAccelChange = 0;
  if (targetLane.follower) {
    const followerGapBefore = (car.position - targetLane.follower.position + laneLength) % laneLength;
    const followerGapAfter = (targetLane.leader ? 
      (targetLane.leader.position - targetLane.follower.position + laneLength) % laneLength : 
      laneLength);
    
    const followerAccelBefore = calculateAcceleration(
      targetLane.follower,
      followerGapBefore,
      car.speed,
      params
    );
    const followerAccelAfter = calculateAcceleration(
      targetLane.follower,
      followerGapAfter,
      targetLane.leader?.speed || params.maxSpeed,
      params
    );
    
    followerAccelChange = followerAccelAfter - followerAccelBefore;
  }
  
  // Calculate MOBIL incentive
  let incentive = targetAccel - currentAccel + params.politenessFactor * followerAccelChange;
  
  // Add right lane bias
  if (targetLane.leader && car.lane < targetLane.leader.lane) {
    incentive += params.rightLaneBias;
  }
  
  return incentive;
}

// Determine if lane change is possible and beneficial
function shouldChangeLane(
  car: Car,
  currentLeader: Car | undefined,
  adjacentLanes: { leftLane: { leader?: Car; follower?: Car }; rightLane: { leader?: Car; follower?: Car } },
  params: SimulationParams,
  laneLength: number,
  currentTime: number,
  trafficRule: 'american' | 'european'
): { shouldChange: boolean; targetLane: number | null } {
  // Check if enough time has passed since last lane change
  if (currentTime - car.lastLaneChange < params.laneChangeCooldown) {
    return { shouldChange: false, targetLane: null };
  }

  // Only consider lane change if there is a slower car ahead within 500 feet and at least 2 mph slower
  if (!currentLeader || currentLeader.speed >= car.speed - 2) {
    return { shouldChange: false, targetLane: null };
  }
  const gapToLeader = (currentLeader.position - car.position + laneLength) % laneLength;
  if (gapToLeader > 500) {
    return { shouldChange: false, targetLane: null };
  }

  // Calculate incentives for both lanes
  const leftIncentive = car.lane > 0 ? 
    calculateLaneChangeIncentive(car, currentLeader, adjacentLanes.leftLane, params, laneLength) : 
    -Infinity;
  const rightIncentive = car.lane < params.numLanes - 1 ? 
    calculateLaneChangeIncentive(car, currentLeader, adjacentLanes.rightLane, params, laneLength) : 
    -Infinity;
  
  // Apply lane stickiness to incentives
  const adjustedLeftIncentive = leftIncentive * (1 - car.laneStickiness);
  const adjustedRightIncentive = rightIncentive * (1 - car.laneStickiness);
  
  // Strict overtaking: only allow overtaking in the correct direction
  if (trafficRule === 'american') {
    // Only consider left lane for overtaking (up, lower index)
    if (car.lane > 0 && adjustedLeftIncentive > params.accelerationThreshold) {
      const targetLane = car.lane - 1;
      if (Math.random() < car.laneChangeProbability) {
        return { shouldChange: true, targetLane };
      }
    }
  } else {
    // Only consider right lane for overtaking (down, higher index)
    if (car.lane < params.numLanes - 1 && adjustedRightIncentive > params.accelerationThreshold) {
      const targetLane = car.lane + 1;
      if (Math.random() < car.laneChangeProbability) {
        return { shouldChange: true, targetLane };
      }
    }
  }
  
  return { shouldChange: false, targetLane: null };
}
