import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FolderPlus, Folder } from 'lucide-react';

interface MoveToFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingFolders: string[];
    onMove: (folderName: string) => void;
    selectedCount: number;
}

const MoveToFolderDialog: React.FC<MoveToFolderDialogProps> = ({
    open,
    onOpenChange,
    existingFolders,
    onMove,
    selectedCount
}) => {
    const [mode, setMode] = useState<'existing' | 'new'>(existingFolders.length > 0 ? 'existing' : 'new');
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [newFolderName, setNewFolderName] = useState<string>('');

    useEffect(() => {
        if (open) {
            setMode(existingFolders.length > 0 ? 'existing' : 'new');
            setSelectedFolder('');
            setNewFolderName('');
        }
    }, [open, existingFolders.length]);

    const handleMove = () => {
        if (mode === 'existing' && selectedFolder) {
            onMove(selectedFolder);
            onOpenChange(false);
        } else if (mode === 'new' && newFolderName.trim()) {
            onMove(newFolderName.trim());
            onOpenChange(false);
        }
    };

    const isValid = (mode === 'existing' && !!selectedFolder) || (mode === 'new' && !!newFolderName.trim());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Move {selectedCount} Simulation{selectedCount !== 1 ? 's' : ''} to Folder</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'existing' | 'new')} className="flex flex-col space-y-3">

                        {existingFolders.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="existing" id="mode-existing" />
                                <div className="grid gap-1.5 leading-none flex-1">
                                    <Label htmlFor="mode-existing" className="cursor-pointer font-medium">
                                        Select existing folder
                                    </Label>
                                    {mode === 'existing' && (
                                        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue placeholder="Select a folder" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {existingFolders.map(folder => (
                                                    <SelectItem key={folder} value={folder}>
                                                        <div className="flex items-center gap-2">
                                                            <Folder size={16} className="text-blue-500" />
                                                            {folder}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new" id="mode-new" />
                            <div className="grid gap-1.5 leading-none flex-1">
                                <Label htmlFor="mode-new" className="cursor-pointer font-medium">
                                    Create new folder
                                </Label>
                                {mode === 'new' && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="relative flex-1">
                                            <FolderPlus className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                placeholder="Folder name"
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                className="pl-9"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && isValid) {
                                                        handleMove();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleMove} disabled={!isValid}>
                        Move Simulations
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MoveToFolderDialog;
