import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    folderName: string;
    simulationCount: number;
    onDelete: () => Promise<void>;
}

const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
    isOpen,
    onClose,
    folderName,
    simulationCount,
    onDelete
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setError(null);
        setIsDeleting(true);

        try {
            await onDelete();
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete folder");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Delete Folder?
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <p className="font-medium mb-2">You are about to delete the folder "{folderName}"</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>The folder contains {simulationCount} simulation{simulationCount !== 1 ? 's' : ''}</li>
                                <li>All simulations will be moved to "Uncategorized"</li>
                                <li>No simulation data will be lost</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete Folder"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteFolderDialog;
