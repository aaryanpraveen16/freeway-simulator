import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DeleteFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    folderName: string;
    simulationCount: number;
    onDelete: (deleteAll: boolean) => Promise<void>;
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
    const [deleteAll, setDeleteAll] = useState(false);

    const handleDelete = async () => {
        setError(null);
        setIsDeleting(true);

        try {
            await onDelete(deleteAll);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete folder");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setDeleteAll(false);
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
                                {deleteAll ? (
                                    <li className="text-destructive font-semibold">ALL {simulationCount} simulations will be PERMANENTLY DELETED</li>
                                ) : (
                                    <li>All simulations will be moved to "Uncategorized"</li>
                                )}
                                <li>{deleteAll ? "This action IS destructive and cannot be undone" : "No simulation data will be lost"}</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <div className="flex items-center space-x-2 p-2 rounded-md border bg-muted/20">
                        <Checkbox
                            id="delete-all-sims"
                            checked={deleteAll}
                            onCheckedChange={(checked) => setDeleteAll(checked === true)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="delete-all-sims"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Also delete all simulations in this folder
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Use this to permanently remove all {simulationCount} simulations from the database.
                            </p>
                        </div>
                    </div>

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
                        {isDeleting ? "Deleting..." : deleteAll ? "Delete Everything" : "Delete Folder"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteFolderDialog;
