
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
    packHistory: any[];
    packLengthHistory: any[];
  };
  duration: number;
  finalStats: {
    totalCars: number;
    averageSpeed: number;
    maxSpeed: number;
    minSpeed: number;
  };
}

class IndexedDBService {
  private dbName = 'TrafficSimulationDB';
  private version = 1;
  private storeName = 'simulations';

  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('simulationNumber', 'simulationNumber', { unique: false });
        }
      };
    });
  }

  async saveSimulation(simulation: SavedSimulation): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add(simulation);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllSimulations(): Promise<SavedSimulation[]> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteSimulation(id: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSimulation(id: string): Promise<SavedSimulation | undefined> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getNextSimulationNumber(): Promise<number> {
    const simulations = await this.getAllSimulations();
    if (simulations.length === 0) return 1;
    
    const maxNumber = Math.max(...simulations.map(s => s.simulationNumber));
    return maxNumber + 1;
  }
}

export const indexedDBService = new IndexedDBService();
