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
    createdBy?: string;
    creatorName?: string;
}

class SimulationService {
    private apiBaseUrl = '/api/simulations';

    private getHeaders(token?: string) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async saveSimulation(simulation: SavedSimulation, token?: string): Promise<void> {
        const response = await fetch(this.apiBaseUrl, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(simulation),
        });

        if (!response.ok) {
            throw new Error(`Failed to save simulation: ${response.status} ${response.statusText}`);
        }
    }

    async getAllSimulations(page: number = 1, limit: number = 20, token?: string): Promise<{
        simulations: SavedSimulation[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasMore: boolean;
        };
    }> {
        const response = await fetch(`${this.apiBaseUrl}?page=${page}&limit=${limit}`, {
            headers: this.getHeaders(token)
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch simulations: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async deleteSimulation(id: string, token?: string): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(token)
        });

        if (!response.ok) {
            throw new Error(`Failed to delete simulation: ${response.status} ${response.statusText}`);
        }
    }

    async getSimulation(id: string, token?: string): Promise<SavedSimulation | undefined> {
        const response = await fetch(`${this.apiBaseUrl}/${id}`, {
            headers: this.getHeaders(token)
        });
        if (response.status === 404) {
            return undefined;
        }
        if (!response.ok) {
            throw new Error(`Failed to fetch simulation: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async updateSimulation(simulation: SavedSimulation, token?: string): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/${simulation.id}`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(simulation),
        });

        if (!response.ok) {
            throw new Error(`Failed to update simulation: ${response.status} ${response.statusText}`);
        }
    }

    async renameFolder(oldName: string, newName: string, token?: string): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/folders`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify({ oldName, newName }),
        });

        if (!response.ok) {
            throw new Error(`Failed to rename folder: ${response.status} ${response.statusText}`);
        }
    }

    async deleteFolder(folderName: string, token?: string): Promise<void> {
        const encodedFolderName = encodeURIComponent(folderName);
        const response = await fetch(`${this.apiBaseUrl}/folders/${encodedFolderName}`, {
            method: 'DELETE',
            headers: this.getHeaders(token)
        });

        if (!response.ok) {
            throw new Error(`Failed to delete folder: ${response.status} ${response.statusText}`);
        }
    }

    async getNextSimulationNumber(token?: string): Promise<number> {
        try {
            const { simulations } = await this.getAllSimulations(1, 1000, token); // Get enough to find max
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
