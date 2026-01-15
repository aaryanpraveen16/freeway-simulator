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

    async getAllSimulations(page: number = 1, limit: number = 20): Promise<{
        simulations: SavedSimulation[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasMore: boolean;
        };
    }> {
        const response = await fetch(`${this.apiBaseUrl}?page=${page}&limit=${limit}`);
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

    async renameFolder(oldName: string, newName: string): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/folders`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ oldName, newName }),
        });

        if (!response.ok) {
            throw new Error(`Failed to rename folder: ${response.statusText}`);
        }
    }

    async deleteFolder(folderName: string): Promise<void> {
        const encodedFolderName = encodeURIComponent(folderName);
        const response = await fetch(`${this.apiBaseUrl}/folders/${encodedFolderName}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete folder: ${response.statusText}`);
        }
    }

    async getNextSimulationNumber(): Promise<number> {
        try {
            const { simulations } = await this.getAllSimulations(1, 1000); // Get enough to find max
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
