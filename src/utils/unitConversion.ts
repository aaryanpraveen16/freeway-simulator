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
        toDisplay: (mph: number) => mph * 1.60934, // mph to km/h
        fromDisplay: (kmh: number) => kmh / 1.60934, // km/h to mph
        unit: 'km/h'
      },
      distance: {
        toDisplay: (miles: number) => miles * 1.60934, // miles to km
        fromDisplay: (km: number) => km / 1.60934, // km to miles
        unit: 'km'
      },
      density: {
        toDisplay: (carsPerMile: number) => carsPerMile / 1.60934, // cars/mile to cars/km
        fromDisplay: (carsPerKm: number) => carsPerKm * 1.60934, // cars/km to cars/mile
        unit: 'cars/km'
      }
    };
  }
  
  // Imperial system (default)
  return {
    speed: {
      toDisplay: (mph: number) => mph,
      fromDisplay: (mph: number) => mph,
      unit: 'mph'
    },
    distance: {
      toDisplay: (miles: number) => miles,
      fromDisplay: (miles: number) => miles,
      unit: 'miles'
    },
    density: {
      toDisplay: (carsPerMile: number) => carsPerMile,
      fromDisplay: (carsPerMile: number) => carsPerMile,
      unit: 'cars/mile'
    }
  };
};

// Conversion functions for common values
export const convertSpeed = (value: number, from: UnitSystem, to: UnitSystem): number => {
  if (from === to) return value;
  if (from === 'imperial' && to === 'metric') return value * 1.60934;
  if (from === 'metric' && to === 'imperial') return value / 1.60934;
  return value;
};

export const convertDistance = (value: number, from: UnitSystem, to: UnitSystem): number => {
  if (from === to) return value;
  if (from === 'imperial' && to === 'metric') return value * 1.60934;
  if (from === 'metric' && to === 'imperial') return value / 1.60934;
  return value;
};

export const convertDensity = (value: number, from: UnitSystem, to: UnitSystem): number => {
  if (from === to) return value;
  if (from === 'imperial' && to === 'metric') return value / 1.60934;
  if (from === 'metric' && to === 'imperial') return value * 1.60934;
  return value;
};