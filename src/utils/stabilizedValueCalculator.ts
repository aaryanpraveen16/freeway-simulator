
export interface StabilizedValueResult {
  value: number;
  isStabilized: boolean;
  confidenceLevel: number;
}

export const calculateStabilizedValue = (
  data: number[],
  windowSize: number = 10,
  stabilityThreshold: number = 0.05
): StabilizedValueResult => {
  if (data.length < windowSize * 2) {
    return {
      value: data.length > 0 ? data[data.length - 1] : 0,
      isStabilized: false,
      confidenceLevel: 0
    };
  }

  // Calculate moving averages
  const movingAverages: number[] = [];
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    movingAverages.push(average);
  }

  // Check for stability in the last portion of data
  const recentAverages = movingAverages.slice(-Math.min(5, movingAverages.length));
  if (recentAverages.length < 2) {
    return {
      value: movingAverages[movingAverages.length - 1] || 0,
      isStabilized: false,
      confidenceLevel: 0
    };
  }

  // Calculate variance in recent averages
  const recentMean = recentAverages.reduce((sum, val) => sum + val, 0) / recentAverages.length;
  const variance = recentAverages.reduce((sum, val) => sum + Math.pow(val - recentMean, 2), 0) / recentAverages.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Determine if stabilized (low variance relative to mean)
  const coefficientOfVariation = recentMean !== 0 ? standardDeviation / Math.abs(recentMean) : 1;
  const isStabilized = coefficientOfVariation < stabilityThreshold;
  
  // Calculate confidence level (inverse of coefficient of variation, capped at 1)
  const confidenceLevel = Math.min(1, Math.max(0, 1 - coefficientOfVariation));

  return {
    value: recentMean,
    isStabilized,
    confidenceLevel
  };
};

export const extractDataValues = (dataHistory: any[], dataKey: string): number[] => {
  return dataHistory.map(point => point[dataKey] || 0).filter(val => !isNaN(val));
};
