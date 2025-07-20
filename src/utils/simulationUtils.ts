import { SimulationParams } from "@/utils/trafficSimulation";

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
