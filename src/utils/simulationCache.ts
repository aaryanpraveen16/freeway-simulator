import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SavedSimulation } from '../services/simulationService';

interface SimulationDB extends DBSchema {
    simulations: {
        key: string;
        value: SavedSimulation;
        indexes: { 'by-timestamp': number };
    };
}

const DB_NAME = 'freeway-simulator-db';
const STORE_NAME = 'simulations';

class SimulationCache {
    private dbPromise: Promise<IDBPDatabase<SimulationDB>>;

    constructor() {
        this.dbPromise = openDB<SimulationDB>(DB_NAME, 1, {
            upgrade(db) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('by-timestamp', 'timestamp');
            },
        });
    }

    async getAll(): Promise<SavedSimulation[]> {
        const db = await this.dbPromise;
        return db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    }

    async setAll(simulations: SavedSimulation[]): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // Clear existing cache to ensure we match the server state strictly
        // Or we could merge, but "setAll" usually implies replacement for a list fetch
        await store.clear();

        for (const sim of simulations) {
            await store.put(sim);
        }
        await tx.done;
    }

    async addOrUpdate(simulation: SavedSimulation): Promise<void> {
        const db = await this.dbPromise;
        await db.put(STORE_NAME, simulation);
    }

    async delete(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete(STORE_NAME, id);
    }

    async clear(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear(STORE_NAME);
    }
}

export const simulationCache = new SimulationCache();
