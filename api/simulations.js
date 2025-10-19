// api/simulations.js
// Vercel Serverless Function to interact with NeonDB for simulations
import { neonDBService } from '../src/services/neonDBService';

export default async (req, res) => {
  try {
    switch (req.method) {
      case 'GET':
        // Retrieve simulations
        const simulations = await neonDBService.getAllSimulations();
        res.status(200).json(simulations);
        break;

      case 'POST':
        // Add a new simulation
        const newSimulation = req.body;
        if (!newSimulation) {
          res.status(400).json({ error: 'Simulation data is required' });
          return;
        }
        const addedSimulation = await neonDBService.saveSimulation(newSimulation);
        res.status(201).json(addedSimulation);
        break;

      case 'DELETE':
        // Delete a simulation
        const { id } = req.query;
        if (!id) {
          res.status(400).json({ error: 'Simulation ID is required' });
          return;
        }
        await neonDBService.deleteSimulation(id);
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in simulations API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};