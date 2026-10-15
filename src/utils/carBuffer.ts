import { Car } from './trafficSimulation';

/**
 * Binary layout for transferring dynamic per-frame vehicle state to the main thread.
 * Stride = 10 float32 values per vehicle.
 *
 * Index map:
 * 0: id
 * 1: position (km)
 * 2: speed (km/h)
 * 3: lane (float integer)
 * 4: previousLane (-1 if none)
 * 5: lastLaneChange (seconds, -1 if none)
 * 6: distanceTraveled (km)
 * 7: acceleration (m/s^2)
 * 8: virtualLength (km)
 * 9: isOvertaking (1.0 = true, 0.0 = false)
 */
export const CAR_BUFFER_STRIDE = 10;

export function serializeCarsToBuffer(cars: Car[]): Float32Array {
  const buffer = new Float32Array(cars.length * CAR_BUFFER_STRIDE);
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    const offset = i * CAR_BUFFER_STRIDE;
    buffer[offset] = c.id;
    buffer[offset + 1] = c.position;
    buffer[offset + 2] = c.speed;
    buffer[offset + 3] = c.lane;
    buffer[offset + 4] = c.previousLane !== undefined ? c.previousLane : -1;
    buffer[offset + 5] = c.lastLaneChange !== undefined ? c.lastLaneChange : -1;
    buffer[offset + 6] = c.distanceTraveled;
    buffer[offset + 7] = c.acceleration;
    buffer[offset + 8] = c.virtualLength;
    buffer[offset + 9] = c.isOvertaking ? 1.0 : 0.0;
  }
  return buffer;
}

/**
 * In-place update of main-thread Car objects using the transferred binary buffer.
 * Reuses existing Car instances to avoid Garbage Collection allocations.
 */
export function applyBufferToCars(
  buffer: Float32Array,
  existingCars: Car[],
  getCarColorFn: (car: Car) => string
): Car[] {
  const count = Math.floor(buffer.length / CAR_BUFFER_STRIDE);
  const carMap = new Map<number, Car>();

  for (let i = 0; i < existingCars.length; i++) {
    carMap.set(existingCars[i].id, existingCars[i]);
  }

  const result: Car[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const offset = i * CAR_BUFFER_STRIDE;
    const id = Math.round(buffer[offset]);
    let car = carMap.get(id);

    const position = buffer[offset + 1];
    const speed = buffer[offset + 2];
    const lane = Math.round(buffer[offset + 3]);
    const previousLaneVal = buffer[offset + 4];
    const lastLaneChangeVal = buffer[offset + 5];
    const distanceTraveled = buffer[offset + 6];
    const acceleration = buffer[offset + 7];
    const virtualLength = buffer[offset + 8];
    const isOvertaking = buffer[offset + 9] > 0.5;

    if (car) {
      // In-place property update: ZERO heap allocation!
      car.position = position;
      car.speed = speed;
      car.lane = lane;
      car.previousLane = previousLaneVal >= 0 ? Math.round(previousLaneVal) : undefined;
      car.lastLaneChange = lastLaneChangeVal >= 0 ? lastLaneChangeVal : undefined;
      car.distanceTraveled = distanceTraveled;
      car.acceleration = acceleration;
      car.virtualLength = virtualLength;
      car.isOvertaking = isOvertaking;
      car.color = getCarColorFn(car);
    } else {
      // Fallback for newly spawned vehicle until full sync
      car = {
        id,
        name: `Car ${id + 1}`,
        position,
        speed,
        desiredSpeed: speed,
        color: 'hsl(142, 72%, 29%)',
        virtualLength,
        physicalLength: 4.5,
        distTripPlanned: 5,
        distanceTraveled,
        lane,
        previousLane: previousLaneVal >= 0 ? Math.round(previousLaneVal) : undefined,
        lastLaneChange: lastLaneChangeVal >= 0 ? lastLaneChangeVal : undefined,
        driverType: 'normal',
        laneChangeProbability: 0.1,
        laneStickiness: 0.8,
        vehicleType: 'car',
        isOvertaking,
        laneStabilityCounter: 0,
        driverReactionTime: 2.0,
        laneChangeStabilityThreshold: 5,
        acceleration,
        compliance: 1.0,
      };
      car.color = getCarColorFn(car);
    }

    result[i] = car;
  }

  return result;
}
