import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { useSimulations } from '@/hooks/useSimulations';
import { toast } from './ui/use-toast';

interface SaveSimulationDialogProps {
  canSave: boolean;
  trigger?: React.ReactNode;
  simulationParams?: any;
  simulationResults?: any;
}

const SaveSimulationDialog: React.FC<SaveSimulationDialogProps> = ({
  canSave,
  trigger,
  simulationParams = {},
  simulationResults = {}
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { saveSimulation } = useSimulations();

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      const result = await saveSimulation(name, simulationParams, simulationResults);
      if (result) {
        toast({
          title: 'Success',
          description: 'Simulation saved successfully!',
        });
        setOpen(false);
        setName('');
      } else {
        throw new Error('Failed to save simulation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save simulation',
        variant: 'destructive',
      });
      console.error('Save simulation error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="secondary"
      size="sm"
      className="flex items-center gap-2"
      disabled={!canSave}
    >
      <Save size={16} />
      Save Simulation
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Simulation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="simulation-name">Simulation Name</Label>
            <Input
              id="simulation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your simulation..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Simulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSimulationDialog;