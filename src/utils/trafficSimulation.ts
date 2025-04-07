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
    
    // Calculate virtual length based on initial speed
    const virtualLength = calculateVirtualLength(speed, params);
    
    // Generate planned trip distance using log-normal distribution
    const distTripPlanned = logNormalRandom(
      params.meanDistTripPlanned,
      params.sigmaDistTripPlanned
    );
    
    cars.push({
      id: i,
      name: `Car ${i + 1}`, // Add a name to each car
      position: 0, // Will be set properly later
      speed,
      desiredSpeed,
      color: carColors[i % carColors.length],
      virtualLength,
      distTripPlanned,
      distanceTraveled: 0,
    });
  }
  
  // Calculate total lane length based on virtual lengths
  const totalVirtualLength = cars.reduce((sum, car) => sum + car.virtualLength, 0);
  const buffer = params.initialGap * params.numCars; // Add some buffer space
  const laneLength = totalVirtualLength + buffer;
  
  // Calculate traffic density (cars per mile)
  const density = params.numCars / (laneLength / 5280);
  
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
      position = Math.random() * laneLength;
      validPosition = true;
      
      // Check if this position is too close to any other car
      for (const usedPos of usedPositions) {
        const distance = Math.abs(position - usedPos);
        const wrappedDistance = Math.min(distance, laneLength - distance);
        
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
  
  return { cars, laneLength, density };
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
  
  // Define car colors for new cars
  const carColors = [
    "hsl(var(--car-red))",
    "hsl(var(--car-blue))",
    "hsl(var(--car-green))",
    "hsl(var(--car-yellow))",
    "hsl(var(--car-purple))",
    "hsl(var(--car-orange))",
  ];

  // First, calculate all car movements without updating positions
  const movements: { newPosition: number; newSpeed: number; distanceTraveled: number }[] = [];
  const carsToRemove: { index: number; car: Car }[] = [];
  const events: { type: 'exit' | 'enter'; carId: number; carName: string; position: number; speed: number }[] = [];

  // Sort cars by position to ensure we process them in order
  const sortedIndices = [...Array(numCars).keys()].sort((a, b) => {
    return updatedCars[a].position - updatedCars[b].position;
  });

  // Process cars in order of position to prevent overlapping
  for (let i = 0; i < numCars; i++) {
    const carIndex = sortedIndices[i];
    const car = updatedCars[carIndex];
    let carSpeed = car.speed;

    // Find the car ahead (with wrap-around)
    const aheadCarIndex = sortedIndices[(i + 1) % numCars];
    const aheadCar = updatedCars[aheadCarIndex];
    
    // Calculate gap to car ahead (with wrap-around)
    let gap = aheadCar.position - car.position;
    if (gap < 0) {
      gap += laneLength;
    }

    // Apply braking only for the selected car
    if (carIndex === params.brakeCarIndex && currentTime > params.brakeTime) {
      carSpeed = Math.max(
        carSpeed - params.aMax * (5280 / 3600) * params.dt * 0.5,
        params.minSpeed
      );
    } else {
      carSpeed += (car.desiredSpeed - carSpeed) * params.k * params.dt;

      // Apply safe-distance logic
      const safeDist = calculateSafeDistance(carSpeed, params.tDist);
      car.virtualLength = calculateVirtualLength(carSpeed, params);

      if (gap < safeDist + params.lengthCar) {
        const decel = Math.min(
          (carSpeed ** 2 - aheadCar.speed ** 2) / (2 * Math.max(safeDist - gap + params.lengthCar, 1)),
          params.aMax
        );
        carSpeed = Math.max(
          carSpeed - decel * (3600 / 5280) * params.dt,
          0
        );
        if (gap < params.lengthCar * 1.5) {
          carSpeed = Math.min(carSpeed, aheadCar.speed * 0.9);
        }
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
      distanceTraveled: newDistanceTraveled
    };
  }

  // Now update all car positions and speeds
  for (let i = 0; i < numCars; i++) {
    updatedCars[i].position = movements[i].newPosition;
    updatedCars[i].speed = movements[i].newSpeed;
    updatedCars[i].distanceTraveled = movements[i].distanceTraveled;
    
    // Check if car has completed its planned trip AFTER updating distanceTraveled
    if (updatedCars[i].distanceTraveled >= updatedCars[i].distTripPlanned) {
      carsToRemove.push({ index: i, car: updatedCars[i] });
    }
  }
  
  // Remove cars that have completed their trips
  // We need to remove from the end to avoid index shifting issues
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
  // For each car that exited, add a new car at the beginning of the road
  for (let i = 0; i < carsToRemove.length; i++) {
    // For a straight road, new cars enter at the beginning (position 0)
    const newPosition = 0;
    
    // Generate desired speed for the new car
    const desiredSpeed = normalRandom(
      params.meanSpeed,
      params.stdSpeed,
      params.minSpeed,
      params.maxSpeed
    );
    
    // Initial speed is the desired speed
    const speed = desiredSpeed;
    
    // Calculate virtual length based on initial speed
    const virtualLength = calculateVirtualLength(speed, params);
    
    // Generate planned trip distance using log-normal distribution
    const distTripPlanned = logNormalRandom(
      params.meanDistTripPlanned,
      params.sigmaDistTripPlanned
    );
    
    // Generate a new car ID (use the maximum existing ID + 1)
    const newId = updatedCars.length > 0 
      ? Math.max(...updatedCars.map(car => car.id)) + 1 
      : 0;
    
    // Add the new car
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
