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
  
  // Position cars along the lane with proper spacing
  // Place the last car at position 0
  cars[params.numCars - 1].position = 0;
  
  // Place each preceding car
  for (let i = params.numCars - 2; i >= 0; i--) {
    const nextCarIndex = (i + 1) % params.numCars;
    const gap = cars[nextCarIndex].virtualLength + params.initialGap;
    cars[i].position = (cars[nextCarIndex].position + gap) % laneLength;
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
  
  // Process each car in the simulation
  for (let i = 0; i < numCars; i++) {
    const car = updatedCars[i];
    
    // Apply braking to the selected car if past brake time
    if (i === params.brakeCarIndex && currentTime > params.brakeTime) {
      // Decelerate the selected car
      car.speed = Math.max(
        car.speed - params.aMax * (5280 / 3600) * params.dt * 0.5,
        params.minSpeed
      );
    } else {
      // For other cars, or before brake time, accelerate towards desired speed
      car.speed += (car.desiredSpeed - car.speed) * params.k * params.dt;
    }
    
    // Find car ahead (with wrap-around)
    const aheadCarIndex = (i - 1 + numCars) % numCars;
    const aheadCar = updatedCars[aheadCarIndex];
    
    // Calculate gap to car ahead (with wrap-around)
    let gap = aheadCar.position - car.position;
    if (gap < 0) gap += laneLength;
    
    // Calculate safe distance
    const safeDist = calculateSafeDistance(car.speed, params.tDist);
    
    // Update car's virtual length
    car.virtualLength = calculateVirtualLength(car.speed, params);
    
    // Determine max distance the car can move in this time step
    const maxMoveDistance = Math.max(gap - params.lengthCar, 0);
    
    if (gap < safeDist) {
      // Too close - need to decelerate
      const decel = Math.min(
        (car.speed ** 2 - aheadCar.speed ** 2) / (2 * Math.max(safeDist - gap, 1)),
        params.aMax
      );
      
      // Update speed (convert from ft/s² to mph/s)
      car.speed = Math.max(
        car.speed - decel * (3600 / 5280) * params.dt,
        0
      );
    }
    
    // Calculate how far the car would move with current speed
    const potentialMove = car.speed * (5280 / 3600) * params.dt;
    
    // Ensure car doesn't move more than the available gap
    const actualMove = Math.min(potentialMove, maxMoveDistance);
    
    // Update position
    car.position = (car.position + actualMove) % laneLength;
  }
  
  return updatedCars;
}
