import { toast } from "../hooks/use-toast.js";

const API_BASE_URL = import.meta.env.VITE_NEON_DB || 'http://localhost:3000/api';

interface Simulation {
  id: string;
  name: string;
  timestamp: number;
  simulationNumber: number;
  trafficRule: "american" | "european";
  chartData: {
    speedByLaneHistory: any[];
    densityOfCarPacksHistory: any[];
    percentageByLaneHistory: any[];
    densityThroughputHistory: any[];
    packHistory: any[];
    packLengthHistory: any[];
  };
  duration: number;
  finalStats: {
    totalCars: number;
    averageSpeed: number;
    maxSpeed: number;
    minSpeed: number;
    laneChanges: number;
    perLaneThroughputs: number[];
    stabilizedDensity?: number;
    stabilizedAverageSpeed?: number;
    stabilizedThroughput?: number;
  };
  params: any;
  results: any;
}

export const neonDBService = {
  async getAllSimulations(): Promise<Simulation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/simulations`);
      const rawBody = await response.text();
      console.log('Raw response body:', rawBody); // Log raw response for debugging
      if (!response.ok) {
        throw new Error(`Failed to fetch simulations: ${rawBody}`);
      }
      return JSON.parse(rawBody); // Parse JSON after logging
    } catch (error) {
      console.error('Error fetching simulations from NeonDB:', error);
      toast({
        title: "Error",
        description: "Failed to load simulations from server",
        variant: "destructive",
      });
      return [];
    }
  },

  async getSimulation(id: string): Promise<Simulation | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/simulations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch simulation');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching simulation ${id} from NeonDB:`, error);
      toast({
        title: "Error",
        description: `Failed to load simulation ${id}`,
        variant: "destructive",
      });
      return null;
    }
  },

  async saveSimulation(simulation: Omit<Simulation, 'id'> & { id?: string }): Promise<Simulation> {
    try {
      const method = simulation.id ? 'PUT' : 'POST';
      const url = simulation.id 
        ? `${API_BASE_URL}/simulations/${simulation.id}`
        : `${API_BASE_URL}/simulations`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulation),
      });

      if (!response.ok) {
        throw new Error('Failed to save simulation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving simulation to NeonDB:', error);
      toast({
        title: "Error",
        description: "Failed to save simulation to server",
        variant: "destructive",
      });
      throw error;
    }
  },

  async deleteSimulation(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/simulations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete simulation');
      }
    } catch (error) {
      console.error(`Error deleting simulation ${id} from NeonDB:`, error);
      toast({
        title: "Error",
        description: "Failed to delete simulation from server",
        variant: "destructive",
      });
      throw error;
    }
  },

  async importSimulation(file: File): Promise<Simulation> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/simulations/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import simulation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error importing simulation to NeonDB:', error);
      toast({
        title: "Error",
        description: "Failed to import simulation to server",
        variant: "destructive",
      });
      throw error;
    }
  },

  async exportSimulation(id: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/simulations/${id}/export`);
      if (!response.ok) {
        throw new Error('Failed to export simulation');
      }
      return await response.blob();
    } catch (error) {
      console.error(`Error exporting simulation ${id} from NeonDB:`, error);
      toast({
        title: "Error",
        description: "Failed to export simulation from server",
        variant: "destructive",
      });
      throw error;
    }
  },
};
