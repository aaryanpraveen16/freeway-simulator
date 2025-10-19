import { useState } from 'react';
import { saveSimulation, getSimulations, getSimulation } from '@/lib/db';

export const useSimulations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveCurrentSimulation = async (name: string, params: any, results: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await saveSimulation({ name, params, results });
      if (!response.success) throw new Error('Failed to save simulation');
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSimulations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getSimulations();
      if (!response.success) throw new Error('Failed to fetch simulations');
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSimulation = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getSimulation(id);
      if (!response.success) throw new Error('Simulation not found');
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveSimulation: saveCurrentSimulation,
    getSimulations: fetchSimulations,
    getSimulation: fetchSimulation,
    isLoading,
    error,
  };
};
