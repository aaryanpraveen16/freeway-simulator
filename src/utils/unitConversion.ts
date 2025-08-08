// Unit conversion utilities for the traffic simulation

export type UnitSystem = 'metric' | 'imperial';

export interface UnitConversions {
  speed: {
    toDisplay: (mphValue: number) => number;
    fromDisplay: (displayValue: number) => number;
    unit: string;
  };
  distance: {
    toDisplay: (milesValue: number) => number;
    fromDisplay: (displayValue: number) => number;
    unit: string;
  };
  density: {
    toDisplay: (carsPerMileValue: number) => number;
    fromDisplay: (displayValue: number) => number;
    unit: string;
  };
}

export const getUnitConversions = (unitSystem: UnitSystem): UnitConversions => {
  if (unitSystem === 'metric') {
    return {
      speed: {
        toDisplay: (kmh: number) => kmh, // Already in km/h
        fromDisplay: (kmh: number) => kmh, // Already in km/h
        unit: 'km/h'
      },
      distance: {
        toDisplay: (km: number) => km, // Already in km
        fromDisplay: (km: number) => km, // Already in km
        unit: 'km'
      },
      density: {
        toDisplay: (carsPerKm: number) => carsPerKm, // Already in cars/km
        fromDisplay: (carsPerKm: number) => carsPerKm, // Already in cars/km
        unit: 'cars/km'
      }
    };
  }
  
  // Imperial system (conversion from internal metric)
  return {
    speed: {
      toDisplay: (kmh: number) => kmh / 1.60934, // km/h to mph
      fromDisplay: (mph: number) => mph * 1.60934, // mph to km/h
      unit: 'mph'
    },
    distance: {
      toDisplay: (km: number) => km / 1.60934, // km to miles
      fromDisplay: (miles: number) => miles * 1.60934, // miles to km
      unit: 'miles'
    },
    density: {
      toDisplay: (carsPerKm: number) => carsPerKm * 1.60934, // cars/km to cars/mile
      fromDisplay: (carsPerMile: number) => carsPerMile / 1.60934, // cars/mile to cars/km
      unit: 'cars/mile'
    }
  };
};

// Conversion functions for common values (all values are in internal metric units)
export const convertSpeed = (value: number, from: UnitSystem, to: UnitSystem): number => {
  if (from === to) return value;
  if (from === 'metric' && to === 'imperial') return value / 1.60934; // km/h to mph
  return value * 1.60934; // mph to km/h
};

export const convertDistance = (value: number, from: UnitSystem, to: UnitSystem): number => {
  if (from === to) return value;
  if (from === 'metric' && to === 'imperial') return value / 1.60934; // km to miles
  return value * 1.60934; // miles to km
};

export const convertDensity = (value: number, from: UnitSystem, to: UnitSystem): number => {
  if (from === to) return value;
  if (from === 'metric' && to === 'imperial') return value * 1.60934; // cars/km to cars/mile
  return value / 1.60934; // cars/mile to cars/km
};