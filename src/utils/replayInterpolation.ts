import { Car, getCarColor } from './trafficSimulation';
import { SimulationReplay, REPLAY_CAR_STRIDE } from './trajectoryRecorder';

/**
 * Reconstructs the full Car[] array for a specific timestamp `targetTime`
 * by interpolating between the two nearest recorded frames.
 */
export function interpolateReplayFrame(
  replay: SimulationReplay,
  targetTime: number,
  freewayLengthKm: number
): Car[] {
  const frames = replay.frames;
  if (!frames || frames.length === 0) return [];

  // Clamp targetTime
  const clampedTime = Math.max(0, Math.min(targetTime, replay.totalDuration || frames[frames.length - 1].t));

  // Binary search for frame indices
  let low = 0;
  let high = frames.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (frames[mid].t < clampedTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const idxB = Math.min(frames.length - 1, Math.max(0, low));
  const idxA = Math.max(0, idxB - 1);

  const frameA = frames[idxA];
  const frameB = frames[idxB];

  // Alpha factor for linear interpolation
  let alpha = 0;
  if (idxA !== idxB && frameB.t > frameA.t) {
    alpha = Math.max(0, Math.min(1, (clampedTime - frameA.t) / (frameB.t - frameA.t)));
  }

  // Pre-index meta for quick car lookup
  const metaMap = new Map(replay.carsMeta.map(m => [m.id, m]));

  // Index frame B's cars for pairing
  const bCarMap = new Map<number, { pos: number; speed: number; lane: number; prevLane: number; lastChange: number; distTraveled: number; accel: number; isOvertaking: boolean }>();
  const countB = Math.floor(frameB.data.length / REPLAY_CAR_STRIDE);
  for (let i = 0; i < countB; i++) {
    const offset = i * REPLAY_CAR_STRIDE;
    bCarMap.set(frameB.data[offset], {
      pos: frameB.data[offset + 1],
      speed: frameB.data[offset + 2],
      lane: frameB.data[offset + 3],
      prevLane: frameB.data[offset + 4],
      lastChange: frameB.data[offset + 5],
      distTraveled: frameB.data[offset + 6],
      accel: frameB.data[offset + 7],
      isOvertaking: frameB.data[offset + 8] === 1,
    });
  }

  const resultCars: Car[] = [];
  const processedCarIds = new Set<number>();

  const countA = Math.floor(frameA.data.length / REPLAY_CAR_STRIDE);
  for (let i = 0; i < countA; i++) {
    const offset = i * REPLAY_CAR_STRIDE;
    const id = frameA.data[offset];
    const posA = frameA.data[offset + 1];
    const speedA = frameA.data[offset + 2];
    const laneA = frameA.data[offset + 3];
    const prevLaneA = frameA.data[offset + 4];
    const lastChangeA = frameA.data[offset + 5];
    const distTraveledA = frameA.data[offset + 6];
    const accelA = frameA.data[offset + 7];
    const isOvertakingA = frameA.data[offset + 8] === 1;

    processedCarIds.add(id);
    const meta = metaMap.get(id);

    const b = bCarMap.get(id);
    let interpPos = posA;
    let interpSpeed = speedA;
    let interpLane = laneA;
    let prevLane = prevLaneA;
    let lastChange = lastChangeA;
    let distTraveled = distTraveledA;
    let accel = accelA;
    let isOvertaking = isOvertakingA;

    if (b) {
      // Periodic wrap-around handling for position
      let deltaPos = b.pos - posA;
      if (deltaPos < -freewayLengthKm / 2) {
        // Wrapped around loop (e.g. from 4.9km to 0.1km)
        deltaPos += freewayLengthKm;
      } else if (deltaPos > freewayLengthKm / 2) {
        deltaPos -= freewayLengthKm;
      }
      interpPos = (posA + deltaPos * alpha) % freewayLengthKm;
      if (interpPos < 0) interpPos += freewayLengthKm;

      interpSpeed = speedA + (b.speed - speedA) * alpha;
      accel = accelA + (b.accel - accelA) * alpha;
      distTraveled = distTraveledA + (b.distTraveled - distTraveledA) * alpha;

      // Use target lane if progress past half
      const rawLane = alpha > 0.5 ? b.lane : laneA;
      interpLane = typeof rawLane === 'number' && !isNaN(rawLane) ? Math.round(rawLane) : 0;
      prevLane = b.prevLane >= 0 ? b.prevLane : prevLaneA;
      lastChange = b.lastChange >= 0 ? b.lastChange : lastChangeA;
      isOvertaking = b.isOvertaking;
    }

    const carObj: Car = {
      id,
      name: meta?.name || `Car ${id}`,
      position: interpPos,
      speed: interpSpeed,
      desiredSpeed: meta?.desiredSpeed || 100,
      color: '#ffffff',
      virtualLength: (meta?.physicalLength || 4.5) + (1.5 * interpSpeed * 1000) / 3600,
      physicalLength: meta?.physicalLength || 4.5,
      distTripPlanned: meta?.distTripPlanned || 5,
      distanceTraveled: distTraveled,
      lane: interpLane,
      driverType: meta?.driverType || 'normal',
      laneChangeProbability: 0.1,
      laneStickiness: 0.8,
      lastLaneChange: lastChange >= 0 ? lastChange : undefined,
      previousLane: prevLane >= 0 ? prevLane : undefined,
      vehicleType: meta?.vehicleType || 'car',
      isOvertaking,
      laneStabilityCounter: 0,
      driverReactionTime: 1.5,
      laneChangeStabilityThreshold: 5,
      acceleration: accel,
      compliance: 1,
    };

    carObj.color = getCarColor(carObj);
    resultCars.push(carObj);
  }

  // Handle cars that only appear in frame B
  for (const [id, b] of bCarMap.entries()) {
    if (!processedCarIds.has(id)) {
      const meta = metaMap.get(id);
      const carObj: Car = {
        id,
        name: meta?.name || `Car ${id}`,
        position: b.pos,
        speed: b.speed,
        desiredSpeed: meta?.desiredSpeed || 100,
        color: '#ffffff',
        virtualLength: (meta?.physicalLength || 4.5) + (1.5 * b.speed * 1000) / 3600,
        physicalLength: meta?.physicalLength || 4.5,
        distTripPlanned: meta?.distTripPlanned || 5,
        distanceTraveled: b.distTraveled,
        lane: b.lane,
        driverType: meta?.driverType || 'normal',
        laneChangeProbability: 0.1,
        laneStickiness: 0.8,
        lastLaneChange: b.lastChange >= 0 ? b.lastChange : undefined,
        previousLane: b.prevLane >= 0 ? b.prevLane : undefined,
        vehicleType: meta?.vehicleType || 'car',
        isOvertaking: b.isOvertaking,
        laneStabilityCounter: 0,
        driverReactionTime: 1.5,
        laneChangeStabilityThreshold: 5,
        acceleration: b.accel,
        compliance: 1,
      };
      carObj.color = getCarColor(carObj);
      resultCars.push(carObj);
    }
  }

  return resultCars;
}
