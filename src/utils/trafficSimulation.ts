// Constants and types for traffic simulation
export interface Car {
  id: number;
  name: string; // Add name property
  position: number; // position in the loop (0 to laneLength)
  speed: number; // speed in mph
  desiredSpeed: number; // desired speed in mph
  color: string; // color for visualization
  virtualLength: number; // physical length + safe distance
  distTripPlanned: number; // planned trip distance in feet
  distanceTraveled: number; // distance traveled so far in feet
  lane: number; // lane index (required)
  driverType: "aggressive" | "normal" | "conservative"; // driver personality
  laneChangeProbability: number; // probability of changing lanes (0-1)
  laneStickiness: number; // tendency to stay in current lane (0-1)
  lastLaneChange?: number; // timestamp of last lane change
}

export interface SimulationParams {
  trafficDensity: number[]; // cars per mile per lane
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
  speedLimit: number;
  freewayLength?: number; // length of the freeway in miles
  numLanes?: number; // number of lanes
  politenessFactor?: number; // MOBIL politeness factor
  rightLaneBias?: number; // bias for right lane
  accelerationThreshold?: number; // threshold for lane change incentive
  laneChangeCooldown?: number; // min time between lane changes (seconds)
}

// Default simulation parameters
export const defaultParams: SimulationParams = {
  trafficDensity: [0.5, 0.5], // 3 cars per mile per lane (default for 2 lanes)
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
  meanDistTripPlanned: 10, // 1.9 miles
  sigmaDistTripPlanned: 0.5, // standard deviation for log-normal distribution (miles)
  speedLimit: 70,
  freewayLength: 10, // initial value in miles
  numLanes: 2, // default to 2 lanes
  politenessFactor: 0.3, // typical MOBIL value
  rightLaneBias: 0.1, // small bias for right lane
  accelerationThreshold: 0.2, // threshold for lane change
  laneChangeCooldown: 2, // seconds
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

// Calculate safe following distance based on speed (returns miles)
export function calculateSafeDistance(speed: number, tDist: number): number {
  // speed in mph, tDist in seconds
  // Convert mph to miles per second: 1 mph = 1/3600 miles/sec
  return (tDist * speed) / 3600;
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
  const laneLength = params.freewayLength ?? 10; // lane length in miles

  // Calculate total number of cars based on traffic density per lane
  let totalCars = 0;
  for (let lane = 0; lane < numLanes; lane++) {
    const densityForLane =
      params.trafficDensity[lane] || params.trafficDensity[0] || 3;
    const carsInThisLane = Math.round(densityForLane * laneLength);
    totalCars += carsInThisLane;
  }

  // Generate cars with random desired speeds
  let carId = 0;
  for (let lane = 0; lane < numLanes; lane++) {
    const densityForLane =
      params.trafficDensity[lane] || params.trafficDensity[0] || 3;
    const carsInThisLane = Math.round(densityForLane * laneLength);

    for (let i = 0; i < carsInThisLane; i++) {
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

      // Generate driver properties
      const driverProps = generateDriverProperties();

      cars.push({
        id: carId,
        name: `Car ${carId + 1}`,
        position: 0, // Will be set properly later (in miles)
        speed,
        desiredSpeed,
        color: carColors[carId % carColors.length],
        virtualLength,
        distTripPlanned,
        distanceTraveled: 0,
        lane,
        lastLaneChange: 0,
        ...driverProps,
      });
      carId++;
    }
  }

  // Calculate overall traffic density (cars per mile)
  const density = totalCars / laneLength;

  // Randomly position cars along their respective lanes
  for (let lane = 0; lane < numLanes; lane++) {
    const carsInLane = cars.filter((car) => car.lane === lane);
    const usedPositions: number[] = [];

    for (const car of carsInLane) {
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
      car.position = position;
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
  trafficRule: "american" | "european",
  simulationSpeed: number = 1,
  stoppedCars: Set<number> = new Set()
): {
  cars: Car[];
  events: {
    type: "exit" | "enter";
    carId: number;
    carName: string;
    position: number;
    speed: number;
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
    type: "exit" | "enter";
    carId: number;
    carName: string;
    position: number;
    speed: number;
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

    // Calculate gap to car ahead (with wrap-around)
    let gap = aheadCar
      ? (aheadCar.position - car.position + laneLength) % laneLength
      : laneLength;

    const safeDist = calculateSafeDistance(carSpeed, params.tDist);
    const hysteresisBuffer = 0.02; // ~100 feet in miles
    const safeGap = safeDist + params.lengthCar / 5280 + hysteresisBuffer;

    // If already stopped and gap is still unsafe, remain stopped
    if (car.speed === 0 && gap < safeGap) {
      carSpeed = 0;
      movements[carIndex] = {
        newPosition: car.position,
        newSpeed: 0,
        distanceTraveled: car.distanceTraveled,
      };
      continue;
    }

    carSpeed += (car.desiredSpeed - carSpeed) * params.k * effectiveDt;
    carSpeed = Math.min(carSpeed, params.speedLimit);
    car.virtualLength = calculateVirtualLength(carSpeed, params);

    // Enhanced collision avoidance for stopped cars ahead
    const buffer = 0.01; // e.g., extra 50 ft ~ 0.01 miles
    if (gap < safeDist + params.lengthCar / 5280 + buffer) {
      const aheadCarSpeed = aheadCar?.speed || 0;

      // If the car ahead is stopped, apply stronger braking
      if (aheadCarSpeed === 0 && gap < safeDist * 2) {
        carSpeed = Math.max(carSpeed * 0.5, 0); // Rapid deceleration
      } else {
        const decel = Math.min(
          (carSpeed ** 2 - aheadCarSpeed ** 2) /
            (2 * Math.max(safeDist - gap + params.lengthCar / 5280, 1e-6)),
          params.aMax
        );
        carSpeed = Math.max(carSpeed - decel * (1 / 3600) * effectiveDt, 0);
      }

      if (gap < (params.lengthCar * 1.5) / 5280) {
        carSpeed = Math.min(carSpeed, aheadCarSpeed * 0.9);
      }
    }
    // Check for lane changing opportunities
    // const adjacentLanes = findAdjacentCars(
    //   car,
    //   updatedCars,
    //   laneLength,
    //   params
    // );
    // const { shouldChange, targetLane } = shouldChangeLane(
    //   car,
    //   aheadCar,
    //   adjacentLanes,
    //   params,
    //   laneLength,
    //   currentTime,
    //   trafficRule
    // );

    // // Apply lane change if beneficial
    // if (shouldChange && targetLane !== null) {
    //   updatedCars[carIndex].lane = targetLane;
    //   updatedCars[carIndex].lastLaneChange = currentTime;
    //   // After lane change, recalculate car ahead and gap in the new lane
    //   currentLane = targetLane;
    //   sameLaneCars = updatedCars.filter((c) => c.lane === currentLane);
    //   sortedSameLaneCars = sameLaneCars.sort((a, b) => {
    //     const distA = (a.position - car.position + laneLength) % laneLength;
    //     const distB = (b.position - car.position + laneLength) % laneLength;
    //     return distA - distB;
    //   });
    //   aheadCar = sortedSameLaneCars.find(
    //     (c) => (c.position - car.position + laneLength) % laneLength > 0
    //   );
    //   gap = aheadCar
    //     ? (aheadCar.position - car.position + laneLength) % laneLength
    //     : laneLength;
    // }
    // Convert speed from mph to miles per second
    const mphToMilesPerSec = 1 / 3600;
    const potentialMove = carSpeed * mphToMilesPerSec * effectiveDt;

    // Final check: prevent moving too close to car ahead
    // Final check: prevent moving too close to car ahead
    if (gap - potentialMove < safeGap) {
      // Try lane change first
      const adjacentLanes = findAdjacentCars(
        car,
        updatedCars,
        laneLength,
        params
      );
      const { shouldChange, targetLane } = shouldChangeLane(
        car,
        aheadCar,
        adjacentLanes,
        params,
        laneLength,
        currentTime,
        trafficRule
      );

      if (shouldChange && targetLane !== null) {
        // Perform lane change
        updatedCars[carIndex].lane = targetLane;
        updatedCars[carIndex].lastLaneChange = currentTime;

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
          carSpeed = 0;
          movements[carIndex] = {
            newPosition: car.position,
            newSpeed: 0,
            distanceTraveled: car.distanceTraveled,
          };
          continue;
        }
      } else {
        // No valid lane change, must stop
        carSpeed = 0;
        movements[carIndex] = {
          newPosition: car.position,
          newSpeed: 0,
          distanceTraveled: car.distanceTraveled,
        };
        continue;
      }
    }

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
      color: carColors[newId % carColors.length],
      virtualLength,
      distTripPlanned,
      distanceTraveled: 0,
      lane,
      lastLaneChange: 0,
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
  laneLength: number
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

  // Optional: Slight incentive for right-lane preference (if applicable)
  if (targetLane.leader && car.lane < targetLane.leader.lane) {
    incentive += params.rightLaneBias;
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
    // American drivers may pass either left or right
    if (
      car.lane > 0 &&
      adjustedLeft > params.accelerationThreshold &&
      slowerLeader &&
      Math.random() < car.laneChangeProbability
    ) {
      return { shouldChange: true, targetLane: car.lane - 1 };
    }

    if (
      car.lane < params.numLanes - 1 &&
      adjustedRight > params.accelerationThreshold &&
      slowerLeader &&
      Math.random() < car.laneChangeProbability
    ) {
      return { shouldChange: true, targetLane: car.lane + 1 };
    }
  } else {
    // European drivers: overtake ONLY to the left
    if (
      car.lane > 0 &&
      adjustedLeft > params.accelerationThreshold &&
      slowerLeader &&
      Math.random() < car.laneChangeProbability
    ) {
      return { shouldChange: true, targetLane: car.lane - 1 };
    }

    // Return to right lane after overtaking (if safe and no slower leader there)
    const rightLaneLeader = adjacentLanes.rightLane.leader;
    const canReturnRight =
      car.lane < params.numLanes - 1 &&
      (!rightLaneLeader ||
        rightLaneLeader.speed >= car.speed &&
        ((rightLaneLeader.position - car.position + laneLength) %
          laneLength >
          300)); // Give decent spacing

    if (
      canReturnRight &&
      adjustedRight > params.accelerationThreshold * 0.5 &&
      Math.random() < car.laneChangeProbability
    ) {
      return { shouldChange: true, targetLane: car.lane + 1 };
    }
  }

  return { shouldChange: false, targetLane: null };
}
