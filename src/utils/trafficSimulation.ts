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
  driverType: 'aggressive' | 'normal' | 'conservative'; // driver personality
  laneChangeProbability: number; // probability of changing lanes (0-1)
  laneStickiness: number; // tendency to stay in current lane (0-1)
}

export interface SimulationParams {
  numCars: number;
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
  meanDistTripPlanned: number; // mean planned trip distance in feet
  sigmaDistTripPlanned: number; // standard deviation of planned trip distances
  speedLimit:number;
  freewayLength?: number; // length of the freeway in miles
  numLanes?: number; // number of lanes
}

// Default simulation parameters
export const defaultParams: SimulationParams = {
  numCars: 10,
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
  meanDistTripPlanned: 10000, // 10,000 feet (about 1.9 miles)
  sigmaDistTripPlanned: 0.5, // standard deviation for log-normal distribution
  speedLimit: 70,
  freewayLength: 10, // initial value in miles
  numLanes: 1, // default to 1 lane
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
  // speed in mph, tDist in seconds
  // Convert mph to miles per second: 1 mph = 1/3600 miles/sec
  return tDist * speed / 3600;
}

// Calculate virtual car length (physical length + safe distance)
export function calculateVirtualLength(speed: number, params: SimulationParams): number {
  // Convert lengthCar from feet to miles
  const lengthCarMiles = params.lengthCar / 5280;
  const safeDistance = calculateSafeDistance(speed, params.tDist);
  return lengthCarMiles + safeDistance;
}

// Generate driver type and associated properties
function generateDriverProperties(): {
  driverType: 'aggressive' | 'normal' | 'conservative';
  laneChangeProbability: number;
  laneStickiness: number;
} {
  const rand = Math.random();
  
  if (rand < 0.2) {
    // Aggressive driver
    return {
      driverType: 'aggressive',
      laneChangeProbability: normalRandom(0.8, 0.1, 0.6, 1.0),
      laneStickiness: normalRandom(0.3, 0.1, 0.1, 0.5)
    };
  } else if (rand < 0.8) {
    // Normal driver
    return {
      driverType: 'normal',
      laneChangeProbability: normalRandom(0.5, 0.15, 0.2, 0.8),
      laneStickiness: normalRandom(0.6, 0.15, 0.3, 0.9)
    };
  } else {
    // Conservative driver
    return {
      driverType: 'conservative',
      laneChangeProbability: normalRandom(0.2, 0.1, 0.05, 0.4),
      laneStickiness: normalRandom(0.8, 0.1, 0.6, 1.0)
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
    
    // Generate planned trip distance using log-normal distribution (convert feet to miles)
    const distTripPlanned = logNormalRandom(
      params.meanDistTripPlanned,
      params.sigmaDistTripPlanned
    ) / 5280;
    
    // Generate driver properties
    const driverProps = generateDriverProperties();
    
    // Assign to random lane
    const lane = Math.floor(Math.random() * numLanes);
    
    cars.push({
      id: i,
      name: `Car ${i + 1}`,
      position: 0, // Will be set properly later (in miles)
      speed,
      desiredSpeed,
      color: carColors[i % carColors.length],
      virtualLength,
      distTripPlanned,
      distanceTraveled: 0,
      lane,
      ...driverProps
    });
  }
  
  // Calculate total lane length based on virtual lengths (in miles)
  const totalVirtualLength = cars.reduce((sum, car) => sum + car.virtualLength, 0);
  const buffer = (params.initialGap * params.numCars) / 5280; // buffer in miles
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
        if (wrappedDistance < (params.lengthCar / 5280) + (params.initialGap / 2 / 5280)) {
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

// Update simulation for one time step
export function updateSimulation(
  cars: Car[],
  laneLength: number,
  params: SimulationParams,
  currentTime: number
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
    const aheadCarIndex = sortedIndices[(i + 1) % numCars];
    const aheadCar = updatedCars[aheadCarIndex];
    let gap = aheadCar.position - car.position;
    if (gap < 0) {
      gap += laneLength;
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
    ) / 5280;
    
    // Generate driver properties for new car
    const driverProps = generateDriverProperties();
    
    const newId = updatedCars.length > 0 
      ? Math.max(...updatedCars.map(car => car.id)) + 1 
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
      ...driverProps
    };
    updatedCars.push(newCar);
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
