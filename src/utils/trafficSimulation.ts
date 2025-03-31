
// Constants and types for traffic simulation
export interface Car {
  id: number;
  name: string; // Add name property
  position: number; // position in the loop (0 to laneLength)
  speed: number; // speed in mph
  desiredSpeed: number; // desired speed in mph
  color: string; // color for visualization
  virtualLength: number; // physical length + safe distance
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
}

// Default simulation parameters
export const defaultParams: SimulationParams = {
  numCars: 10,
  dt: 0.1, // 100ms time step
  aMax: 10, // ft/s^2
  k: 0.3, // unitless
  lengthCar: 15, // feet
  tDist: 1.5, // seconds
  initialGap: 50, // feet
  brakeTime: 10, // seconds
  brakeCarIndex: 0, // default to first car
  minSpeed: 10, // mph
  maxSpeed: 80, // mph
  meanSpeed: 65, // mph
  stdSpeed: 5, // mph
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
    
    cars.push({
      id: i,
      name: `Car ${i + 1}`, // Add a name to each car
      position: 0, // Will be set properly later
      speed,
      desiredSpeed,
      color: carColors[i % carColors.length],
      virtualLength,
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
  const aheadCarIndex = (carIndex - 1 + cars.length) % cars.length;
  const aheadCar = cars[aheadCarIndex];
  
  // Calculate distance (with wrap-around)
  let distance = aheadCar.position - currentCar.position;
  if (distance < 0) distance += laneLength;
  
  return Math.round(distance);
}

// Update simulation for one time step
export function updateSimulation(
  cars: Car[],
  laneLength: number,
  params: SimulationParams,
  currentTime: number
): Car[] {
  const updatedCars = [...cars];
  const numCars = cars.length;
  
  // First, calculate all car movements without updating positions
  const movements: { newPosition: number; newSpeed: number }[] = [];
  
  // Process each car in the simulation
  for (let i = 0; i < numCars; i++) {
    const car = updatedCars[i];
    let carSpeed = car.speed;
    
    // Apply braking to the selected car if past brake time
    if (i === params.brakeCarIndex && currentTime > params.brakeTime) {
      // Decelerate the selected car
      carSpeed = Math.max(
        carSpeed - params.aMax * (5280 / 3600) * params.dt * 0.5,
        params.minSpeed
      );
    } else {
      // For other cars, or before brake time, accelerate towards desired speed
      carSpeed += (car.desiredSpeed - carSpeed) * params.k * params.dt;
    }
    
    // Find car ahead (with wrap-around)
    const aheadCarIndex = (i - 1 + numCars) % numCars;
    const aheadCar = updatedCars[aheadCarIndex];
    
    // Calculate gap to car ahead (with wrap-around)
    let gap = aheadCar.position - car.position;
    if (gap < 0) gap += laneLength;
    
    // Calculate safe distance
    const safeDist = calculateSafeDistance(carSpeed, params.tDist);
    
    // Update car's virtual length
    car.virtualLength = calculateVirtualLength(carSpeed, params);
    
    // If too close to car ahead, decelerate to maintain safe distance
    if (gap < safeDist + params.lengthCar) {
      // Calculate required deceleration to maintain safe distance
      const decel = Math.min(
        (carSpeed ** 2 - aheadCar.speed ** 2) / (2 * Math.max(safeDist - gap + params.lengthCar, 1)),
        params.aMax
      );
      
      // Update speed (convert from ft/s² to mph/s)
      carSpeed = Math.max(
        carSpeed - decel * (3600 / 5280) * params.dt,
        0
      );
      
      // Ensure car doesn't go faster than car ahead if too close
      if (gap < params.lengthCar * 1.5) {
        carSpeed = Math.min(carSpeed, aheadCar.speed * 0.9); // Stay slower than car ahead
      }
    }
    
    // Calculate how far the car would move with current speed
    const mphToFtPerSec = 5280 / 3600;
    const potentialMove = carSpeed * mphToFtPerSec * params.dt;
    
    // Ensure car doesn't overtake car ahead
    let maxMoveDistance = gap - params.lengthCar;
    maxMoveDistance = Math.max(maxMoveDistance, 0); // Cannot be negative
    
    // The actual distance to move is the minimum of potential and maximum allowed
    const actualMove = Math.min(potentialMove, maxMoveDistance);
    
    // Calculate new position (will be applied in the next step)
    const newPosition = (car.position + actualMove) % laneLength;
    
    // Store the new position and speed
    movements.push({ newPosition, newSpeed: carSpeed });
  }
  
  // Now update all car positions and speeds
  for (let i = 0; i < numCars; i++) {
    updatedCars[i].position = movements[i].newPosition;
    updatedCars[i].speed = movements[i].newSpeed;
  }
  
  return updatedCars;
}
