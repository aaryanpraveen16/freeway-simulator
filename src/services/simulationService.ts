import { SimulationParams } from "@/utils/trafficSimulation";
import { simulationCache } from "@/utils/simulationCache";

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
        // Save to API
        const response = await fetch(this.apiBaseUrl, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(simulation),
        });

        if (!response.ok) {
            throw new Error(`Failed to save simulation: ${response.status} ${response.statusText}`);
        }

        // Save to Cache
        await simulationCache.addOrUpdate(simulation);
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
        // 1. Try Cache First
        const cachedSims = await simulationCache.getAll();

        // If we are on page 1 and have cached items, we can satisfy the "show previous" requirement
        // We return cached items if we have them, up to the requested limit.
        // If the user refreshed, 'limit' will be high (e.g. 60), so we return all 60 from cache.
        if (cachedSims.length > 0 && page === 1) {
            console.log(`Serving ${cachedSims.length} simulations from IndexedDB cache`);
            const sorted = cachedSims.sort((a, b) => b.timestamp - a.timestamp);
            const paginated = sorted.slice(0, limit);

            return {
                simulations: paginated,
                pagination: {
                    page: 1,
                    limit,
                    total: Math.max(cachedSims.length, 20), // Local estimate
                    totalPages: Math.ceil(cachedSims.length / limit),
                    hasMore: cachedSims.length > limit
                }
            };
        }

        // 2. Fetch from API
        const response = await fetch(`${this.apiBaseUrl}?page=${page}&limit=${limit}`, {
            headers: this.getHeaders(token)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch simulations: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const simulations = data.simulations as SavedSimulation[];

        // 3. Update Cache (Batch Merge)
        for (const sim of simulations) {
            await simulationCache.addOrUpdate(sim);
        }

        return data;
    }

    async deleteSimulation(id: string, token?: string): Promise<void> {
        await fetch(`${this.apiBaseUrl}/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(token)
        });
        await simulationCache.delete(id);
    }

    async deleteSimulations(ids: string[], token?: string): Promise<void> {
        await fetch(this.apiBaseUrl, {
            method: 'DELETE',
            headers: this.getHeaders(token),
            body: JSON.stringify({ ids }),
        });
        // Delete from cache
        for (const id of ids) {
            await simulationCache.delete(id);
        }
    }

    async getSimulation(id: string, token?: string): Promise<SavedSimulation | undefined> {
        // Try cache first? 
        // `getAll` gets all, we could add `get(id)` to cache util, but `getAll` is fast enough for now or we rely on API for single details?
        // Let's stick to API for specific details to ensure freshness, OR use cache.
        // User didn't specify for single view. Let's leave as API for robustness.
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
        await simulationCache.addOrUpdate(simulation);
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

        // Update cache: find all items in folder and update them
        const all = await simulationCache.getAll();
        const toUpdate = all.filter(s => s.folder === oldName);
        for (const sim of toUpdate) {
            sim.folder = newName;
            await simulationCache.addOrUpdate(sim);
        }
    }

    async deleteFolder(folderName: string, token?: string, deleteAll: boolean = false): Promise<void> {
        const encodedFolderName = encodeURIComponent(folderName);
        const url = `${this.apiBaseUrl}/folders?folderName=${encodedFolderName}${deleteAll ? '&deleteAll=true' : ''}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.getHeaders(token)
        });

        if (!response.ok) {
            throw new Error(`Failed to delete folder: ${response.status} ${response.statusText}`);
        }

        // Update Cache
        const all = await simulationCache.getAll();
        const inFolder = all.filter(s => s.folder === folderName);

        if (deleteAll) {
            for (const sim of inFolder) {
                await simulationCache.delete(sim.id);
            }
        } else {
            // Move to uncategorized
            for (const sim of inFolder) {
                delete sim.folder; // or sim.folder = undefined?
                // Type definition says folder?: string
                const updated = { ...sim };
                delete updated.folder;
                await simulationCache.addOrUpdate(updated);
            }
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
