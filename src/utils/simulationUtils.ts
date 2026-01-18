import { SimulationParams } from "@/utils/trafficSimulation";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";

/**
 * Extracts the simulation parameters from a saved simulation
 * @param simulation The saved simulation data
 * @returns A clean object containing only the simulation parameters
 */
export const extractSimulationParams = (simulation: any): SimulationParams => {
  // Create a clean copy of the parameters, excluding any non-parameter properties
  const {
    id,
    name,
    timestamp,
    duration,
    simulationNumber,
    chartData,
    finalStats,
    trafficRule,
    ...params
  } = simulation;

  return params as SimulationParams;
};

/**
 * Formats simulation parameters as a JSON string with proper indentation
 * @param params The simulation parameters to format
 * @returns A formatted JSON string
 */
export const formatParamsAsJson = (params: SimulationParams): string => {
  // Create a clean copy of the parameters
  const cleanParams = { ...params };

  // Remove any functions or circular references
  if ('onUpdate' in cleanParams) {
    delete (cleanParams as any).onUpdate;
  }

  // Format with 2-space indentation
  return JSON.stringify(cleanParams, null, 2);
};

/**
 * Formats simulation parameters with proper unit conversions
 * @param params The simulation parameters to format
 * @param unitSystem The unit system to use for display
 * @returns A formatted string with converted units
 */
export const formatParamsWithUnits = (params: SimulationParams, unitSystem: UnitSystem): string => {
  const unitConversions = getUnitConversions(unitSystem);

  // Convert speed-related parameters
  const speedLimit = unitConversions.speed.toDisplay(params.speedLimit || 130);
  const minSpeed = unitConversions.speed.toDisplay(params.minSpeed || 20);
  const maxSpeed = unitConversions.speed.toDisplay(params.maxSpeed || 130);
  const meanSpeed = unitConversions.speed.toDisplay(params.meanSpeed || 90);

  // Convert density (from veh/km to veh/mile for imperial)
  const density = unitConversions.density.toDisplay(params.trafficDensity || 0.62);

  // Format vehicle mix
  const carPercentage = params.vehicleTypeDensity?.car || 100;
  const truckPercentage = params.vehicleTypeDensity?.truck || 0;
  const motorcyclePercentage = params.vehicleTypeDensity?.motorcycle || 0;

  // Build the formatted string
  return `Simulation Parameters
Traffic Parameters
Density: ${density.toFixed(2)} ${unitConversions.density.unit}
Vehicle Mix: car: ${carPercentage}%, truck: ${truckPercentage}%, motorcycle: ${motorcyclePercentage}%
Lanes: ${params.numLanes || 2}

Speed Parameters
Speed Limit: ${speedLimit.toFixed(0)} ${unitConversions.speed.unit}
Min Speed: ${minSpeed.toFixed(0)} ${unitConversions.speed.unit}
Max Speed: ${maxSpeed.toFixed(0)} ${unitConversions.speed.unit}
Mean Speed: ${meanSpeed.toFixed(0)} ${unitConversions.speed.unit}

Vehicle Parameters
Car Length: ${params.lengthCar || 4.5} m
Time Headway: ${params.tDist || 3} s
Max Deceleration: ${params.aMax || 1.5} m/s²`;
};
