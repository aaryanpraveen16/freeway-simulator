import { neon } from '@neondatabase/serverless';

type SimulationData = {
  id?: string;
  name: string;
  params: Record<string, any>;
  results: any;
  createdAt?: string;
};

// Initialize the NeonDB client
export const sql = neon(import.meta.env.VITE_NEON_DB!);

// Test database connection
export const testConnection = async () => {
  try {
    const result = await sql`SELECT 1 as test`;
    return { 
      connected: true, 
      message: 'Successfully connected to the database',
      version: result[0]?.test === 1 ? 'Connection test passed' : 'Unexpected response'
    };
  } catch (error) {
    return { 
      connected: false, 
      message: 'Failed to connect to the database',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const saveSimulation = async (data: Omit<SimulationData, 'id' | 'createdAt'>) => {
  try {
    const result = await sql`
      INSERT INTO simulations (name, params, results, created_at)
      VALUES (${data.name}, ${JSON.stringify(data.params)}, ${JSON.stringify(data.results)}, NOW())
      RETURNING id, created_at as "createdAt"
    `;
    return { success: true, data: { id: result[0].id, createdAt: result[0].createdAt } };
  } catch (error) {
    console.error('Error saving simulation:', error);
    return { success: false, error };
  }
};

export const getSimulations = async () => {
  try {
    const result = await sql`
      SELECT id, name, params, results, created_at as "createdAt" 
      FROM simulations 
      ORDER BY created_at DESC
    `;
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching simulations:', error);
    return { success: false, error };
  }
};

export const getSimulation = async (id: string) => {
  try {
    const result = await sql`
      SELECT id, name, params, results, created_at as "createdAt"
      FROM simulations 
      WHERE id = ${id}
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error fetching simulation:', error);
    return { success: false, error };
  }
};
