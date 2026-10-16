import { Car } from './trafficSimulation';

/**
 * Initial metadata for a car present in the replay.
 */
export interface ReplayCarMeta {
  id: number;
  name: string;
  vehicleType: 'car' | 'truck' | 'motorcycle';
  driverType: 'aggressive' | 'normal' | 'conservative';
  physicalLength: number;
  distTripPlanned: number;
  desiredSpeed: number;
}

/**
 * Stride definition for delta frame:
 * 0: id
 * 1: position (km)
 * 2: speed (km/h)
 * 3: lane (integer)
 * 4: previousLane (-1 if none)
 * 5: lastLaneChange (seconds, -1 if none)
 * 6: distanceTraveled (km)
 * 7: acceleration (m/s^2)
 * 8: isOvertaking (1.0 = true, 0.0 = false)
 */
export const REPLAY_CAR_STRIDE = 9;

export interface ReplayFrame {
  t: number; // time in seconds
  // Packed vehicle array: [id, pos, speed, lane, prevLane, lastChange, distTraveled, accel, isOvertaking, ...]
  data: number[];
}

export interface SimulationReplay {
  version: 1;
  sampleRateHz: number;
  totalDuration: number;
  carsMeta: ReplayCarMeta[];
  frames: ReplayFrame[];
}

/**
 * In-memory trajectory recorder.
 * Caps recording time or frames to prevent unbounded memory growth.
 */
export class TrajectoryRecorder {
  private sampleInterval: number; // in seconds (e.g., 0.1s for 10Hz)
  private lastSampleTime: number = -1;
  private maxDuration: number; // in seconds (e.g. 600s = 10 min)
  private carsMetaMap: Map<number, ReplayCarMeta> = new Map();
  private frames: ReplayFrame[] = [];

  constructor(sampleRateHz: number = 10, maxDurationSec: number = 600) {
    this.sampleInterval = 1 / sampleRateHz;
    this.maxDuration = maxDurationSec;
  }

  public reset(): void {
    this.lastSampleTime = -1;
    this.carsMetaMap.clear();
    this.frames = [];
  }

  public recordTick(currentTime: number, cars: Car[]): void {
    if (currentTime > this.maxDuration) return;

    if (this.lastSampleTime >= 0 && (currentTime - this.lastSampleTime) < this.sampleInterval - 0.001) {
      return;
    }

    this.lastSampleTime = currentTime;

    // Register any new cars
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      if (!this.carsMetaMap.has(c.id)) {
        this.carsMetaMap.set(c.id, {
          id: c.id,
          name: c.name || `Car ${c.id}`,
          vehicleType: c.vehicleType || 'car',
          driverType: c.driverType || 'normal',
          physicalLength: c.physicalLength || 4.5,
          distTripPlanned: c.distTripPlanned || 5,
          desiredSpeed: c.desiredSpeed || 100,
        });
      }
    }

    // Build packed frame with 2-decimal rounded precision to shrink JSON size
    const packed: number[] = new Array(cars.length * REPLAY_CAR_STRIDE);
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      const offset = i * REPLAY_CAR_STRIDE;
      packed[offset] = c.id;
      packed[offset + 1] = Math.round(c.position * 1000) / 1000; // km with meter precision
      packed[offset + 2] = Math.round(c.speed * 10) / 10;
      packed[offset + 3] = typeof c.lane === 'number' && !isNaN(c.lane) ? Math.round(c.lane) : 0;
      packed[offset + 4] = c.previousLane !== undefined ? c.previousLane : -1;
      packed[offset + 5] = c.lastLaneChange !== undefined ? Math.round(c.lastLaneChange * 10) / 10 : -1;
      packed[offset + 6] = Math.round(c.distanceTraveled * 100) / 100;
      packed[offset + 7] = Math.round(c.acceleration * 10) / 10;
      packed[offset + 8] = c.isOvertaking ? 1 : 0;
    }

    this.frames.push({
      t: Math.round(currentTime * 100) / 100,
      data: packed,
    });
  }

  public truncateToTime(targetTime: number): void {
    while (this.frames.length > 0 && this.frames[this.frames.length - 1].t > targetTime) {
      this.frames.pop();
    }
    this.lastSampleTime = this.frames.length > 0 ? this.frames[this.frames.length - 1].t : -1;
  }

  public getReplayData(totalDuration: number): SimulationReplay | null {
    if (this.frames.length === 0) return null;
    return {
      version: 1,
      sampleRateHz: Math.round(1 / this.sampleInterval),
      totalDuration,
      carsMeta: Array.from(this.carsMetaMap.values()),
      frames: this.frames,
    };
  }
}
