import { SimulationParams } from "@/utils/trafficSimulation";

export interface SavedSimulation {
    id: string;
    name: string;
    timestamp: number;
    simulationNumber: number;
    params: SimulationParams;
    trafficRule: "american" | "european";
    chartData: {
        speedByLaneHistory: any[];
        densityOfCarPacksHistory: any[];
        percentageByLaneHistory: any[];
        densityThroughputHistory: any[];
        laneThroughputHistory?: any[];
        laneUtilizationHistory?: any[];
        packHistory: any[];
        packLengthHistory: any[];
        packsPerLaneHistory?: any[];
    };
    duration: number;
    finalStats: {
        totalCars: number;
        averageSpeed: number;
        maxSpeed: number;
        minSpeed: number;
        laneChanges: number;
        perLaneThroughputs: number[];
        // Optional stabilized metrics
        stabilizedDensity?: number;
        stabilizedAverageSpeed?: number;
        stabilizedThroughput?: number;
    };
    folder?: string;
}

class SimulationService {
    private apiBaseUrl = '/api/simulations';

    async saveSimulation(simulation: SavedSimulation): Promise<void> {
        const response = await fetch(this.apiBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(simulation),
        });

        if (!response.ok) {
            throw new Error(`Failed to save simulation: ${response.statusText}`);
        }
    }

    async getAllSimulations(): Promise<SavedSimulation[]> {
        const response = await fetch(this.apiBaseUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch simulations: ${response.statusText}`);
        }
        return response.json();
    }

    async deleteSimulation(id: string): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete simulation: ${response.statusText}`);
        }
    }

    async getSimulation(id: string): Promise<SavedSimulation | undefined> {
        const response = await fetch(`${this.apiBaseUrl}/${id}`);
        if (response.status === 404) {
            return undefined;
        }
        if (!response.ok) {
            throw new Error(`Failed to fetch simulation: ${response.statusText}`);
        }
        return response.json();
    }

    async updateSimulation(simulation: SavedSimulation): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/${simulation.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(simulation),
        });

        if (!response.ok) {
            throw new Error(`Failed to update simulation: ${response.statusText}`);
        }
    }

    async getNextSimulationNumber(): Promise<number> {
        try {
            const simulations = await this.getAllSimulations();
            if (simulations.length === 0) return 1;

            const maxNumber = Math.max(...simulations.map(s => s.simulationNumber));
            return maxNumber + 1;
        } catch (error) {
            console.error("Error getting next simulation number:", error);
            return 1; // Fallback
        }
    }
}

export const simulationService = new SimulationService();
