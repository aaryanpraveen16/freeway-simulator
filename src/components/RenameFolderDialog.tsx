import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FolderEdit } from "lucide-react";

interface RenameFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentFolderName: string;
    existingFolders: string[];
    simulationCount: number;
    onRename: (newName: string) => Promise<void>;
}

const RenameFolderDialog: React.FC<RenameFolderDialogProps> = ({
    isOpen,
    onClose,
    currentFolderName,
    existingFolders,
    simulationCount,
    onRename
}) => {
    const [newName, setNewName] = useState(currentFolderName);
    const [error, setError] = useState<string | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);

    const handleRename = async () => {
        // Validation
        const trimmedName = newName.trim();

        if (!trimmedName) {
            setError("Folder name cannot be empty");
            return;
        }

        if (trimmedName === currentFolderName) {
            setError("New name is the same as current name");
            return;
        }

        if (existingFolders.includes(trimmedName)) {
            setError("A folder with this name already exists");
            return;
        }

        setError(null);
        setIsRenaming(true);

        try {
            await onRename(trimmedName);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to rename folder");
        } finally {
            setIsRenaming(false);
        }
    };

    const handleClose = () => {
        setNewName(currentFolderName);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderEdit className="h-5 w-5" />
                        Rename Folder
                    </DialogTitle>
                    <DialogDescription>
                        Rename "{currentFolderName}" folder containing {simulationCount} simulation{simulationCount !== 1 ? 's' : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="folderName">New Folder Name</Label>
                        <Input
                            id="folderName"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isRenaming) {
                                    handleRename();
                                }
                            }}
                            placeholder="Enter new folder name"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isRenaming}>
                        Cancel
                    </Button>
                    <Button onClick={handleRename} disabled={isRenaming}>
                        {isRenaming ? "Renaming..." : "Rename Folder"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RenameFolderDialog;
