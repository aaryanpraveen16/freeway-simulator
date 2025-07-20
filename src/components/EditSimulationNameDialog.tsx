import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2 } from 'lucide-react';

interface EditSimulationNameDialogProps {
  currentName: string;
  onSave: (newName: string) => void;
  trigger?: React.ReactNode;
}

const EditSimulationNameDialog: React.FC<EditSimulationNameDialogProps> = ({
  currentName,
  onSave,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);

  const handleSave = () => {
    if (name.trim() && name.trim() !== currentName) {
      onSave(name.trim());
      setOpen(false);
    } else {
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setName(currentName);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Edit2 size={16} />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Simulation Name</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="simulation-name">Simulation Name</Label>
            <Input
              id="simulation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a new name for your simulation..."
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSimulationNameDialog;