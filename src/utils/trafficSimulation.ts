// Constants and types for traffic simulation
export interface Car {
  id: number;
  name: string; // Add name property
  position: number; // position in the loop (0 to laneLength)
  speed: number; // speed in mph
  desiredSpeed: number; // desired speed in mph
  color: string; // color for visualization
  virtualLength: number; // physical length + safe distance (miles)
  distTripPlanned: number; // planned trip distance in miles
  distanceTraveled: number; // distance traveled so far in miles
  lane?: number; // lane index (optional)
  laneStickiness?: number; // resistance to lane change (0-1)
  laneChangeProbability?: number; // probability to change lanes (0-1)
  lastLaneChange?: number; // timestamp of last lane change (seconds)
}

export interface SimulationParams {
  numCars: number;
  dt: number; // time step in seconds
  aMax: number; // max deceleration (mi/s^2)
  k: number; // speed adjustment sensitivity
  lengthCar: number; // physical car length in miles
  tDist: number; // time headway in seconds
  initialGap: number; // initial gap between cars in miles
  brakeTime: number; // time at which leader car starts braking
  brakeCarIndex: number; // index of the car to brake (default: 0 for first car)
  minSpeed: number; // minimum speed in mph
  maxSpeed: number; // maximum speed in mph
  meanSpeed: number; // mean desired speed in mph
  stdSpeed: number; // standard deviation of desired speeds
  meanDistTripPlanned: number; // mean planned trip distance in miles
  sigmaDistTripPlanned: number; // standard deviation of planned trip distances (miles)
  speedLimit:number;
  freewayLength?: number; // length of the freeway in miles
  numLanes?: number; // number of lanes
  politenessFactor?: number; // MOBIL politeness factor
  rightLaneBias?: number; // bias for right lane
  accelerationThreshold?: number; // threshold for lane change incentive
  laneChangeCooldown?: number; // min time between lane changes (seconds)
}

// Default simulation parameters
export const defaultParams: SimulationParams = {
  numCars: 10,
  dt: 0.1, // 100ms time step
  aMax: 10 / 5280, // 10 ft/s^2 converted to mi/s^2
  k: 0.3, // unitless
  lengthCar: 15 / 5280, // 15 feet in miles
  tDist: 3, // seconds
  initialGap: 50 / 5280, // 50 feet in miles
  brakeTime: 5, // seconds
  brakeCarIndex: 0, // default to first car
  minSpeed: 10, // mph
  maxSpeed: 80, // mph
  meanSpeed: 65, // mph
  stdSpeed: 5, // mph
  meanDistTripPlanned: 1.9, // 1.9 miles
  sigmaDistTripPlanned: 0.5, // standard deviation for log-normal distribution (miles)
  speedLimit: 70,
  freewayLength: 10, // initial value in miles
  numLanes: 1, // default to 1 lane
  politenessFactor: 0.3, // typical MOBIL value
  rightLaneBias: 0.1, // small bias for right lane
  accelerationThreshold: 0.2, // threshold for lane change
  laneChangeCooldown: 2, // seconds
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

// Calculate safe following distance based on speed (returns miles)
export function calculateSafeDistance(speed: number, tDist: number): number {
  // speed in mph, tDist in seconds
  // Convert mph to miles per second: 1 mph = 1/3600 miles/sec
  return tDist * speed / 3600;
}

// Calculate virtual car length (physical length + safe distance) in miles
export function calculateVirtualLength(speed: number, params: SimulationParams): number {
  const lengthCarMiles = params.lengthCar;
  const safeDistance = calculateSafeDistance(speed, params.tDist);
  return lengthCarMiles + safeDistance;
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
  
  // Generate cars with random desired speeds
  for (let i = 0; i < params.numCars; i++) {
    const desiredSpeed = normalRandom(
      params.meanSpeed,
      params.stdSpeed,
      params.minSpeed,
      params.maxSpeed
    );
    
    // Initial speed is the desired speed
    const speed = desiredSpeed;
    
    // Calculate virtual length based on initial speed (in miles)
    const virtualLength = calculateVirtualLength(speed, params);
    
    // Generate planned trip distance using log-normal distribution (miles)
    const distTripPlanned = logNormalRandom(
      params.meanDistTripPlanned,
      params.sigmaDistTripPlanned
    );
    
    const car: Car = {
      id: i,
      name: `Car ${i + 1}`,
      position: 0, // Will be set properly later (in miles)
      lane: Math.floor(Math.random() * (params.numLanes ?? 1)), // random lane
      speed,
      desiredSpeed,
      color: '', // will set below
      virtualLength,
      distTripPlanned,
      distanceTraveled: 0,
      laneStickiness: 0.2, // default stickiness
      laneChangeProbability: 0.3, // default probability
      lastLaneChange: 0,
    };
    car.color = getCarColor(car);
    cars.push(car);
  }
  
  // Calculate total lane length based on virtual lengths (in miles)
  const totalVirtualLength = cars.reduce((sum, car) => sum + car.virtualLength, 0);
  const buffer = params.initialGap * params.numCars; // buffer in miles
  const laneLength = params.freewayLength ?? 10; // lane length in miles
  
  // Calculate traffic density (cars per mile)
  const density = params.numCars / laneLength;
  
  // UPDATED: Randomly position cars along the lane (in miles)
  const usedPositions: number[] = [];
  for (let i = 0; i < params.numCars; i++) {
    let validPosition = false;
    let position = 0;
    let attempts = 0;
    const maxAttempts = 100;
    while (!validPosition && attempts < maxAttempts) {
      position = Math.random() * laneLength;
      validPosition = true;
      for (const usedPos of usedPositions) {
        const distance = Math.abs(position - usedPos);
        const wrappedDistance = Math.min(distance, laneLength - distance);
        if (wrappedDistance < params.lengthCar + params.initialGap / 2) {
          validPosition = false;
          break;
        }
      }
      attempts++;
    }
    usedPositions.push(position);
    cars[i].position = position;
  }
  cars.sort((a, b) => a.position - b.position);
  for (let i = 0; i < cars.length; i++) {
    cars[i].id = i;
    cars[i].name = `Car ${i + 1}`;
  }
  return { cars, laneLength, density };
}

// Calculate distance to car ahead (in miles)
export function calculateDistanceToCarAhead(carIndex: number, cars: Car[], laneLength: number): number {
  const currentCar = cars[carIndex];
  const aheadCarIndex = (carIndex + 1) % cars.length;
  const aheadCar = cars[aheadCarIndex];
  let distance = aheadCar.position - currentCar.position;
  if (distance < 0) {
    distance += laneLength;
  }
  return distance;
}

// Utility to get car color based on entry/exit distance
export function getCarColor(car: Car): string {
  const entryThreshold = 2; // miles
  const exitThreshold = 2; // miles
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
  trafficRule: 'american' | 'european'
): { 
  cars: Car[]; 
  events: { 
    type: 'exit' | 'enter'; 
    carId: number; 
    carName: string; 
    position: number;
    speed: number;
  }[] 
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
  const movements: { newPosition: number; newSpeed: number; distanceTraveled: number }[] = [];
  const carsToRemove: { index: number; car: Car }[] = [];
  const events: { type: 'exit' | 'enter'; carId: number; carName: string; position: number; speed: number }[] = [];
  const sortedIndices = [...Array(numCars).keys()].sort((a, b) => {
    return updatedCars[a].position - updatedCars[b].position;
  });
  for (let i = 0; i < numCars; i++) {
    const carIndex = sortedIndices[i];
    const car = updatedCars[carIndex];
    let carSpeed = car.speed;

    // Find the car ahead in the same lane
    let currentLane = car.lane;
    let sameLaneCars = updatedCars.filter(c => c.lane === currentLane);
    let sortedSameLaneCars = sameLaneCars.sort((a, b) => {
      const distA = (a.position - car.position + laneLength) % laneLength;
      const distB = (b.position - car.position + laneLength) % laneLength;
      return distA - distB;
    });
    let aheadCar = sortedSameLaneCars.find(c => 
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
      updatedCars[carIndex].lane = targetLane;
      updatedCars[carIndex].lastLaneChange = currentTime;
      // After lane change, recalculate car ahead and gap in the new lane
      currentLane = targetLane;
      sameLaneCars = updatedCars.filter(c => c.lane === currentLane);
      sortedSameLaneCars = sameLaneCars.sort((a, b) => {
        const distA = (a.position - car.position + laneLength) % laneLength;
        const distB = (b.position - car.position + laneLength) % laneLength;
        return distA - distB;
      });
      aheadCar = sortedSameLaneCars.find(c => 
        (c.position - car.position + laneLength) % laneLength > 0
      );
      gap = aheadCar ? (aheadCar.position - car.position + laneLength) % laneLength : laneLength;
    }
    carSpeed += (car.desiredSpeed - carSpeed) * params.k * params.dt;
    carSpeed = Math.min(carSpeed, params.speedLimit);
    const safeDist = calculateSafeDistance(carSpeed, params.tDist);
    car.virtualLength = calculateVirtualLength(carSpeed, params);
    if (gap < safeDist + (params.lengthCar / 5280)) {
      const decel = Math.min(
        (carSpeed ** 2 - aheadCar.speed ** 2) / (2 * Math.max(safeDist - gap + (params.lengthCar / 5280), 1e-6)),
        params.aMax
      );
      carSpeed = Math.max(
        carSpeed - decel * (1 / 3600) * params.dt,
        0
      );
      if (gap < (params.lengthCar * 1.5) / 5280) {
        carSpeed = Math.min(carSpeed, aheadCar.speed * 0.9);
      }
    }
    // Convert speed from mph to miles per second
    const mphToMilesPerSec = 1 / 3600;
    const potentialMove = carSpeed * mphToMilesPerSec * params.dt;
    const newPosition = (car.position + potentialMove) % laneLength;
    const newDistanceTraveled = car.distanceTraveled + potentialMove;
    movements[carIndex] = { 
      newPosition, 
      newSpeed: carSpeed,
      distanceTraveled: newDistanceTraveled
    };
  }
  for (let i = 0; i < numCars; i++) {
    updatedCars[i].position = movements[i].newPosition;
    updatedCars[i].speed = movements[i].newSpeed;
    updatedCars[i].distanceTraveled = movements[i].distanceTraveled;
    // Set color based on entry/exit distance
    updatedCars[i].color = getCarColor(updatedCars[i]);
    if (updatedCars[i].distanceTraveled >= updatedCars[i].distTripPlanned) {
      carsToRemove.push({ index: i, car: updatedCars[i] });
    }
  }
  for (let i = carsToRemove.length - 1; i >= 0; i--) {
    const { index: indexToRemove, car } = carsToRemove[i];
    updatedCars.splice(indexToRemove, 1);
    events.push({
      type: 'exit',
      carId: car.id,
      carName: car.name,
      position: car.position,
      speed: car.speed
    });
  }
  for (let i = 0; i < carsToRemove.length; i++) {
    // Try to find a safe gap in any lane
    const laneCount = params.numLanes || 1;
    let inserted = false;
    for (let lane = 0; lane < laneCount; lane++) {
      // Get cars in this lane, sorted by position
      const laneCars = updatedCars.filter(c => c.lane === lane).sort((a, b) => a.position - b.position);
      const laneLength = params.freewayLength ?? 10;
      let bestGap = -1;
      let bestPos = 0;
      // If no cars in lane, whole lane is available
      if (laneCars.length === 0) {
        bestGap = laneLength;
        bestPos = 0;
      } else {
        // Find the largest gap between cars in this lane
        for (let j = 0; j < laneCars.length; j++) {
          const carA = laneCars[j];
          const carB = laneCars[(j + 1) % laneCars.length];
          let gap = (carB.position - carA.position + laneLength) % laneLength;
          if (gap > bestGap) {
            bestGap = gap;
            bestPos = (carA.position + gap / 2) % laneLength;
          }
        }
      }
      // Check if the best gap is safe (at least minGap)
      const minGap = (params.lengthCar + params.initialGap) / 5280;
      if (bestGap >= minGap) {
        // Insert car here
        const desiredSpeed = normalRandom(
          params.meanSpeed,
          params.stdSpeed,
          params.minSpeed,
          params.maxSpeed
        );
        const speed = desiredSpeed;
        const virtualLength = calculateVirtualLength(speed, params);
        const distTripPlanned = logNormalRandom(
          params.meanDistTripPlanned,
          params.sigmaDistTripPlanned
        ) / 5280;
        const newId = updatedCars.length > 0 
          ? Math.max(...updatedCars.map(car => car.id)) + 1 
          : 0;
        const newCar = {
          id: newId,
          name: `Car ${newId + 1}`,
          position: bestPos,
          lane: lane,
          speed,
          desiredSpeed,
          color: carColors[newId % carColors.length],
          virtualLength,
          distTripPlanned,
          distanceTraveled: 0,
          laneStickiness: 0.2, // default stickiness
          laneChangeProbability: 0.3, // default probability
          lastLaneChange: 0,
        };
        updatedCars.push(newCar);
        events.push({
          type: 'enter',
          carId: newId,
          carName: newCar.name,
          position: bestPos,
          speed: speed
        });
        inserted = true;
        break;
      }
    }
    // If no safe gap found in any lane, skip adding the car this step
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
