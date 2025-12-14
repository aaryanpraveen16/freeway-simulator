import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { simulationService } from "@/services/simulationService";

interface SaveSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, folder?: string) => void;
  defaultName?: string;
}

export const SaveSimulationDialog: React.FC<SaveSimulationDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  defaultName = ""
}) => {
  const [name, setName] = useState(defaultName);
  const [folderMode, setFolderMode] = useState<'none' | 'existing' | 'new'>('none');
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [existingFolders, setExistingFolders] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setFolderMode('none');
      setSelectedFolder("");
      setNewFolderName("");
      // Fetch existing folders
      loadFolders();
    }
  }, [open, defaultName]);

  const loadFolders = async () => {
    try {
      const simulations = await simulationService.getAllSimulations();
      const folders = Array.from(new Set(simulations.map(s => s.folder).filter(f => f))) as string[];
      setExistingFolders(folders.sort());
    } catch (error) {
      console.error("Failed to load folders:", error);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    let folder: string | undefined = undefined;
    if (folderMode === 'existing') {
      folder = selectedFolder;
    } else if (folderMode === 'new') {
      folder = newFolderName.trim();
    }

    onSave(name, folder);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Simulation</DialogTitle>
          <DialogDescription>
            Enter a name and choose a folder location for your simulation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Simulation Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Simulation"
            />
          </div>

          <div className="grid gap-2">
            <Label>Folder Location</Label>
            <RadioGroup value={folderMode} onValueChange={(v) => setFolderMode(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">No Folder (Root)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" disabled={existingFolders.length === 0} />
                <Label htmlFor="existing" className={existingFolders.length === 0 ? "text-muted-foreground" : ""}>
                  Existing Folder
                </Label>
              </div>
              {folderMode === 'existing' && (
                <div className="ml-6">
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingFolders.map(folder => (
                        <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new">New Folder</Label>
              </div>
              {folderMode === 'new' && (
                <div className="ml-6">
                  <Input
                    placeholder="Folder Name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
              )}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || (folderMode === 'new' && !newFolderName.trim()) || (folderMode === 'existing' && !selectedFolder)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};