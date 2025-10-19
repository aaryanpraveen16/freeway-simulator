import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useSimulations } from '@/hooks/useSimulations';
import { toast } from './ui/use-toast';
import { testConnection } from '@/lib/db';

interface SimulationManagerProps {
  onLoadSimulation: (params: any) => void;
  simulationParams?: any;
  simulationResults?: any;
}

export function SimulationManager({ 
  onLoadSimulation, 
  simulationParams = {}, 
  simulationResults = {} 
}: SimulationManagerProps) {
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const { saveSimulation, getSimulations, getSimulation, isLoading, error } = useSimulations();

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testConnection();
      toast({
        title: result.connected ? 'Success' : 'Error',
        description: result.message,
        variant: result.connected ? 'default' : 'destructive',
      });
      if (result.error) {
        console.error('Connection error:', result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test database connection',
        variant: 'destructive',
      });
      console.error('Test connection error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (params: any, results: any) => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for your simulation',
        variant: 'destructive',
      });
      return;
    }

    const result = await saveSimulation(name, params, results);
    if (result) {
      toast({
        title: 'Success',
        description: 'Simulation saved successfully!',
      });
      setIsOpen(false);
      setName('');
      // Refresh the simulations list
      fetchSimulations();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to save simulation',
        variant: 'destructive',
      });
    }
  };

  const fetchSimulations = async () => {
    const data = await getSimulations();
    setSimulations(data);
  };

  const handleLoadSimulation = async (id: string) => {
    const simulation = await getSimulation(id);
    if (simulation) {
      onLoadSimulation(simulation.params);
      setIsOpen(false);
      toast({
        title: 'Success',
        description: 'Simulation loaded successfully!',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Simulations</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Save or Load Simulation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
            <h3 className="font-medium">Database Connection</h3>
            <Button 
              onClick={handleTestConnection} 
              disabled={isTesting}
              variant="outline"
              className="w-full"
            >
              {isTesting ? 'Testing...' : 'Test Database Connection'}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Save Current Simulation</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter simulation name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
              <Button 
                onClick={() => handleSave(simulationParams, simulationResults)} 
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Load Saved Simulation</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {simulations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved simulations found</p>
              ) : (
                simulations.map((sim) => (
                  <div 
                    key={sim.id} 
                    className="p-3 border rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleLoadSimulation(sim.id)}
                  >
                    <div className="font-medium">{sim.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(sim.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error.message}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
